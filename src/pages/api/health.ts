// src/pages/api/health.ts
// Health endpoint for monitoring.
// Prerendered as a static file to allow production builds in static mode.
export const prerender = true;

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
