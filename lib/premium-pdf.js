import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { buildPremiumReport } from './premium-report';

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

function wrap(value, max = 92) {
  const words = clean(value).split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export async function createPremiumWebsiteReport(data, plan = 'professional') {
  const premium = buildPremiumReport(data, plan);
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.04, 0.09, 0.18);
  const blue = rgb(0.08, 0.32, 0.68);
  const light = rgb(0.93, 0.96, 0.99);
  const gray = rgb(0.34, 0.39, 0.47);
  const green = rgb(0.08, 0.48, 0.28);
  const red = rgb(0.72, 0.12, 0.12);
  const white = rgb(1, 1, 1);
  const width = 595.28;
  const height = 841.89;

  let page = pdf.addPage([width, height]);
  let y = height - 50;
  let pageNo = 1;
  const newPage = () => {
    page = pdf.addPage([width, height]);
    pageNo += 1;
    y = height - 48;
  };
  const ensure = (needed) => {
    if (y < needed) newPage();
  };
  const text = (value, x = 42, size = 9, font = regular, color = navy) =>
    page.drawText(clean(value), { x, y, size, font, color });
  const para = (value) => {
    for (const line of wrap(value)) {
      ensure(35);
      text(line, 42, 9, regular, gray);
      y -= 14;
    }
    y -= 5;
  };
  const head = (value) => {
    ensure(70);
    text(value, 42, 17, bold, navy);
    y -= 25;
  };
  const bullet = (value) => {
    ensure(40);
    text(`• ${value}`, 48, 9, regular, gray);
    y -= 14;
  };

  page.drawRectangle({ x: 0, y: height - 245, width, height: 245, color: navy });
  page.drawText('A2Z LEARNING SOLUTIONS', { x: 42, y: height - 58, size: 12, font: bold, color: white });
  page.drawText(`${plan === 'business' ? 'BUSINESS' : 'PROFESSIONAL'} WEBSITE GROWTH REPORT`, {
    x: 42,
    y: height - 120,
    size: 25,
    font: bold,
    color: white,
  });
  page.drawText('Deeper website intelligence, priorities and action plan', {
    x: 42,
    y: height - 148,
    size: 11,
    font: regular,
    color: rgb(0.82, 0.87, 0.95),
  });
  page.drawText(clean(data.url), { x: 42, y: height - 205, size: 10, font: regular, color: white });

  y = height - 285;
  text('Overall Score', 42, 11, bold, gray);
  y -= 40;
  text(`${data.score}/100 — ${premium.executive.grade}`, 42, 28, bold, blue);
  y -= 35;
  para(premium.executive.headline);
  head('Executive Decision Summary');
  para(
    `Biggest opportunity: ${premium.executive.biggestOpportunity}. ${premium.executive.failedChecks} checks need attention and the estimated implementation effort is ${premium.executive.estimatedEffort}. This report is designed as a practical implementation document, not merely a scorecard.`,
  );

  head('Score & Priority Dashboard');
  for (const row of premium.categoryRows) {
    ensure(55);
    text(`${row.name}: ${row.score}/100 (${row.grade}) — ${row.priority} priority`, 48, 9.5, bold, row.score < 60 ? red : row.score < 75 ? blue : green);
    y -= 17;
  }
  y -= 5;

  head('Website Facts');
  const summary = data.summary || {};
  [
    ['Title', summary.title || 'Missing'],
    ['Meta description', summary.description || 'Missing'],
    ['H1 / H2', `${summary.h1 || 0} / ${summary.h2 || 0}`],
    ['Visible words', summary.words],
    ['Images / links', `${summary.images || 0} / ${summary.links || 0}`],
    ['Forms / phone / WhatsApp', `${summary.forms || 0} / ${summary.phoneLinks || 0} / ${summary.whatsappLinks || 0}`],
    ['HTTPS', summary.https ? 'Enabled' : 'Not detected'],
    ['Schema', summary.schema ? 'Detected' : 'Not detected'],
  ].forEach(([label, value]) => {
    ensure(32);
    text(`${label}:`, 48, 9, bold, navy);
    text(value, 190, 9, regular, gray);
    y -= 16;
  });

  newPage();
  head('Detailed Findings & Risks');
  premium.risks.forEach((risk) => {
    ensure(60);
    text(`${risk.area} — ${risk.issue}`, 42, 10, bold, red);
    y -= 15;
    para(
      `Observed: ${risk.impact}. Business impact: this issue can create search, usability, trust or conversion friction and should be prioritised according to the score dashboard.`,
    );
  });
  if (premium.strengths.length) {
    head('Strengths to Preserve');
    premium.strengths.forEach(bullet);
  }

  newPage();
  head('Prioritised Recommendations');
  premium.recommendations.forEach((recommendation) => {
    ensure(85);
    text(`${recommendation.rank}. ${recommendation.title} — ${recommendation.priority} priority`, 42, 10.5, bold, navy);
    y -= 16;
    text(`AREA: ${recommendation.area}`, 42, 8, bold, blue);
    y -= 13;
    para(recommendation.advice);
    para(`Expected outcome: ${recommendation.outcome}`);
  });
  head('Content Growth Opportunities');
  premium.contentOpportunities.forEach(bullet);
  head('Technical Growth Opportunities');
  premium.technicalOpportunities.forEach(bullet);

  if (plan === 'business') {
    newPage();
    head('Business & Conversion Intelligence');
    const b = premium.businessSummary;
    [
      ['Commercial readiness', b.commercialReadiness],
      ['Lead-generation readiness', b.leadGenerationReadiness],
      ['Trust readiness', b.trustReadiness],
      ['Content depth', b.contentDepth],
    ].forEach(([label, value]) => {
      ensure(35);
      text(`${label}: ${value}/100`, 48, 10, bold, blue);
      y -= 17;
    });
    head('Conversion Audit');
    premium.conversionAudit.forEach((item) => {
      ensure(65);
      text(`${item.area} — ${item.status}`, 42, 10, bold, navy);
      y -= 15;
      para(item.insight);
    });
    head('Strategic Opportunities');
    premium.strategicOpportunities.forEach(bullet);
    head('90-Day Business Growth Plan');
    premium.ninetyDayPlan.forEach(bullet);
    head('Recommended KPIs');
    premium.kpis.forEach(bullet);
  }

  newPage();
  head(plan === 'business' ? '90-Day Implementation Roadmap' : '30-Day Implementation Roadmap');
  (plan === 'business' ? premium.ninetyDayPlan : premium.actionPlan).forEach(bullet);
  head('Performance Intelligence');
  para(`Server response: ${premium.performance.responseMs} ms (${premium.performance.responseGrade}). ${premium.performance.optimizationAdvice}`);
  para(premium.performance.caveat);
  head('Important Scope Note');
  para(
    'Automated analysis is based on the accessible website response and headers. Browser-based Core Web Vitals, authenticated pages, backlink authority, real user analytics, conversion data and specialist penetration testing require additional data or specialist tools.',
  );
  page.drawRectangle({ x: 42, y: 120, width: width - 84, height: 75, color: light });
  text('A2Z LEARNING SOLUTIONS', 58, 13, bold, navy);
  page.drawText('Website Growth & Intelligence Services', { x: 58, y: 155, size: 10, font: regular, color: gray });
  page.drawText('Analyze • Diagnose • Recommend • Improve • Monitor', { x: 58, y: 137, size: 9, font: bold, color: blue });
  for (const currentPage of pdf.getPages()) {
    currentPage.drawText(`A2Z Learning Solutions • ${plan === 'business' ? 'Business' : 'Professional'} Report • Page ${pdf.getPages().indexOf(currentPage) + 1}`, {
      x: 42,
      y: 22,
      size: 7,
      font: regular,
      color: gray,
    });
  }
  return Buffer.from(await pdf.save());
}
