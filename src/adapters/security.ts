export async function equalSecret(actual: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  const encoder = new TextEncoder();
  const [a,b] = await Promise.all([actual,expected].map(value => crypto.subtle.digest('SHA-256',encoder.encode(value))));
  return crypto.subtle.timingSafeEqual(a!,b!);
}
export async function limitedJson(request: Request, limit = 16384): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_body');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); throw new Error('body_too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size); let offset=0;
  for (const chunk of chunks) { body.set(chunk,offset); offset+=chunk.length; }
  return JSON.parse(new TextDecoder().decode(body));
}
