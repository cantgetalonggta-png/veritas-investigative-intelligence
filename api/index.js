import createApp from '../dist/vercel-app.js';

let cached;
export default async function handler(req, res) {
  if (!cached) cached = await createApp();
  return cached(req, res);
}
