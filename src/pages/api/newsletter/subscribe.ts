import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const email = data.email;
    
    // Bracket notation prevents Vite from statically inlining this at build time
    const listUuid = process.env['PUBLIC_NEWSLETTER_LIST_UUID'] ?? import.meta.env.PUBLIC_NEWSLETTER_LIST_UUID;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    // LISTMONK_URL is meant to be a local docker network URL, e.g. http://listmonk:9000, or a public domain
    const apiUrl = process.env['LISTMONK_URL'] ?? import.meta.env.LISTMONK_URL;
    
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
        list_uuids: listUuid ? [listUuid] : []
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
