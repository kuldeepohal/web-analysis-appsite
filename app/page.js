'use client';
import { useState } from 'react';
import './styles.css';

export default function Home() {
  const [url, setUrl] = useState('https://a2z-learning-solutions.vercel.app');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function analyze(e) {
    e.preventDefault(); setLoading(true); setError(''); setData(null);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Analysis failed');
      setData(json);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return <main>
    <section className="hero">
      <div className="eyebrow">A2Z WEB TOOLS</div>
      <h1>Turn your website into a <span>better website.</span></h1>
      <p>Paste a URL. Get a practical audit across SEO, accessibility, mobile readiness, content, performance and security.</p>
      <form onSubmit={analyze}>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" aria-label="Website URL" />
        <button disabled={loading}>{loading ? 'Analyzing…' : 'Analyze website →'}</button>
      </form>
      {error && <div className="error">{error}</div>}
    </section>

    {data && <section className="results">
      <div className="scoreCard"><div className="score">{data.score}</div><div><strong>Website health score</strong><p>{data.url}</p><small>HTTP {data.status} · {data.elapsed} ms analyzer response</small></div></div>
      <div className="grid">
        <div className="panel"><h2>Audit checks</h2>{data.checks.map((c, i) => <div className="check" key={i}><span className={c.pass ? 'dot pass' : 'dot fail'}>{c.pass ? '✓' : '!'}</span><div><b>{c.label}</b><small>{c.area} · {c.detail}</small></div></div>)}</div>
        <div className="panel"><h2>What to improve</h2>{data.suggestions.length ? data.suggestions.map((s, i) => <div className="suggestion" key={i}><div className="tag">{s.area}</div><b>{s.title}</b><p>{s.advice}</p></div>) : <div className="success">🔥 No heuristic issues found. Keep improving the things that matter to your users.</div>}</div>
      </div>
      <div className="panel summary"><h2>Page snapshot</h2><div className="stats"><div><b>{data.summary.words}</b><span>words</span></div><div><b>{data.summary.h1}</b><span>H1 tags</span></div><div><b>{data.summary.images}</b><span>images</span></div><div><b>{data.summary.links}</b><span>links</span></div></div><p><b>Title:</b> {data.summary.title || 'Missing'}</p><p><b>Description:</b> {data.summary.description || 'Missing'}</p></div>
    </section>}
    <footer>Built for fast, practical website improvement — not vanity metrics.</footer>
  </main>;
}
