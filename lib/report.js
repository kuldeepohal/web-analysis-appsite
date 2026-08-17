import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function safe(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function wrap(text, maxChars = 92) {
  const words = safe(text).split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    if (!word) continue;
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export async function createWebsiteReport(data) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.06, 0.12, 0.23);
  const blue = rgb(0.12, 0.35, 0.72);
  const light = rgb(0.94, 0.96, 0.98);
  const green = rgb(0.08, 0.48, 0.28);
  const red = rgb(0.72, 0.12, 0.12);
  const gray = rgb(0.35, 0.39, 0.45);
  const white = rgb(1, 1, 1);
  const width = 595.28;
  const height = 841.89;

  let page = pdf.addPage([width, height]);
  let y = height - 52;

  const newPage = () => {
    page = pdf.addPage([width, height]);
    y = height - 48;
  };
  const ensure = (needed = 55) => {
    if (y < needed) newPage();
  };
  const text = (value, x, size = 10, font = regular, color = navy) => page.drawText(safe(value), { x, y, size, font, color });
  const heading = (value) => {
    ensure(70);
    text(value, 42, 17, bold, navy);
    y -= 25;
  };
  const paragraph = (value, size = 9.5) => {
    for (const line of wrap(value, 88)) {
      ensure(35);
      text(line, 42, size, regular, gray);
      y -= size + 5;
    }
    y -= 5;
  };
  const rule = () => {
    page.drawLine({ start: { x: 42, y }, end: { x: width - 42, y }, thickness: 0.7, color: light });
    y -= 12;
  };

  page.drawRectangle({ x: 0, y: height - 250, width, height: 250, color: navy });
  page.drawText('A2Z LEARNING SOLUTIONS', { x: 42, y: height - 58, size: 12, font: bold, color: white });
  page.drawText('WEBSITE ANALYSIS REPORT', { x: 42, y: height - 122, size: 27, font: bold, color: white });
  page.drawText('Website Growth & Intelligence Audit', {
    x: 42,
    y: height - 150,
    size: 12,
    font: regular,
    color: rgb(0.82, 0.87, 0.95),
  });
  page.drawText(safe(data.url), { x: 42, y: height - 205, size: 11, font: regular, color: white });

  y = height - 292;
  text('Overall Website Growth Score', 42, 11, bold, gray);
  y -= 48;
  text(`${data.score ?? 0}/100`, 42, 34, bold, blue);
  y -= 45;
  paragraph(
    `Report generated ${new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}. This automated report identifies practical opportunities across SEO, performance, mobile readiness, accessibility, security, content and technical health.`,
    10,
  );
  rule();
  heading('Executive Snapshot');
  paragraph(
    `The analyzed page returned HTTP ${data.status ?? '-'} and the analyzer measured approximately ${data.elapsed ?? '-'} ms server response time. Use the recommendations in this report as an implementation checklist rather than as a substitute for a full specialist audit.`,
  );

  heading('Score Dashboard');
  const scores = data.auditSummary || {};
  const labels = [
    ['SEO', scores.seo],
    ['Performance', scores.performance],
    ['Mobile', scores.mobile],
    ['Accessibility', scores.accessibility],
    ['Security', scores.security],
    ['Content', scores.content],
    ['Technical', scores.technical],
  ];
  let sx = 42;
  for (const [label, value] of labels) {
    ensure(100);
    page.drawRectangle({ x: sx, y: y - 42, width: 68, height: 54, color: light });
    page.drawText(`${value ?? 0}`, {
      x: sx + 22,
      y: y - 18,
      size: 18,
      font: bold,
      color: (value ?? 0) >= 70 ? green : red,
    });
    page.drawText(label, { x: sx + 7, y: y - 35, size: 7.5, font: bold, color: gray });
    sx += 73;
    if (sx > 500) {
      sx = 42;
      y -= 68;
    }
  }
  y -= 78;

  heading('Key Website Facts');
  const summary = data.summary || {};
  const facts = [
    ['Page title', summary.title || 'Missing'],
    ['Meta description', summary.description || 'Missing'],
    ['H1 tags', summary.h1],
    ['H2 tags', summary.h2],
    ['Visible words', summary.words],
    ['Images', summary.images],
    ['Links', summary.links],
    ['Forms', summary.forms],
    ['HTTPS', summary.https ? 'Enabled' : 'Not detected'],
    ['Schema', summary.schema ? 'Detected' : 'Not detected'],
    ['Sitemap', summary.sitemapLink || summary.robots ? 'Hint detected' : 'Not detected'],
  ];
  for (const [label, value] of facts) {
    ensure(34);
    text(`${label}:`, 48, 9, bold, navy);
    text(safe(value), 150, 9, regular, gray);
    y -= 17;
  }

  newPage();
  heading('Detailed Audit Findings');
  for (const check of data.checks || []) {
    ensure(58);
    const pass = !!check.pass;
    page.drawCircle({ x: 51, y: y + 2, size: 6, color: pass ? green : red });
    text(`${check.label} - ${check.area}`, 65, 9.5, bold, navy);
    y -= 14;
    paragraph(`${pass ? 'PASS' : 'ACTION REQUIRED'}: ${check.detail}`, 8.8);
  }

  newPage();
  heading('Priority Recommendations');
  const suggestions = data.suggestions || [];
  if (!suggestions.length) {
    paragraph('No major heuristic issues were detected by the current analyzer. Continue monitoring and improve conversion, content and technical quality over time.');
  }
  suggestions.forEach((item, index) => {
    ensure(80);
    text(`${index + 1}. ${item.title}`, 42, 11, bold, navy);
    y -= 17;
    text(`AREA: ${item.area}`, 42, 8, bold, blue);
    y -= 13;
    paragraph(item.advice, 9.2);
  });

  heading('Recommended 30-Day Action Plan');
  [
    'Days 1-7: Resolve critical SEO, HTTPS, mobile, accessibility and broken or invalid-link issues.',
    'Days 8-14: Improve titles, descriptions, headings, schema, internal linking and conversion CTAs.',
    'Days 15-21: Optimize images, page weight, scripts, caching and server response performance.',
    'Days 22-30: Review analytics and search performance, publish supporting content and re-run the audit.',
  ].forEach((item) => paragraph(item));

  newPage();
  heading('About This Report');
  paragraph(
    'This report is generated by the A2Z Learning Solutions Website Growth & Intelligence Platform. Automated checks are based on the accessible HTML response and HTTP headers of the analyzed URL. Some areas, including Core Web Vitals, real-world accessibility, backlink authority and advanced security testing, require deeper specialist or browser-based testing.',
  );
  heading('Next Steps');
  paragraph(
    'Use this report to prioritize improvements, then re-run the analysis after implementation. A2Z Learning Solutions can extend this audit with SEO improvement plans, AI content audits, competitor analysis, lead-generation audits and ongoing website monitoring.',
  );
  page.drawRectangle({ x: 42, y: 145, width: width - 84, height: 72, color: light });
  page.drawText('A2Z LEARNING SOLUTIONS', { x: 58, y: 190, size: 13, font: bold, color: navy });
  page.drawText('Website Growth & Intelligence Services', { x: 58, y: 170, size: 10, font: regular, color: gray });
  page.drawText('Analyze • Diagnose • Recommend • Improve • Monitor', { x: 58, y: 151, size: 9, font: bold, color: blue });

  for (const currentPage of pdf.getPages()) {
    currentPage.drawText(`A2Z Learning Solutions • Website Analysis Report • Page ${pdf.getPages().indexOf(currentPage) + 1}`, {
      x: 42,
      y: 22,
      size: 7,
      font: regular,
      color: gray,
    });
  }

  return Buffer.from(await pdf.save());
}
