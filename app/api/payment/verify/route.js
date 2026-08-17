import { fetchRazorpayOrder, verifyPaymentSignature } from '../../../../lib/razorpay';

export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return Response.json({ error: 'Incomplete Razorpay payment details.' }, { status: 400 });
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) return Response.json({ success: false, error: 'Payment signature verification failed.' }, { status: 400 });
    const order = await fetchRazorpayOrder(razorpay_order_id);
    if (order.status !== 'paid') return Response.json({ success: false, error: `Payment is not completed. Order status: ${order.status}.` }, { status: 400 });
    return Response.json({ success: true, orderId: razorpay_order_id, paymentId: razorpay_payment_id, plan: order.notes?.plan || 'professional' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
