function textContent(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function count(html, regex) {
  return (html.match(regex) || []).length;
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
    const description = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || '').trim();
    const h1 = count(html, /<h1\b/gi);
    const images = count(html, /<img\b/gi);
    const imagesWithoutAlt = count(html, /<img(?![^>]*\balt\s*=)[^>]*>/gi);
    const links = count(html, /<a\b/gi);
    const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
    const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const https = target.protocol === 'https:';
    const robots = /robots\.txt/i.test(html) ? true : null;
    const text = textContent(html);
    const words = text ? text.split(/\s+/).length : 0;

    const checks = [
      { area: 'SEO', label: 'Page title', pass: !!title && title.length >= 20 && title.length <= 65, detail: title ? `${title.length} characters` : 'Missing title' },
      { area: 'SEO', label: 'Meta description', pass: !!description && description.length >= 70 && description.length <= 165, detail: description ? `${description.length} characters` : 'Missing description' },
      { area: 'SEO', label: 'Single H1', pass: h1 === 1, detail: `${h1} H1 tag${h1 === 1 ? '' : 's'} found` },
      { area: 'SEO', label: 'Canonical URL', pass: canonical, detail: canonical ? 'Present' : 'Missing' },
      { area: 'Mobile', label: 'Viewport', pass: viewport, detail: viewport ? 'Present' : 'Missing mobile viewport' },
      { area: 'Accessibility', label: 'Image alt text', pass: images === 0 || imagesWithoutAlt === 0, detail: images ? `${imagesWithoutAlt} of ${images} images need alt text` : 'No images detected' },
      { area: 'Security', label: 'HTTPS', pass: https, detail: https ? 'Secure transport' : 'Use HTTPS' },
      { area: 'Content', label: 'Useful text content', pass: words >= 300, detail: `${words} visible words detected` },
      { area: 'Performance', label: 'Initial response', pass: elapsed < 1500, detail: `${elapsed} ms from analyzer server` },
    ];

    const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);
    const suggestions = checks.filter(c => !c.pass).map(c => {
      const tips = {
        'Page title': 'Write a unique, specific title around 50–60 characters with the main search intent.',
        'Meta description': 'Add a compelling 120–155 character description explaining the page value and call to action.',
        'Single H1': 'Use one clear H1 that states what the page is about, then structure sections with H2/H3 headings.',
        'Canonical URL': 'Add a canonical link to the preferred URL to reduce duplicate-indexing problems.',
        'Viewport': 'Add a responsive viewport meta tag so the site renders correctly on phones.',
        'Image alt text': 'Give meaningful images concise alt text; mark decorative images as empty alt.',
        'HTTPS': 'Serve the site over HTTPS and redirect HTTP traffic to HTTPS.',
        'Useful text content': 'Add genuinely useful, audience-focused content. Avoid padding pages just to hit a word count.',
        'Initial response': 'Investigate server response time, caching, image weight, third-party scripts and hosting performance.'
      };
      return { area: c.area, title: c.label, advice: tips[c.label] };
    });

    return Response.json({
      url: response.url || target.href,
      status: response.status,
      score,
      elapsed,
      summary: { title, description, h1, images, links, words, viewport, canonical, https, robots },
      checks,
      suggestions,
    });
  } catch (error) {
    return Response.json({ error: `Could not analyze the website: ${error.message}` }, { status: 502 });
  }
}
