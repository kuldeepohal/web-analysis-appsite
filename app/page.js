'use client';
import { useEffect, useState } from 'react';
import './styles.css';

const offerings = [
  { name: 'Website Health Audit', price: '₹299–₹1,499', summary: 'SEO, speed, mobile, accessibility, security, and technical checks.' },
  { name: 'SEO Audit & Improvement Plan', price: '₹999–₹4,999', summary: 'Keywords, structure, schema, canonical, indexability, and Core Web Vitals.' },
  { name: 'AI Website Content Audit', price: '₹999+', summary: 'Homepage, services, CTAs, readability, and rewritten copy suggestions.' },
  { name: 'Website Competitor Analysis', price: '₹1,499+', summary: 'Compare SEO, speed, content, authority, stack, UX, and visibility.' },
  { name: 'Lead Generation Audit', price: '₹1,499+', summary: 'Forms, WhatsApp, calls, booking, trust signals, and funnel conversion.' },
  { name: 'Monitoring Plans', price: '₹499/mo+', summary: 'Track uptime, speed, SSL, SEO drift, broken links, and homepage changes.' },
];

const plans = [
  { id: 'professional', name: 'Professional Report', price: '₹499', description: 'Complete website growth audit with professional PDF and email delivery.' },
  { id: 'business', name: 'Business Report', price: '₹1,499', description: 'Premium business report with deeper recommendations and conversion focus.' },
];

export default function Home() {
  const [url, setUrl] = useState('https://a2z-learning-solutions.vercel.app');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [paying, setPaying] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

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

  async function buyReport(plan) {
    if (!data) return setError('Analyze a website first.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address for report delivery.');
    setPaying(plan); setError(''); setMessage('Creating secure payment order...');
    try {
      const res = await fetch('/api/payment/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, url: data.url }) });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || 'Could not create payment order.');
      if (!window.Razorpay) throw new Error('Razorpay Checkout is still loading. Please try again.');

      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency,
        name: 'A2Z Learning Solutions', description: order.name, order_id: order.orderId,
        prefill: { email }, notes: { website: data.url, plan },
        handler: async function (response) {
          setMessage('Payment received. Verifying and generating your report...');
          try {
            const delivery = await fetch('/api/payment/deliver', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, data, ...response }) });
            const result = await delivery.json();
            if (!delivery.ok) throw new Error(result.error || 'Payment succeeded but report delivery failed.');
            setMessage(result.message);
          } catch (err) { setError(err.message); setMessage(''); }
          finally { setPaying(''); }
        },
        modal: { ondismiss: () => { setPaying(''); setMessage(''); } },
      });
      checkout.open();
    } catch (err) { setError(err.message); setMessage(''); setPaying(''); }
  }

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">AI WEBSITE GROWTH & INTELLIGENCE PLATFORM</div>
        <h1>Analyze, diagnose, recommend, improve, and <span>monitor growth.</span></h1>
        <p>Get a free website growth score first, then unlock a professional report with SEO, content, lead generation, mobile, security, and technical insights.</p>
        <form onSubmit={analyze}>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" aria-label="Website URL" />
          <button disabled={loading}>{loading ? 'Analyzing...' : 'Analyze website →'}</button>
        </form>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
      </section>

      <section className="offerings">
        {offerings.map(item => <article className="offerCard" key={item.name}><div className="offerTop"><h2>{item.name}</h2><strong>{item.price}</strong></div><p>{item.summary}</p></article>)}
      </section>

      {data && (
        <section className="results">
          <div className="scoreCard"><div className="score">{data.score}</div><div><strong>Free website growth score</strong><p>{data.url}</p><small>HTTP {data.status} · {data.elapsed} ms analyzer response</small></div></div>

          <div className="panel reportActions">
            <h2>Unlock your professional PDF report</h2>
            <p>Your free score is ready. Enter your email and choose a report. Payment is processed securely by Razorpay.</p>
            <div className="actionRow"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" aria-label="Report email address" /></div>
            <div className="planGrid">
              {plans.map(plan => <article className="planCard" key={plan.id}><div><h3>{plan.name}</h3><strong>{plan.price}</strong></div><p>{plan.description}</p><button onClick={() => buyReport(plan.id)} disabled={!!paying}>{paying === plan.id ? 'Opening Razorpay...' : `Pay ${plan.price} & get report`}</button></article>)}
            </div>
          </div>

          <div className="panel highlight"><h2>Report modules</h2><div className="pillRow">{data.reportHighlights.map(item => <span className="pill" key={item}>{item}</span>)}</div></div>
          <div className="grid">
            <div className="panel"><h2>Free preview</h2>{data.checks.slice(0, 6).map((c, i) => <div className="check" key={i}><span className={c.pass ? 'dot pass' : 'dot fail'}>{c.pass ? '✓' : '!'}</span><div><b>{c.label}</b><small>{c.area} · {c.detail}</small></div></div>)}</div>
            <div className="panel"><h2>Priority improvements</h2>{data.suggestions.slice(0, 5).map((s, i) => <div className="suggestion" key={i}><div className="tag">{s.area}</div><b>{s.title}</b><p>{s.advice}</p></div>)}</div>
          </div>
          <div className="panel summary"><h2>Score breakdown</h2><div className="stats">{[['seo','SEO'],['performance','Performance'],['mobile','Mobile'],['accessibility','Accessibility'],['security','Security'],['content','Content'],['technical','Technical']].map(([key,label]) => <div key={key}><b>{data.auditSummary[key]}</b><span>{label}</span></div>)}<div><b>{data.summary.links}</b><span>Links</span></div></div><p><b>Title:</b> {data.summary.title || 'Missing'}</p><p><b>Description:</b> {data.summary.description || 'Missing'}</p></div>
        </section>
      )}
      <footer>Built for fast, practical website improvement — secure payments by Razorpay.</footer>
    </main>
  );
}
