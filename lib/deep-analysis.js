function appOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export async function runDeepAnalysis(url, plan = 'professional') {
  const response = await fetch(`${appOrigin()}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'A2Z-Paid-Deep-Analyzer/1.0' },
    body: JSON.stringify({ url }),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Deep website analysis failed.');
  return { ...data, paidPlan: plan, analysisDepth: plan === 'business' ? 'business-deep' : 'professional-deep' };
}
