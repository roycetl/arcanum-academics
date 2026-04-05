import fs from 'fs';
import path from 'path';

export async function GET() {
  const jsPath = path.join(process.cwd(), 'public', 'script.js');
  const js = fs.readFileSync(jsPath, 'utf8');
  return new Response(js, { headers: { 'Content-Type': 'application/javascript' } });
}
