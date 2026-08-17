import { verifyWebhookSignature } from '../../../../lib/razorpay';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    if (!verifyWebhookSignature(rawBody, signature)) return Response.json({ error: 'Invalid webhook signature.' }, { status: 400 });

    const event = JSON.parse(rawBody);
    // Webhook events are acknowledged immediately. Fulfilment is independently
    // verified through the payment/deliver endpoint to avoid trusting browser data.
    console.log('Razorpay webhook received:', event.event);
    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }
}
