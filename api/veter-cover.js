export default async function handler(req, res) {
  try {
    const base = 'https://raw.githubusercontent.com/NexitOz/kodraido/claude/landing-vercel-deploy-01i3om/images/veter-cover-b64';
    const urls = Array.from({ length: 9 }, (_, i) => `${base}/part${String(i).padStart(2, '0')}.txt`);
    const responses = await Promise.all(urls.map(url => fetch(url, { cache: 'no-store' })));
    if (responses.some(response => !response.ok)) {
      res.status(502).send('Cover source unavailable');
      return;
    }
    const chunks = await Promise.all(responses.map(response => response.text()));
    const base64 = chunks.map(chunk => chunk.trim()).join('');
    const image = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(image);
  } catch (error) {
    res.status(500).send('Cover render failed');
  }
}
