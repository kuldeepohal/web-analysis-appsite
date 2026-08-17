import { createWebsiteReport } from '../../../../lib/report';
import { fetchRazorpayOrder, verifyPaymentSignature } from '../../../../lib/razorpay';

const PLANS = {
  professional: 49900,
  business: 149900,
};

export async function POST(request) {
  try {
    const { email, data, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (!data?.url || typeof data.score !== 'number') return Response.json({ error: 'Valid analyzer results are required.' }, { status: 400 });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return Response.json({ error: 'Payment verification details are missing.' }, { status: 400 });
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) return Response.json({ error: 'Payment verification failed.' }, { status: 400 });

    const order = await fetchRazorpayOrder(razorpay_order_id);
    const plan = order.notes?.plan || 'professional';
    if (order.status !== 'paid' || !PLANS[plan] || Number(order.amount) !== PLANS[plan]) {
      return Response.json({ error: 'The payment could not be validated for this report.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.REPORT_FROM_EMAIL;
    if (!apiKey || !from) return Response.json({ error: 'Email delivery is not configured yet. Add RESEND_API_KEY and REPORT_FROM_EMAIL in Vercel.' }, { status: 503 });

    const pdf = await createWebsiteReport(data);
    const base64 = pdf.toString('base64');
    const hostname = new URL(data.url).hostname;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Your ${plan === 'business' ? 'Business' : 'Professional'} Website Analysis Report — ${hostname}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Your Website Analysis Report is ready</h2><p>We completed the ${plan === 'business' ? 'Business' : 'Professional'} website analysis for <strong>${hostname}</strong>.</p><p>Your overall website growth score is <strong>${data.score}/100</strong>.</p><p>Your payment was successfully verified and your detailed PDF report is attached.</p><p>Regards,<br><strong>A2Z Learning Solutions</strong></p></div>`,
        attachments: [{ filename: `website-analysis-${hostname.replace(/[^a-z0-9.-]/gi, '-')}.pdf`, content: base64 }],
      }),
    });
    if (!response.ok) return Response.json({ error: `Email provider rejected the message: ${await response.text()}` }, { status: 502 });
    return Response.json({ success: true, message: `Paid report sent successfully to ${email}.` });
  } catch (error) {
    return Response.json({ error: `Could not deliver the paid report: ${error.message}` }, { status: 500 });
  }
}
