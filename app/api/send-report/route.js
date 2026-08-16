import { createWebsiteReport } from '../../../lib/report';

export async function POST(request) {
  try {
    const { email, data } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!data?.url || typeof data.score !== 'number') {
      return Response.json({ error: 'Valid analyzer results are required.' }, { status: 400 });
    }
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.REPORT_FROM_EMAIL;
    if (!apiKey || !from) {
      return Response.json({ error: 'Email delivery is not configured yet. Add RESEND_API_KEY and REPORT_FROM_EMAIL in Vercel environment variables.' }, { status: 503 });
    }
    const pdf = await createWebsiteReport(data);
    const base64 = pdf.toString('base64');
    const hostname = new URL(data.url).hostname;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Your Website Analysis Report — ${hostname}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Your Website Analysis Report is ready</h2><p>We have completed the website analysis for <strong>${hostname}</strong>.</p><p>Your overall website growth score is <strong>${data.score}/100</strong>.</p><p>The detailed PDF report is attached with findings, scores and prioritized recommendations.</p><p>Regards,<br><strong>A2Z Learning Solutions</strong></p></div>`,
        attachments: [{ filename: `website-analysis-${hostname.replace(/[^a-z0-9.-]/gi, '-')}.pdf`, content: base64 }],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      return Response.json({ error: `Email provider rejected the message: ${body}` }, { status: 502 });
    }
    return Response.json({ success: true, message: 'Report emailed successfully.' });
  } catch (error) {
    return Response.json({ error: `Could not send the report: ${error.message}` }, { status: 500 });
  }
}
