# Razorpay Live Setup

## Production environment variables

Configure these in the production deployment environment only:

- `RAZORPAY_KEY_ID` — Live API key ID (`rzp_live_...`)
- `RAZORPAY_KEY_SECRET` — Live API secret
- `RAZORPAY_WEBHOOK_SECRET` — webhook signing secret configured in Razorpay

Never commit live credentials to GitHub.

## Webhook

Configure a Razorpay Live webhook to:

`https://YOUR_PRODUCTION_DOMAIN/api/payment/webhook`

Use the same webhook secret as `RAZORPAY_WEBHOOK_SECRET`.

## Current payment endpoints

- `POST /api/payment/create-order`
- `POST /api/payment/verify`
- `POST /api/payment/webhook`

## Live launch checklist

1. Complete Razorpay KYC and settlement setup.
2. Switch Razorpay Dashboard to Live Mode.
3. Generate Live API keys.
4. Add the three production environment variables to the hosting platform.
5. Configure the Live webhook using the production analyzer domain.
6. Redeploy the application.
7. Confirm the production checkout loads with the live key ID.
8. Make a small real payment and verify the payment/order in Razorpay Dashboard.
9. Confirm the premium report is delivered and duplicate fulfilment is prevented.

Do not use Test Mode credentials in production.
