export async function POST() {
  return Response.json({ error: 'Paid reports must be purchased through Razorpay Checkout.' }, { status: 402 });
}
