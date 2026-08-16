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
  const [error, setError] = useState('');

  async function analyze(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Analysis failed');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">AI WEBSITE GROWTH & INTELLIGENCE PLATFORM</div>
        <h1>
          Analyze, diagnose, recommend, improve, and <span>monitor growth.</span>
        </h1>
        <p>
          Paste a URL to generate a practical audit with SEO, content, lead generation, mobile,
          security, and technical insights.
        </p>
        <form onSubmit={analyze}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            aria-label="Website URL"
          />
          <button disabled={loading}>{loading ? 'Analyzing...' : 'Analyze website ->'}</button>
        </form>
        {error && <div className="error">{error}</div>}
      </section>

      <section className="offerings">
        {offerings.map(item => (
          <article className="offerCard" key={item.name}>
            <div className="offerTop">
              <h2>{item.name}</h2>
              <strong>{item.price}</strong>
            </div>
            <p>{item.summary}</p>
          </article>
        ))}
      </section>

      {data && (
        <section className="results">
          <div className="scoreCard">
            <div className="score">{data.score}</div>
            <div>
              <strong>Website growth score</strong>
              <p>{data.url}</p>
              <small>
                HTTP {data.status} · {data.elapsed} ms analyzer response
              </small>
            </div>
          </div>

          <div className="panel highlight">
            <h2>Report modules</h2>
            <div className="pillRow">
              {data.reportHighlights.map(item => (
                <span className="pill" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid">
            <div className="panel">
              <h2>Audit checks</h2>
              {data.checks.map((c, i) => (
                <div className="check" key={i}>
                  <span className={c.pass ? 'dot pass' : 'dot fail'}>{c.pass ? '✓' : '!'}</span>
                  <div>
                    <b>{c.label}</b>
                    <small>
                      {c.area} · {c.detail}
                    </small>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel">
              <h2>What to improve</h2>
              {data.suggestions.length ? (
                data.suggestions.map((s, i) => (
                  <div className="suggestion" key={i}>
                    <div className="tag">{s.area}</div>
                    <b>{s.title}</b>
                    <p>{s.advice}</p>
                  </div>
                ))
              ) : (
                <div className="success">
                  No major heuristic issues found. Use the report to keep improving the things that
                  matter to your users.
                </div>
              )}
            </div>
          </div>

          <div className="panel summary">
            <h2>Score breakdown</h2>
            <div className="stats">
              <div><b>{data.auditSummary.seo}</b><span>SEO</span></div>
              <div><b>{data.auditSummary.performance}</b><span>Performance</span></div>
              <div><b>{data.auditSummary.mobile}</b><span>Mobile</span></div>
              <div><b>{data.auditSummary.accessibility}</b><span>Accessibility</span></div>
              <div><b>{data.auditSummary.security}</b><span>Security</span></div>
              <div><b>{data.auditSummary.content}</b><span>Content</span></div>
              <div><b>{data.auditSummary.technical}</b><span>Technical</span></div>
              <div><b>{data.summary.links}</b><span>Links</span></div>
            </div>
            <p>
              <b>Title:</b> {data.summary.title || 'Missing'}
            </p>
            <p>
              <b>Description:</b> {data.summary.description || 'Missing'}
            </p>
            <p>
              <b>OG title:</b> {data.summary.ogTitle || 'Missing'} · <b>OG description:</b>{' '}
              {data.summary.ogDescription || 'Missing'}
            </p>
            <p>
              <b>Schema:</b> {data.summary.schema ? 'Detected' : 'Not detected'} · <b>Sitemap:</b>{' '}
              {data.summary.sitemapLink || data.summary.robots ? 'Hint detected' : 'Not detected'} ·{' '}
              <b>Forms:</b> {data.summary.forms}
            </p>
          </div>
        </section>
      )}
      <footer>Built for fast, practical website improvement - not vanity metrics.</footer>
    </main>
  );
}
