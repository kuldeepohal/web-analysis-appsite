function textContent(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function count(html, regex) {
  return (html.match(regex) || []).length;
}

function extractMeta(html, name) {
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i');
  return (html.match(pattern)?.[1] || '').trim();
}

function extractLinks(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(match => ({
    href: match[1],
    text: textContent(match[2]).slice(0, 80),
  }));
}

function isLikelyInternal(target, href) {
  try {
    const parsed = new URL(href, target.href);
    return parsed.hostname === target.hostname;
  } catch {
    return false;
  }
}

function hasKeyword(text, keyword) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) return Response.json({ error: 'Enter a website URL.' }, { status: 400 });

    let target;
    try { target = new URL(url.startsWith('http') ? url : `https://${url}`); }
    catch { return Response.json({ error: 'That URL is not valid.' }, { status: 400 }); }

    const started = Date.now();
    const response = await fetch(target.href, {
      headers: { 'User-Agent': 'A2Z-Website-Analyzer/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    const html = await response.text();
    const elapsed = Date.now() - started;
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
    const description = extractMeta(html, 'description');
    const ogTitle = extractMeta(html, 'og:title');
    const ogDescription = extractMeta(html, 'og:description');
    const h1 = count(html, /<h1\b/gi);
    const h2 = count(html, /<h2\b/gi);
    const images = count(html, /<img\b/gi);
    const imagesWithoutAlt = count(html, /<img(?![^>]*\balt\s*=)[^>]*>/gi);
    const links = count(html, /<a\b/gi);
    const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
    const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const robotsMeta = /<meta[^>]+name=["']robots["']/i.test(html);
    const sitemapLink = /sitemap\.xml/i.test(html);
    const schema = /application\/ld\+json/i.test(html);
    const forms = count(html, /<form\b/gi);
    const phoneLinks = count(html, /href=["']tel:/gi);
    const whatsappLinks = count(html, /wa\.me|whatsapp\.com/gi);
    const contactKeywords = count(html, /contact|get in touch|book a call|request a quote|enquire/i);
    const internalLinks = extractLinks(html).filter(link => isLikelyInternal(target, link.href));
    const brokenInternalLinks = internalLinks.filter(link => {
      try {
        const parsed = new URL(link.href, target.href);
        return parsed.pathname === '#' || parsed.href.endsWith('#') || parsed.href.includes('javascript:');
      } catch {
        return true;
      }
    }).length;
    const mixedContent = target.protocol === 'https:' ? count(html, /http:\/\/[^\s"'<>]+/gi) : 0;
    const https = target.protocol === 'https:';
    const robots = /robots\.txt/i.test(html) ? true : false;
    const securityHeaders = {
      hsts: response.headers.has('strict-transport-security'),
      csp: response.headers.has('content-security-policy'),
      xfo: response.headers.has('x-frame-options'),
      referrerPolicy: response.headers.has('referrer-policy'),
      permissionsPolicy: response.headers.has('permissions-policy'),
    };
    const contentText = textContent(html);
    const text = textContent(html);
    const words = text ? text.split(/\s+/).length : 0;
    const keywordCoverage = ['services', 'about', 'contact', 'pricing', 'testimonials', 'blog', 'book', 'quote']
      .filter(keyword => hasKeyword(contentText, keyword)).length;
    const ctaSignals = phoneLinks + whatsappLinks + forms + contactKeywords;
    const accessibleImages = images === 0 || imagesWithoutAlt === 0;

    const checks = [
      { area: 'SEO', label: 'Page title', pass: !!title && title.length >= 20 && title.length <= 65, detail: title ? `${title.length} characters` : 'Missing title' },
      { area: 'SEO', label: 'Meta description', pass: !!description && description.length >= 70 && description.length <= 165, detail: description ? `${description.length} characters` : 'Missing description' },
      { area: 'SEO', label: 'H1 structure', pass: h1 === 1, detail: `${h1} H1 tag${h1 === 1 ? '' : 's'} found` },
      { area: 'SEO', label: 'H2 structure', pass: h2 >= 2, detail: `${h2} H2 tag${h2 === 1 ? '' : 's'} found` },
      { area: 'SEO', label: 'Canonical URL', pass: canonical, detail: canonical ? 'Present' : 'Missing' },
      { area: 'SEO', label: 'Indexability hints', pass: robotsMeta || canonical, detail: robotsMeta ? 'Robots meta detected' : 'Consider robots meta and canonical tags' },
      { area: 'Mobile', label: 'Viewport', pass: viewport, detail: viewport ? 'Present' : 'Missing mobile viewport' },
      { area: 'Accessibility', label: 'Image alt text', pass: accessibleImages, detail: images ? `${imagesWithoutAlt} of ${images} images need alt text` : 'No images detected' },
      { area: 'Accessibility', label: 'Readable content', pass: words >= 300, detail: `${words} visible words detected` },
      { area: 'Performance', label: 'Response time', pass: elapsed < 1500, detail: `${elapsed} ms from analyzer server` },
      { area: 'Performance', label: 'Image optimization', pass: images === 0 || images <= 20, detail: `${images} image${images === 1 ? '' : 's'} detected` },
      { area: 'Security', label: 'HTTPS', pass: https, detail: https ? 'Secure transport' : 'Use HTTPS' },
      { area: 'Security', label: 'Security headers', pass: Object.values(securityHeaders).filter(Boolean).length >= 2, detail: `${Object.values(securityHeaders).filter(Boolean).length} common headers present` },
      { area: 'Security', label: 'Mixed content', pass: mixedContent === 0, detail: mixedContent === 0 ? 'No obvious mixed-content URLs' : `${mixedContent} http:// references found` },
      { area: 'Content', label: 'CTA strength', pass: ctaSignals >= 2, detail: `${ctaSignals} CTA/contact signals detected` },
      { area: 'Content', label: 'Keyword coverage', pass: keywordCoverage >= 4, detail: `${keywordCoverage} core sections detected` },
      { area: 'Technical', label: 'Schema markup', pass: schema, detail: schema ? 'JSON-LD detected' : 'Missing schema markup' },
      { area: 'Technical', label: 'Sitemap/robots', pass: sitemapLink || robots, detail: sitemapLink || robots ? 'Sitemap or robots signal detected' : 'Could not find sitemap/robots hints' },
    ];

    const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);
    const suggestions = checks.filter(c => !c.pass).map(c => {
      const tips = {
        'Page title': 'Write a unique, specific title around 50–60 characters with the main search intent.',
        'Meta description': 'Add a compelling 120-155 character description explaining the page value and call to action.',
        'H1 structure': 'Use one clear H1 that states what the page is about, then structure sections with H2/H3 headings.',
        'H2 structure': 'Add supporting H2 sections for services, benefits, proof, FAQs, and conversion points.',
        'Canonical URL': 'Add a canonical link to the preferred URL to reduce duplicate-indexing problems.',
        'Indexability hints': 'Add a robots meta tag and confirm the preferred page is indexable.',
        'Viewport': 'Add a responsive viewport meta tag so the site renders correctly on phones.',
        'Image alt text': 'Give meaningful images concise alt text; mark decorative images as empty alt.',
        'Readable content': 'Add genuinely useful, audience-focused content. Avoid padding pages just to hit a word count.',
        'HTTPS': 'Serve the site over HTTPS and redirect HTTP traffic to HTTPS.',
        'Security headers': 'Add security headers such as HSTS, CSP, X-Frame-Options, Referrer-Policy, and Permissions-Policy.',
        'Mixed content': 'Replace any http:// assets with https:// versions to avoid browser warnings.',
        'CTA strength': 'Add clear conversion actions such as WhatsApp, phone, booking, quote, or contact buttons.',
        'Keyword coverage': 'Expand the page with service, trust, location, and FAQ sections that match target search intent.',
        'Schema markup': 'Add schema markup such as Organization, LocalBusiness, FAQ, Product, or Service JSON-LD.',
        'Sitemap/robots': 'Expose sitemap.xml and robots.txt so search engines can discover and crawl your site efficiently.',
        'Response time': 'Investigate server response time, caching, image weight, third-party scripts and hosting performance.',
        'Image optimization': 'Compress large images, serve modern formats, and lazy-load non-critical media.'
      };
      return { area: c.area, title: c.label, advice: tips[c.label] };
    });

    const auditSummary = {
      seo: Math.round((checks.filter(c => c.area === 'SEO' && c.pass).length / checks.filter(c => c.area === 'SEO').length) * 100),
      performance: Math.round((checks.filter(c => c.area === 'Performance' && c.pass).length / checks.filter(c => c.area === 'Performance').length) * 100),
      mobile: Math.round((checks.filter(c => c.area === 'Mobile' && c.pass).length / checks.filter(c => c.area === 'Mobile').length) * 100),
      accessibility: Math.round((checks.filter(c => c.area === 'Accessibility' && c.pass).length / checks.filter(c => c.area === 'Accessibility').length) * 100),
      security: Math.round((checks.filter(c => c.area === 'Security' && c.pass).length / checks.filter(c => c.area === 'Security').length) * 100),
      content: Math.round((checks.filter(c => c.area === 'Content' && c.pass).length / checks.filter(c => c.area === 'Content').length) * 100),
      technical: Math.round((checks.filter(c => c.area === 'Technical' && c.pass).length / checks.filter(c => c.area === 'Technical').length) * 100),
    };

    const reportHighlights = [
      'SEO Audit & Improvement Plan',
      'AI Content Audit',
      'Lead Generation Audit',
      'Security & Technical Audit',
      'Technology Detector',
      'Website Monitoring Readiness',
    ];

    return Response.json({
      url: response.url || target.href,
      status: response.status,
      score,
      elapsed,
      summary: { title, description, ogTitle, ogDescription, h1, h2, images, links, words, viewport, canonical, https, robots, schema, sitemapLink, securityHeaders, forms, phoneLinks, whatsappLinks },
      auditSummary,
      reportHighlights,
      checks,
      suggestions,
    });
  } catch (error) {
    return Response.json({ error: `Could not analyze the website: ${error.message}` }, { status: 502 });
  }
}
