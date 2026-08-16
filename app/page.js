'use client';
import { useState } from 'react';
import './styles.css';

const offerings = [
  { name: 'Website Health Audit', price: '₹299-₹1,499', summary: 'SEO, speed, mobile, accessibility, security, and technical checks.' },
  { name: 'SEO Audit & Improvement Plan', price: '₹999-₹4,999', summary: 'Keywords, structure, schema, canonical, indexability, and Core Web Vitals.' },
  { name: 'AI Website Content Audit', price: '₹999+', summary: 'Homepage, services, CTAs, readability, and rewritten copy suggestions.' },
  { name: 'Website Competitor Analysis', price: '₹1,499+', summary: 'Compare SEO, speed, content, authority, stack, UX, and visibility.' },
  { name: 'Lead Generation Audit', price: '₹1,499+', summary: 'Forms, WhatsApp, calls, booking, trust signals, and funnel conversion.' },
  { name: 'Monitoring Plans', price: '₹499/mo+', summary: 'Track uptime, speed, SSL, SEO drift, broken links, and homepage changes.' },
];

export default function Home() {
  const [url, setUrl] = useState('https://a2z-learning-solutions.vercel.app');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function analyze(e) {
    e.preventDefault();
    setLoading(true); setError(''); setMessage(''); setData(null);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Analysis failed');
      setData(json);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function downloadReport() {
    if (!data) return;
    setPdfLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) { const json = await res.json(); throw new Error(json.error || 'PDF generation failed'); }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `website-analysis-${new URL(data.url).hostname}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(objectUrl);
      setMessage('PDF report generated successfully.');
    } catch (err) { setError(err.message); }
    finally { setPdfLoading(false); }
  }

  async function emailReport() {
    if (!data || !email) { setError('Enter an email address first.'); return; }
    setEmailLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/send-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, data }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Email delivery failed');
      setMessage(`Report sent successfully to ${email}.`);
    } catch (err) { setError(err.message); }
    finally { setEmailLoading(false); }
  }

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">AI WEBSITE GROWTH & INTELLIGENCE PLATFORM</div>
        <h1>Analyze, diagnose, recommend, improve, and <span>monitor growth.</span></h1>
        <p>Paste a URL to generate a practical audit with SEO, content, lead generation, mobile, security, and technical insights.</p>
        <form onSubmit={analyze}>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" aria-label="Website URL" />
          <button disabled={loading}>{loading ? 'Analyzing...' : 'Analyze website ->'}</button>
        </form>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
      </section>

      <section className="offerings">
        {offerings.map(item => <article className="offerCard" key={item.name}><div className="offerTop"><h2>{item.name}</h2><strong>{item.price}</strong></div><p>{item.summary}</p></article>)}
      </section>

      {data && (
        <section className="results">
          <div className="scoreCard">
            <div className="score">{data.score}</div>
            <div><strong>Website growth score</strong><p>{data.url}</p><small>HTTP {data.status} · {data.elapsed} ms analyzer response</small></div>
          </div>

          <div className="panel reportActions">
            <h2>Get your professional report</h2>
            <p>Download the detailed PDF or have it delivered directly to your email.</p>
            <div className="actionRow">
              <button className="secondaryButton" onClick={downloadReport} disabled={pdfLoading}>{pdfLoading ? 'Generating PDF...' : 'Download PDF report'}</button>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" aria-label="Report email address" />
              <button onClick={emailReport} disabled={emailLoading}>{emailLoading ? 'Sending...' : 'Email report'}</button>
            </div>
          </div>

          <div className="panel highlight"><h2>Report modules</h2><div className="pillRow">{data.reportHighlights.map(item => <span className="pill" key={item}>{item}</span>)}</div></div>

          <div className="grid">
            <div className="panel"><h2>Audit checks</h2>{data.checks.map((c, i) => <div className="check" key={i}><span className={c.pass ? 'dot pass' : 'dot fail'}>{c.pass ? '✓' : '!'}</span><div><b>{c.label}</b><small>{c.area} · {c.detail}</small></div></div>)}</div>
            <div className="panel"><h2>What to improve</h2>{data.suggestions.length ? data.suggestions.map((s, i) => <div className="suggestion" key={i}><div className="tag">{s.area}</div><b>{s.title}</b><p>{s.advice}</p></div>) : <div className="success">No major heuristic issues found. Use the report to keep improving the things that matter to your users.</div>}</div>
          </div>

          <div className="panel summary"><h2>Score breakdown</h2><div className="stats">{[['seo','SEO'],['performance','Performance'],['mobile','Mobile'],['accessibility','Accessibility'],['security','Security'],['content','Content'],['technical','Technical']].map(([key,label]) => <div key={key}><b>{data.auditSummary[key]}</b><span>{label}</span></div>)}<div><b>{data.summary.links}</b><span>Links</span></div></div><p><b>Title:</b> {data.summary.title || 'Missing'}</p><p><b>Description:</b> {data.summary.description || 'Missing'}</p><p><b>OG title:</b> {data.summary.ogTitle || 'Missing'} · <b>OG description:</b> {data.summary.ogDescription || 'Missing'}</p><p><b>Schema:</b> {data.summary.schema ? 'Detected' : 'Not detected'} · <b>Sitemap:</b> {data.summary.sitemapLink || data.summary.robots ? 'Hint detected' : 'Not detected'} · <b>Forms:</b> {data.summary.forms}</p></div>
        </section>
      )}
      <footer>Built for fast, practical website improvement - not vanity metrics.</footer>
    </main>
  );
}
