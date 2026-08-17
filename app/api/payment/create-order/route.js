import { createRazorpayOrder, getRazorpayKeyId } from '../../../../lib/razorpay';

const PLANS = {
  professional: { name: 'Professional Website Growth Report', amount: 49900 },
  business: { name: 'Business Website Growth Report', amount: 149900 },
};

export async function POST(request) {
  try {
    const { plan = 'professional', url } = await request.json();
    const selected = PLANS[plan];
    if (!selected) return Response.json({ error: 'Invalid report plan.' }, { status: 400 });
    if (!url) return Response.json({ error: 'Website URL is required.' }, { status: 400 });

    let hostname;
    try { hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname; }
    catch { return Response.json({ error: 'That website URL is not valid.' }, { status: 400 }); }

    const order = await createRazorpayOrder({
      amount: selected.amount,
      receipt: `wa_${Date.now()}`,
      notes: { plan, website: hostname },
    });

    return Response.json({ keyId: getRazorpayKeyId(), orderId: order.id, amount: order.amount, currency: order.currency, plan, name: selected.name, website: hostname });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
