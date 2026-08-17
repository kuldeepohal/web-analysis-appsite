const RAZORPAY_API = 'https://api.razorpay.com/v1';

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Vercel environment variables.');
  return { keyId, keySecret };
}

function authHeader() {
  const { keyId, keySecret } = credentials();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

export function getRazorpayKeyId() {
  return credentials().keyId;
}

export async function createRazorpayOrder({ amount, receipt, notes }) {
  const response = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes,
      payment_capture: 1,
    }),
    cache: 'no-store',
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.description || 'Razorpay order creation failed.');
  return data;
}

export async function fetchRazorpayOrder(orderId) {
  const response = await fetch(`${RAZORPAY_API}/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: authHeader() },
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.description || 'Could not retrieve the Razorpay order.');
  return data;
}

export function verifyPaymentSignature(orderId, paymentId, signature) {
  const { keySecret } = credentials();
  const crypto = require('node:crypto');
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const received = Buffer.from(signature || '', 'utf8');
  const generated = Buffer.from(expected, 'utf8');
  return received.length === generated.length && crypto.timingSafeEqual(received, generated);
}

export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const crypto = require('node:crypto');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = Buffer.from(signature, 'utf8');
  const generated = Buffer.from(expected, 'utf8');
  return received.length === generated.length && crypto.timingSafeEqual(received, generated);
}
