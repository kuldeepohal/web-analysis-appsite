'use client';

import { useEffect, useState } from 'react';
import './styles.css';

const features = [
  ['Free Preview', 'Professional ₹499', 'Business ₹1,499'],
  ['Website growth score', '✓', '✓', '✓'],
  ['Basic SEO & technical checks', '✓', '✓', '✓'],
  ['Performance & mobile overview', '✓', '✓', '✓'],
  ['Accessibility overview', '✓', '✓', '✓'],
  ['Security overview', '✓', '✓', '✓'],
  ['Detailed PDF report', '—', '✓', '✓'],
  ['Deep findings & risk analysis', '—', '✓', '✓'],
  ['Prioritised recommendations', '3 preview items', '15+ detailed', '25+ strategic'],
  ['30-day action plan', '—', '✓', '✓'],
  ['Advanced content opportunities', '—', '✓', '✓'],
  ['Technical SEO opportunities', '—', '✓', '✓'],
  ['Conversion / lead-generation audit', '—', '—', '✓'],
  ['Commercial readiness analysis', '—', '—', '✓'],
  ['Strategic growth opportunities', '—', '—', '✓'],
  ['90-day business roadmap', '—', '—', '✓'],
  ['Recommended business KPIs', '—', '—', '✓'],
  ['Email delivery', '—', '✓', '✓'],
];

const plans = [
  {
    id: 'professional',
    name: 'Professional Report',
    price: '₹499',
    desc: 'Deep audit for owners who need a detailed improvement checklist.',
  },
  {
    id: 'business',
    name: 'Business Report',
    price: '₹1,499',
    desc: 'Strategic audit for businesses focused on leads, conversion and growth.',
  },
];

const websitePattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  async function analyze(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setData(null);

    try {
      if (!websitePattern.test(url.trim())) {
        throw new Error('Enter a valid website URL.');
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.error || 'Analysis failed');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function buyReport(plan) {
    if (!data) return setError('Analyze a website first.');
    if (!emailPattern.test(email)) return setError('Enter a valid email address.');

    setPaying(plan);
    setError('');
    setMessage('Creating secure payment order...');

    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, url: data.url }),
      });
      const order = await response.json();

      if (!response.ok) throw new Error(order.error || 'Could not create payment order.');
      if (!window.Razorpay) throw new Error('Razorpay Checkout is still loading. Please try again.');

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'A2Z Learning Solutions',
        description: order.name,
        order_id: order.orderId,
        prefill: { email },
        notes: { website: data.url, plan },
        handler: async (responsePayload) => {
          setMessage('Payment verified. Running deep analysis and generating your report...');

          try {
            const deliveryResponse = await fetch('/api/payment/deliver', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, url: data.url, ...responsePayload }),
            });
            const delivery = await deliveryResponse.json();

            if (!deliveryResponse.ok) throw new Error(delivery.error || 'Report delivery failed.');
            setMessage(delivery.message);
          } catch (err) {
            setError(err.message);
            setMessage('');
          } finally {
            setPaying('');
          }
        },
        modal: {
          ondismiss: () => {
            setPaying('');
            setMessage('');
          },
        },
      });

      checkout.open();
    } catch (err) {
      setError(err.message);
      setMessage('');
      setPaying('');
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
          Get a free website growth score first. Upgrade to a deeper Professional or Business report with
          detailed insights, priorities and action plans.
        </p>
        <form onSubmit={analyze}>
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" />
          <button disabled={loading}>{loading ? 'Analyzing...' : 'Analyze website →'}</button>
        </form>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
      </section>

      <section className="comparison">
        <div className="sectionIntro">
          <div className="eyebrow">WHAT CUSTOMERS GET</div>
          <h2>Free preview vs paid reports</h2>
          <p>
            The paid reports are not just unlocked versions of the free screen. Payment triggers a fresh
            server-side analysis and generates a deeper, plan-specific report.
          </p>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>{features[0].map((item, index) => <th key={index}>{item}</th>)}</tr>
            </thead>
            <tbody>
              {features.slice(1).map((row, index) => (
                <tr key={index}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {data && (
        <section className="results">
          <div className="scoreCard">
            <div className="score">{data.score}</div>
            <div>
              <strong>Free website growth score</strong>
              <p>{data.url}</p>
              <small>
                HTTP {data.status} · {data.elapsed} ms analyzer response
              </small>
            </div>
          </div>

          <div className="panel reportActions">
            <h2>Unlock your deeper report</h2>
            <p>Enter your email. After Razorpay payment, the server performs a fresh analysis and builds your selected report.</p>
            <div className="actionRow">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
              />
              <span className="secureNote">🔒 Secure Razorpay payment</span>
            </div>
            <div className="planGrid">
              {plans.map((plan) => (
                <article className="planCard" key={plan.id}>
                  <div>
                    <h3>{plan.name}</h3>
                    <strong>{plan.price}</strong>
                  </div>
                  <p>{plan.desc}</p>
                  <button onClick={() => buyReport(plan.id)} disabled={!!paying}>
                    {paying === plan.id ? 'Opening Razorpay...' : `Pay ${plan.price} & get report`}
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="panel highlight">
            <h2>Free preview</h2>
            <div className="pillRow">
              {data.reportHighlights.slice(0, 6).map((item) => (
                <span className="pill" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid">
            <div className="panel">
              <h2>Audit overview</h2>
              {data.checks.slice(0, 8).map((check, index) => (
                <div className="check" key={index}>
                  <span className={check.pass ? 'dot pass' : 'dot fail'}>{check.pass ? '✓' : '!'}</span>
                  <div>
                    <b>{check.label}</b>
                    <small>
                      {check.area} · {check.detail}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            <div className="panel">
              <h2>Preview recommendations</h2>
              {data.suggestions.slice(0, 3).map((suggestion, index) => (
                <div className="suggestion" key={index}>
                  <div className="tag">{suggestion.area}</div>
                  <b>{suggestion.title}</b>
                  <p>{suggestion.advice}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer>Built for practical website improvement. Paid reports are generated after verified Razorpay payment.</footer>
    </main>
  );
}
