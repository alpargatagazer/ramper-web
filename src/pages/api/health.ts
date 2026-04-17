// src/pages/api/health.ts
// Health endpoint for monitoring the application status.
// In static mode, this will be generated at build time.

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
