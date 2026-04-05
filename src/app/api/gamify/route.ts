import fs from 'fs';
import path from 'path';

export async function GET() {
  const htmlPath = path.join(process.cwd(), 'public', 'gamify.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
