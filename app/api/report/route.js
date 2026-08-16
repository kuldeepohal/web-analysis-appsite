import { createWebsiteReport } from '../../../lib/report';

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data?.url || typeof data.score !== 'number') {
      return Response.json({ error: 'Valid analyzer results are required.' }, { status: 400 });
    }
    const pdf = await createWebsiteReport(data);
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="website-analysis-${new URL(data.url).hostname.replace(/[^a-z0-9.-]/gi, '-')}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json({ error: `Could not generate the PDF: ${error.message}` }, { status: 500 });
  }
}
