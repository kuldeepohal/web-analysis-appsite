import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { buildPremiumReport } from './premium-report';

const clean = v => String(v ?? '').replace(/\s+/g,' ').trim();
function wrap(v, max=92){ const words=clean(v).split(' '), out=[]; let line=''; for(const w of words){const n=line?`${line} ${w}`:w;if(n.length>max&&line){out.push(line);line=w}else line=n} if(line)out.push(line); return out.length?out:['']; }

export async function createPremiumWebsiteReport(data, plan='professional') {
  const premium=buildPremiumReport(data,plan); const pdf=await PDFDocument.create();
  const regular=await pdf.embedFont(StandardFonts.Helvetica), bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy=rgb(.04,.09,.18), blue=rgb(.08,.32,.68), light=rgb(.93,.96,.99), gray=rgb(.34,.39,.47), green=rgb(.08,.48,.28), red=rgb(.72,.12,.12), white=rgb(1,1,1);
  const W=595.28,H=841.89; let page=pdf.addPage([W,H]), y=H-50, pageNo=1;
  const newPage=()=>{page=pdf.addPage([W,H]);pageNo++;y=H-48}; const ensure=n=>{if(y<n)newPage()};
  const text=(v,x=42,size=9,font=regular,color=navy)=>page.drawText(clean(v),{x,y,size,font,color});
  const para=v=>{for(const l of wrap(v)){ensure(35);text(l,42,9,regular,gray);y-=14}y-=5};
  const head=v=>{ensure(70);text(v,42,17,bold,navy);y-=25};
  const bullet=v=>{ensure(40);text(`• ${v}`,48,9,regular,gray);y-=14};

  page.drawRectangle({x:0,y:H-245,width:W,height:245,color:navy}); page.drawText('A2Z LEARNING SOLUTIONS',{x:42,y:H-58,size:12,font:bold,color:white}); page.drawText(`${plan==='business'?'BUSINESS':'PROFESSIONAL'} WEBSITE GROWTH REPORT`,{x:42,y:H-120,size:25,font:bold,color:white}); page.drawText('Deeper website intelligence, priorities and action plan',{x:42,y:H-148,size:11,font:regular,color:rgb(.82,.87,.95)}); page.drawText(clean(data.url),{x:42,y:H-205,size:10,font:regular,color:white});
  y=H-285; text('Overall Score',42,11,bold,gray);y-=40;text(`${data.score}/100 — ${premium.executive.grade}`,42,28,bold,blue);y-=35;para(premium.executive.headline);head('Executive Decision Summary');para(`Biggest opportunity: ${premium.executive.biggestOpportunity}. ${premium.executive.failedChecks} checks need attention and the estimated implementation effort is ${premium.executive.estimatedEffort}. This report is designed as a practical implementation document, not merely a scorecard.`);

  head('Score & Priority Dashboard'); for(const row of premium.categoryRows){ensure(55);text(`${row.name}: ${row.score}/100 (${row.grade}) — ${row.priority} priority`,48,9.5,bold,row.score<60?red:row.score<75?blue:green);y-=17} y-=5;
  head('Website Facts'); const s=data.summary||{}; [['Title',s.title||'Missing'],['Meta description',s.description||'Missing'],['H1 / H2',`${s.h1||0} / ${s.h2||0}`],['Visible words',s.words],['Images / links',`${s.images||0} / ${s.links||0}`],['Forms / phone / WhatsApp',`${s.forms||0} / ${s.phoneLinks||0} / ${s.whatsappLinks||0}`],['HTTPS',s.https?'Enabled':'Not detected'],['Schema',s.schema?'Detected':'Not detected']].forEach(([a,b])=>{ensure(32);text(`${a}:`,48,9,bold,navy);text(b,190,9,regular,gray);y-=16});

  newPage(); head('Detailed Findings & Risks'); premium.risks.forEach(r=>{ensure(60);text(`${r.area} — ${r.issue}`,42,10,bold,red);y-=15;para(`Observed: ${r.impact}. Business impact: this issue can create search, usability, trust or conversion friction and should be prioritised according to the score dashboard.`)});
  if(premium.strengths.length){head('Strengths to Preserve');premium.strengths.forEach(bullet)}

  newPage(); head('Prioritised Recommendations'); premium.recommendations.forEach(r=>{ensure(85);text(`${r.rank}. ${r.title} — ${r.priority} priority`,42,10.5,bold,navy);y-=16;text(`AREA: ${r.area}`,42,8,bold,blue);y-=13;para(r.advice);para(`Expected outcome: ${r.outcome}`)});
  head('Content Growth Opportunities'); premium.contentOpportunities.forEach(bullet);
  head('Technical Growth Opportunities'); premium.technicalOpportunities.forEach(bullet);

  if(plan==='business'){
    newPage(); head('Business & Conversion Intelligence'); const b=premium.businessSummary; [['Commercial readiness',b.commercialReadiness],['Lead-generation readiness',b.leadGenerationReadiness],['Trust readiness',b.trustReadiness],['Content depth',b.contentDepth]].forEach(([k,v])=>{ensure(35);text(`${k}: ${v}/100`,48,10,bold,blue);y-=17});
    head('Conversion Audit'); premium.conversionAudit.forEach(x=>{ensure(65);text(`${x.area} — ${x.status}`,42,10,bold,navy);y-=15;para(x.insight)});
    head('Strategic Opportunities');premium.strategicOpportunities.forEach(bullet);
    head('90-Day Business Growth Plan');premium.ninetyDayPlan.forEach(bullet);
    head('Recommended KPIs');premium.kpis.forEach(bullet);
  }

  newPage(); head(plan==='business'?'90-Day Implementation Roadmap':'30-Day Implementation Roadmap'); (plan==='business'?premium.ninetyDayPlan:premium.actionPlan).forEach(bullet); head('Performance Intelligence');para(`Server response: ${premium.performance.responseMs} ms (${premium.performance.responseGrade}). ${premium.performance.optimizationAdvice}`);para(premium.performance.caveat);head('Important Scope Note');para('Automated analysis is based on the accessible website response and headers. Browser-based Core Web Vitals, authenticated pages, backlink authority, real user analytics, conversion data and specialist penetration testing require additional data or specialist tools.');
  page.drawRectangle({x:42,y:120,width:W-84,height:75,color:light});text('A2Z LEARNING SOLUTIONS',58,13,bold,navy);page.drawText('Website Growth & Intelligence Services',{x:58,y:155,size:10,font:regular,color:gray});page.drawText('Analyze • Diagnose • Recommend • Improve • Monitor',{x:58,y:137,size:9,font:bold,color:blue});
  for(const p of pdf.getPages())p.drawText(`A2Z Learning Solutions • ${plan==='business'?'Business':'Professional'} Report • Page ${pdf.getPages().indexOf(p)+1}`,{x:42,y:22,size:7,font:regular,color:gray});
  return Buffer.from(await pdf.save());
}
