// src/pages/api/health.ts
// Health endpoint for monitoring.
// Prerender is set to false so the timestamp represents the actual request time for monitoring
export const prerender = false;

export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString()
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
