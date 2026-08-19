'use client';

import { useState } from 'react';
import './styles.css';

const Metric = ({ label, value }) => (
  <div className="metric">
    <strong>{value ?? '—'}</strong>
    <span>{label}</span>
  </div>
);

const Score = ({ label, value }) => (
  <div className="scoreBox">
    <b>{value ?? '—'}</b>
    <span>{label}</span>
  </div>
);

async function loadRazorpay() {
  if (window.Razorpay) return true;

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error('Unable to load Razorpay Checkout.'));

    document.body.appendChild(script);
  });

  return true;
}

function downloadBase64(base64, filename) {
  const bytes = Uint8Array.from(atob(base64), (char) =>
    char.charCodeAt(0)
  );

  const blob = new Blob([bytes], {
    type: 'application/pdf'
  });

  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(link.href);
}

export default function Home() {
  const [url, setUrl] = useState(
    'https://a2z-learning-solutions.vercel.app'
  );

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [plan, setPlan] = useState('professional');
  const [email, setEmail] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  async function analyze(event) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setPaymentMessage('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Website analysis failed.'
        );
      }

      setData(result.audit);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function buyReport() {
    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setPaymentMessage(
        'Enter a valid email address for your paid report.'
      );
      return;
    }

    setPaying(true);
    setPaymentMessage(
      'Opening secure Razorpay Checkout…'
    );

    try {
      await loadRazorpay();

      const orderResponse = await fetch(
        '/api/payment/create-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan,
            url
          })
        }
      );

      const order = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          order.error ||
            'Could not create payment order.'
        );
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,

        name: 'A2Z Learning Solutions',

        description: order.name,

        prefill: {
          email
        },

        notes: {
          plan,
          website: url
        },

        theme: {
          color: '#4db8ff'
        },

        handler: async (response) => {
          try {
            setPaymentMessage(
              'Payment received. Verifying and generating your report…'
            );

            const verifyResponse = await fetch(
              '/api/payment/verify',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(response)
              }
            );

            const verified =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verified.success
            ) {
              throw new Error(
                verified.error ||
                  'Payment verification failed.'
              );
            }

            const deliveryResponse = await fetch(
              '/api/payment/deliver',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  email,
                  url,
                  plan,
                  razorpay_order_id:
                    response.razorpay_order_id,
                  razorpay_payment_id:
                    response.razorpay_payment_id,
                  razorpay_signature:
                    response.razorpay_signature
                })
              }
            );

            const result =
              await deliveryResponse.json();

            if (
              !deliveryResponse.ok ||
              !result.success
            ) {
              throw new Error(
                result.error ||
                  'Report generation failed.'
              );
            }

            if (result.pdfBase64) {
              downloadBase64(
                result.pdfBase64,
                result.filename
              );
            }

            if (result.emailSent) {
              setPaymentMessage(
                `Success — your ${
                  plan === 'business'
                    ? 'Business'
                    : 'Professional'
                } report was downloaded and emailed to ${email}.`
              );
            } else {
              setPaymentMessage(
                'Success — your report was downloaded. Email delivery is not configured yet.'
              );
            }
          } catch (err) {
            setPaymentMessage(
              err.message ||
                'Something went wrong while processing your report.'
            );
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaying(false);

            setPaymentMessage(
              'Payment window closed. No report was charged or generated.'
            );
          }
        }
      });

      checkout.on(
        'payment.failed',
        (response) => {
          setPaying(false);

          setPaymentMessage(
            response.error?.description ||
              'Payment failed. Please try again.'
          );
        }
      );

      checkout.open();
    } catch (err) {
      setPaying(false);

      setPaymentMessage(
        err.message ||
          'Unable to start payment. Please try again.'
      );
    }
  }

  const vitals =
    data?.pagespeed?.mobile?.webVitals || [];

  const recommendations =
    data?.recommendations || [];

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">
          A2Z WEB INTELLIGENCE
        </div>

        <h1>
          Know what your website needs{' '}
          <span>next.</span>
        </h1>

        <p>
          PageSpeed, Core Web Vitals, SEO, broken
          links, robots, sitemap, schema, social
          previews and AI-prioritized fixes.
        </p>

        <form onSubmit={analyze}>
          <input
            value={url}
            onChange={(event) =>
              setUrl(event.target.value)
            }
            placeholder="https://example.com"
          />

          <button disabled={loading}>
            {loading
              ? 'Auditing…'
              : 'Run full audit →'}
          </button>
        </form>

        {error && (
          <div className="error">
            {error}
          </div>
        )}
      </section>

      {data && (
        <section className="results">
          <div className="panel premiumCta">
            <div>
              <div className="eyebrow">
                PAID REPORTS
              </div>

              <h2>
                Turn this audit into an
                implementation-ready report
              </h2>

              <p>
                Get the server-side deep analysis,
                detailed recommendations and a
                professional PDF delivered to your
                email.
              </p>
            </div>

            <div className="purchaseControls">
              <select
                value={plan}
                onChange={(event) =>
                  setPlan(event.target.value)
                }
                disabled={paying}
              >
                <option value="professional">
                  Professional — ₹499
                </option>

                <option value="business">
                  Business — ₹1,499
                </option>
              </select>

              <input
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Your email address"
                type="email"
                disabled={paying}
              />

              <button
                onClick={buyReport}
                disabled={paying}
              >
                {paying
                  ? 'Processing…'
                  : `Buy ${
                      plan === 'business'
                        ? 'Business'
                        : 'Professional'
                    } Report →`}
              </button>

              {paymentMessage && (
                <small>
                  {paymentMessage}
                </small>
              )}
            </div>
          </div>

          <div className="scoreCard">
            <div className="score">
              {data.score ?? '—'}
            </div>

            <div>
              <strong>
                Overall health
              </strong>

              <p>
                {data.summary?.title ||
                  'Website audit'}
              </p>

              <small>
                {data.summary?.https
                  ? 'HTTPS enabled'
                  : 'HTTPS missing'}{' '}
                ·{' '}
                {data.summary?.responseMs ??
                  '—'}{' '}
                ms fetch
              </small>
            </div>
          </div>

          <div className="panel">
            <h2>
              PageSpeed Insights
            </h2>

            <div className="scores">
              <Score
                label="Mobile Performance"
                value={
                  data.pagespeed?.mobile?.scores
                    ?.performance
                }
              />

              <Score
                label="Mobile SEO"
                value={
                  data.pagespeed?.mobile?.scores
                    ?.seo
                }
              />

              <Score
                label="Accessibility"
                value={
                  data.pagespeed?.mobile?.scores
                    ?.accessibility
                }
              />

              <Score
                label="Best Practices"
                value={
                  data.pagespeed?.mobile?.scores
                    ?.bestPractices
                }
              />

              <Score
                label="Desktop Performance"
                value={
                  data.pagespeed?.desktop?.scores
                    ?.performance
                }
              />
            </div>
          </div>

          <div className="grid">
            <div className="panel">
              <h2>
                Core Web Vitals
              </h2>

              {vitals.map((vital) => (
                <div
                  className="row"
                  key={vital.id}
                >
                  <b>{vital.title}</b>

                  <span>
                    {vital.value ||
                      'Unavailable'}
                  </span>
                </div>
              ))}
            </div>

            <div className="panel">
              <h2>
                Technical health
              </h2>

              <div className="rows">
                <div>
                  <b>
                    Broken internal links
                  </b>

                  <span>
                    {data.links?.broken
                      ?.length ?? 0}
                  </span>
                </div>

                <div>
                  <b>
                    Robots.txt
                  </b>

                  <span>
                    {data.robots?.robots
                      ?.exists
                      ? '✓'
                      : 'Missing'}
                  </span>
                </div>

                <div>
                  <b>
                    XML sitemap
                  </b>

                  <span>
                    {data.robots?.sitemaps?.some(
                      (item) => item.valid
                    )
                      ? '✓'
                      : 'Missing/invalid'}
                  </span>
                </div>

                <div>
                  <b>
                    Structured data
                  </b>

                  <span>
                    {data.structuredData
                      ?.count ?? 0}{' '}
                    block(s)
                  </span>
                </div>

                <div>
                  <b>
                    Open Graph
                  </b>

                  <span>
                    {data.social?.ogTitle &&
                    data.social?.ogImage
                      ? '✓'
                      : 'Incomplete'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid">
            <div className="panel">
              <h2>
                Top priority actions
              </h2>

              {recommendations.map(
                (recommendation, index) => (
                  <div
                    className="action"
                    key={index}
                  >
                    <div className="priority">
                      P
                      {recommendation.priority}
                    </div>

                    <div>
                      <b>
                        {recommendation.title}
                      </b>

                      <small>
                        {recommendation.area} ·
                        Impact:{' '}
                        {recommendation.impact} ·
                        Effort:{' '}
                        {recommendation.effort}
                      </small>

                      <p>
                        {recommendation.advice}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="panel">
              <h2>
                Social preview
              </h2>

              <div className="rows">
                {Object.entries(
                  data.social || {}
                ).map(([key, value]) => (
                  <div key={key}>
                    <b>{key}</b>

                    <span>
                      {value || 'Missing'}
                    </span>
                  </div>
                ))}
              </div>

              <h3>
                Structured data
              </h3>

              {(
                data.structuredData?.items ||
                []
              ).map((item, index) => (
                <div
                  className="chip"
                  key={index}
                >
                  {item.type}{' '}
                  {item.valid
                    ? '✓'
                    : '⚠'}
                </div>
              ))}
            </div>
          </div>

          {(data.links?.broken?.length ?? 0) >
            0 && (
            <div className="panel">
              <h2>
                Broken links
              </h2>

              {data.links.broken.map(
                (item, index) => (
                  <div
                    className="broken"
                    key={index}
                  >
                    <b>
                      {item.status || 'ERR'}
                    </b>

                    <span>
                      {item.url}
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          <div className="panel">
            <h2>
              AI action plan
            </h2>

            {data.ai?.enabled ? (
              <div className="aiText">
                {data.ai.text}
              </div>
            ) : (
              <div className="muted">
                Add OPENAI_API_KEY in
                deployment to enable AI
                recommendations.
              </div>
            )}
          </div>

          <div className="panel summary">
            <h2>
              Page snapshot
            </h2>

            <div className="stats">
              <Metric
                label="Words"
                value={data.summary?.words}
              />

              <Metric
                label="H1 tags"
                value={data.summary?.h1}
              />

              <Metric
                label="Images"
                value={data.summary?.images}
              />

              <Metric
                label="Links"
                value={data.summary?.links}
              />
            </div>

            <p>
              <b>Title:</b>{' '}
              {data.summary?.title ||
                'Missing'}
            </p>

            <p>
              <b>Description:</b>{' '}
              {data.summary?.description ||
                'Missing'}
            </p>
          </div>
        </section>
      )}

      <footer>
        Built for decisions, not vanity
        metrics.
      </footer>
    </main>
  );
}