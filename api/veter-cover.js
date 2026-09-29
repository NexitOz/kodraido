export default async function handler(req, res) {
  try {
    const source = 'https://raw.githubusercontent.com/NexitOz/kodraido/claude/landing-vercel-deploy-01i3om/images/veter-vanadis-cover-512.b64.txt';
    const response = await fetch(source, { cache: 'force-cache' });
    if (!response.ok) {
      res.status(502).send('Cover source unavailable');
      return;
    }
    const base64 = (await response.text()).trim();
    const image = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(image);
  } catch (error) {
    res.status(500).send('Cover render failed');
  }
}
