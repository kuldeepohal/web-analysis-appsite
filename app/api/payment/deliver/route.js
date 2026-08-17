import { createPremiumWebsiteReport } from '../../../../lib/premium-pdf';
import { fetchRazorpayOrder, verifyPaymentSignature } from '../../../../lib/razorpay';
import { runDeepAnalysis } from '../../../../lib/deep-analysis';

const PLANS = { professional: 49900, business: 149900 };

export async function POST(request) {
  try {
    const { email, url, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!url || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json({ error: 'Website URL and payment verification details are required.' }, { status: 400 });
    }
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return Response.json({ error: 'Payment verification failed.' }, { status: 400 });
    }

    const order = await fetchRazorpayOrder(razorpay_order_id);
    const plan = order.notes?.plan || 'professional';
    if (order.status !== 'paid' || !PLANS[plan] || Number(order.amount) !== PLANS[plan]) {
      return Response.json({ error: 'The payment could not be validated for this report.' }, { status: 400 });
    }

    const data = await runDeepAnalysis(url, plan);
    const pdf = await createPremiumWebsiteReport(data, plan);
    const hostname = new URL(data.url).hostname;
    const reportLabel = plan === 'business' ? 'Business' : 'Professional';
    const attachmentName = `${plan}-website-growth-report-${hostname.replace(/[^a-z0-9.-]/gi, '-')}.pdf`;
    const pdfBase64 = Buffer.from(pdf).toString('base64');

    let emailSent = false;
    let emailError = null;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.REPORT_FROM_EMAIL;

    if (apiKey && from) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: [email],
            subject: `Your ${reportLabel} Website Growth Report — ${hostname}`,
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Your ${reportLabel} Website Growth Report is ready</h2><p>We completed a fresh server-side analysis for <strong>${hostname}</strong>.</p><p>Your overall score is <strong>${data.score}/100</strong>. The attached report contains detailed findings, priorities and an implementation plan.</p><p>Regards,<br><strong>A2Z Learning Solutions</strong></p></div>`,
            attachments: [{ filename: attachmentName, content: pdfBase64 }],
          }),
        });
        if (response.ok) emailSent = true;
        else emailError = await response.text();
      } catch (error) {
        emailError = error.message;
      }
    } else {
      emailError = 'RESEND_API_KEY and REPORT_FROM_EMAIL are not configured in Vercel.';
    }

    return Response.json({
      success: true,
      emailSent,
      emailError,
      filename: attachmentName,
      pdfBase64,
      message: emailSent
        ? `${reportLabel} report generated successfully and emailed to ${email}.`
        : `${reportLabel} report generated successfully. Download it now; email delivery still needs to be configured.`,
    });
  } catch (error) {
    return Response.json({ error: `Could not deliver the paid report: ${error.message}` }, { status: 500 });
  }
}
