'use client';

import { useMemo, useState } from 'react';
import './styles.css';

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function opportunityScore(audit) {
  if (!audit) return null;
  const checks = [
    audit.summary?.title,
    audit.summary?.description,
    audit.summary?.canonical,
    audit.summary?.viewport,
    audit.summary?.https,
    audit.robots?.robots?.exists,
    audit.robots?.sitemaps?.some((x) => x.valid),
    audit.structuredData?.count > 0,
    audit.social?.ogTitle,
    audit.social?.ogImage,
    (audit.links?.broken?.length || 0) === 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function GrowthLab() {
  const [url, setUrl] = useState('https://a2z-learning-solutions.vercel.app');
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [visitors, setVisitors] = useState(10000);
  const [conversion, setConversion] = useState(2);
  const [orderValue, setOrderValue] = useState(1000);
  const [lift, setLift] = useState(1);

  const roi = useMemo(() => {
    const current = visitors * (conversion / 100) * orderValue;
    const improved = visitors * ((conversion + lift) / 100) * orderValue;
    return { current, improved, gain: improved - current };
  }, [visitors, conversion, orderValue, lift]);

  async function run() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Audit failed.');
      setAudit(result.audit);
    } catch (e) {
      setError(e.message || 'Unable to analyze this website.');
    } finally {
      setLoading(false);
    }
  }

  const score = opportunityScore(audit);
  const quickWins = audit?.recommendations?.slice(0, 5) || [];

  return (
    <main className="growthPage">
      <section className="growthHero">
        <span className="eyebrow">A2Z GROWTH LAB</span>
        <h1>Turn website problems into <span>growth opportunities.</span></h1>
        <p>Use the existing A2Z audit engine to find quick wins, prioritize client work, and estimate the business value of conversion improvements.</p>

        <div className="analyzerBar">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
          <button onClick={run} disabled={loading}>{loading ? 'Analyzing…' : 'Analyze & find opportunities →'}</button>
        </div>
        {error && <div className="error">{error}</div>}
      </section>

      {audit && (
        <section className="growthGrid">
          <div className="card opportunityCard">
            <span className="eyebrow">OPPORTUNITY SCORE</span>
            <div className="bigScore">{score}<small>/100</small></div>
            <p>Higher means more of the important website growth foundations are already in place.</p>
            <a href="/?report=professional">Unlock the full paid report →</a>
          </div>

          <div className="card">
            <span className="eyebrow">CURRENT AUDIT</span>
            <h2>{audit.summary?.title || 'Website audit'}</h2>
            <div className="miniStats">
              <div><b>{audit.score ?? '—'}</b><span>Health</span></div>
              <div><b>{audit.links?.broken?.length ?? 0}</b><span>Broken links</span></div>
              <div><b>{audit.structuredData?.count ?? 0}</b><span>Schema blocks</span></div>
              <div><b>{audit.summary?.h1 ?? 0}</b><span>H1 tags</span></div>
            </div>
          </div>

          <div className="card full">
            <span className="eyebrow">QUICK WINS</span>
            <h2>What should be fixed first?</h2>
            <div className="actions">
              {quickWins.length ? quickWins.map((item, index) => (
                <div className="action" key={`${item.title}-${index}`}>
                  <b>P{item.priority}</b>
                  <div><strong>{item.title}</strong><span>{item.area} · {item.impact} impact · {item.effort} effort</span><p>{item.advice}</p></div>
                </div>
              )) : <p>No priority actions were returned for this audit.</p>}
            </div>
          </div>
        </section>
      )}

      <section className="roiSection">
        <div>
          <span className="eyebrow">CONVERSION ROI PLANNER</span>
          <h2>What is a 1% conversion improvement worth?</h2>
          <p>Use your own traffic and order values. This is a planning calculator, not a prediction of future revenue.</p>
        </div>

        <div className="roiGrid">
          <label>Monthly visitors<input type="number" min="0" value={visitors} onChange={(e) => setVisitors(Number(e.target.value))} /></label>
          <label>Current conversion %<input type="number" min="0" step="0.1" value={conversion} onChange={(e) => setConversion(Number(e.target.value))} /></label>
          <label>Average order value ₹<input type="number" min="0" value={orderValue} onChange={(e) => setOrderValue(Number(e.target.value))} /></label>
          <label>Improvement %<input type="number" min="0" step="0.1" value={lift} onChange={(e) => setLift(Number(e.target.value))} /></label>
        </div>

        <div className="roiResult">
          <div><span>Current monthly value</span><b>{money(roi.current)}</b></div>
          <div><span>Value after improvement</span><b>{money(roi.improved)}</b></div>
          <div className="gain"><span>Potential additional value</span><b>{money(roi.gain)}</b></div>
        </div>
      </section>

      <section className="packages">
        <span className="eyebrow">SERVICE PACKAGES</span>
        <h2>Turn audit findings into client-ready offers.</h2>
        <div className="packageGrid">
          <article><h3>Quick Fix</h3><strong>₹999+</strong><p>Metadata, broken links, basic technical cleanup and priority fixes.</p></article>
          <article><h3>Growth Optimization</h3><strong>₹2,999+</strong><p>SEO, performance, accessibility and conversion-focused improvements.</p></article>
          <article><h3>Complete Website Upgrade</h3><strong>₹5,999+</strong><p>Deep audit, implementation plan, redesign recommendations and ongoing optimization.</p></article>
        </div>
      </section>

      <footer>Built for decisions, revenue opportunities, and measurable improvements.</footer>
    </main>
  );
}
