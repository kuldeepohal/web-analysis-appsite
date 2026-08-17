import { runAnalysis } from './analyzer-core';

export async function runDeepAnalysis(url, plan = 'professional') {
  const data = await runAnalysis(url, { deep: true, business: plan === 'business' });
  return data;
}
