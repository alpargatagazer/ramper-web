import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const email = data.email;
    const list_uuids = data.list_uuids;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    // INTERNAL_LISTMONK_URL is meant to be a local docker network URL, e.g. http://listmonk:9000
    // But we fall back to PUBLIC_NEWSLETTER_URL if running locally
    const apiUrl = process.env.INTERNAL_LISTMONK_URL || import.meta.env.INTERNAL_LISTMONK_URL || import.meta.env.PUBLIC_NEWSLETTER_URL;
    
    if (!apiUrl) {
      // Dry-run / Development mode
      console.log(`[DRY-RUN] Would subscribe ${email} to ${apiUrl}`);
      return new Response(JSON.stringify({ message: 'Success (Simulated)' }), { status: 200 });
    }

    const response = await fetch(`${apiUrl}/api/public/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        name: email.split('@')[0],
        list_uuids: list_uuids
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Listmonk subscription error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Subscription failed upstream' }), { status: response.status });
    }

    return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });

  } catch (error) {
    console.error('Error processing newsletter subscription:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
