import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

// Polyfill for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
const LISTMONK_URL = process.env.LISTMONK_URL || 'http://listmonk:9000'; // e.g. http://listmonk:9000
const LIST_ID = process.env.LISTMONK_LIST_ID || '1'; // The ID of the list to send to
const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run');
const SITE_URL = process.env.SITE_URL || 'https://ramper.band';

const TRACKING_FILE = process.env.NEWSLETTER_TRACKING_FILE || path.resolve(__dirname, '../.last-newsletter.json');
const POSTS_DIR = path.resolve(__dirname, '../src/content/posts');

// Helper to load secret from file (Docker Secrets support) or fallback to environment variable
async function getSecret(envVar, fileVar) {
  if (process.env[fileVar]) {
    try {
      const data = await fs.readFile(process.env[fileVar], 'utf-8');
      return data.trim();
    } catch (err) {
      console.warn(`[WARNING] Failed to read secret from ${process.env[fileVar]}: ${err.message}`);
    }
  }
  return process.env[envVar];
}

// Helper to rewrite relative links in markdown/HTML to absolute URLs
function makeLinksAbsolute(content, siteUrl) {
  const cleanSiteUrl = siteUrl.replace(/\/$/, '');
  
  // 1. Rewrite Markdown links [text](/path) or [text](path)
  // We use a more robust regex to handle parenthesis inside the URL (e.g. `\(1978\)`)
  let updated = content.replace(/(!?)\[([^\]]*)\]\((.+?)\)/g, (match, isImage, text, url) => {
    // Keystatic escapes parenthesis. Clean them up for the email!
    let cleanUrl = url.replace(/\\([()])/g, '$1');
    
    // Skip absolute URLs, mailto, hashes, etc.
    if (/^(https?:\/\/|mailto:|#)/i.test(cleanUrl)) {
      return `${isImage}[${text}](${cleanUrl})`;
    }
    const relativePath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    
    // Encode the URI properly (Listmonk markdown parser needs valid URIs for images with spaces)
    const encodedPath = encodeURI(relativePath);
    return `${isImage}[${text}](${cleanSiteUrl}${encodedPath})`;
  });

  // 2. Rewrite HTML src/href attributes like src="/path" or href="/path"
  updated = updated.replace(/(src|href)=["']\/([^"']*)["']/g, (match, attr, path) => {
    return `${attr}="${cleanSiteUrl}/${path}"`;
  });

  return updated;
}

// Authenticate with Listmonk via login API (v6+) and return session cookie.
// Falls back to Basic Auth header for older versions.
async function authenticateListmonk(url, username, password, retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      // Try v6+ login endpoint first
      const loginRes = await fetch(`${url}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        redirect: 'manual',
      });

      if (loginRes.ok || loginRes.status === 303) {
        const setCookie = loginRes.headers.get('set-cookie');
        if (setCookie) {
          const cookie = setCookie.split(';')[0];
          console.log('[INFO] Authenticated with Listmonk via login API (v6+).');
          return { type: 'cookie', value: cookie };
        }
      }

      // Fallback: try Basic Auth (older versions)
      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
      const testRes = await fetch(`${url}/api/campaigns?limit=1`, {
        headers: { 'Authorization': `Basic ${basicAuth}` },
      });

      if (testRes.ok) {
        console.log('[INFO] Authenticated with Listmonk via Basic Auth.');
        return { type: 'basic', value: basicAuth };
      }

      const body = await testRes.text();
      console.warn(`[WARNING] Listmonk auth failed (status ${testRes.status}): ${body.trim()}`);
    } catch (err) {
      console.log(`[INFO] Waiting for Listmonk to start (attempt ${i + 1}/${retries})...`);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error('Could not authenticate with Listmonk after several retries.');
}

function authHeaders(auth) {
  return auth.type === 'cookie'
    ? { 'Cookie': auth.value }
    : { 'Authorization': `Basic ${auth.value}` };
}


async function getLatestPost() {
  const files = await fs.readdir(POSTS_DIR);
  const posts = [];

  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.mdoc')) {
      const filePath = path.join(POSTS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      posts.push({
        slug: file.replace(/\.(md|mdoc)$/, ''),
        date: new Date(parsed.data.date || new Date(0)),
        title: parsed.data.title,
        summary: parsed.data.summary,
        body: parsed.content,
      });
    }
  }

  // Sort by date descending
  posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  return posts[0];
}

async function getLastSentSlug() {
  try {
    const data = await fs.readFile(TRACKING_FILE, 'utf-8');
    return JSON.parse(data).lastSentSlug;
  } catch (err) {
    return null; // No tracking file yet
  }
}

async function markAsSent(slug) {
  if (!DRY_RUN) {
    await fs.mkdir(path.dirname(TRACKING_FILE), { recursive: true });
    await fs.writeFile(TRACKING_FILE, JSON.stringify({ lastSentSlug: slug, date: new Date().toISOString() }));
  }
}

async function sendToListmonk(post) {
  console.log(`[INFO] Preparing to send campaign for: ${post.title}`);

  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would have sent email to Listmonk list #${LIST_ID}`);
    console.log(`[DRY-RUN] Subject: Nueva noticia de Ramper: ${post.title}`);
    console.log(`[DRY-RUN] Body Preview: ${post.body.substring(0, 100)}...`);
    return;
  }

  const username = await getSecret('LISTMONK_USERNAME', 'LISTMONK_USERNAME_FILE');
  const password = await getSecret('LISTMONK_PASSWORD', 'LISTMONK_PASSWORD_FILE');

  if (!LISTMONK_URL || !username || !password) {
    throw new Error('Listmonk credentials are not fully configured in environment or secrets.');
  }

  const auth = await authenticateListmonk(LISTMONK_URL, username, password);

  const formattedDate = new Date(post.date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const absoluteBody = makeLinksAbsolute(post.body, SITE_URL);

  const fullMarkdownBody = `# ${post.title}\n\n*${formattedDate}*\n\n**${post.summary}**\n\n---\n\n${absoluteBody}\n\n---\n\n[Leer en la web](${SITE_URL}/news/${post.slug})`;
  const fullPlainBody = `${post.title}\n${formattedDate}\n\n${post.summary}\n\n---\n\n${absoluteBody}\n\n---\nLeer en la web: ${SITE_URL}/news/${post.slug}`;

  // 1. Create a campaign
  const campaignPayload = {
    name: `Automated: ${post.title}`,
    subject: `${post.title}`,
    lists: [parseInt(LIST_ID, 10)],
    type: 'regular',
    content_type: 'markdown',
    body: fullMarkdownBody,
    altbody: fullPlainBody,
    send_at: new Date(Date.now() + 60000).toISOString()
  };

  const createRes = await fetch(`${LISTMONK_URL}/api/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(auth),
    },
    body: JSON.stringify(campaignPayload)
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Failed to create campaign: ${createRes.status} ${text}`);
  }

  const campaignData = await createRes.json();
  const campaignId = campaignData.data.id;
  console.log(`[INFO] Campaign created successfully. ID: ${campaignId}`);

  // 2. Change campaign status to 'running' to dispatch it
  const updateRes = await fetch(`${LISTMONK_URL}/api/campaigns/${campaignId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(auth),
    },
    body: JSON.stringify({ status: 'running' })
  });

  if (!updateRes.ok) {
    throw new Error(`Failed to dispatch campaign ${campaignId}`);
  }

  console.log(`[INFO] Campaign ${campaignId} dispatched successfully!`);
}

async function main() {
  console.log('[INFO] Starting RSS-to-Email automation script...');
  
  const latestPost = await getLatestPost();
  if (!latestPost) {
    console.log('[INFO] No posts found. Exiting.');
    return;
  }

  const lastSentSlug = await getLastSentSlug();

  if (latestPost.slug === lastSentSlug) {
    console.log(`[INFO] The latest post "${latestPost.title}" was already sent. Exiting.`);
    return;
  }

  console.log(`[INFO] Found new post: "${latestPost.title}"`);
  
  try {
    await sendToListmonk(latestPost);
    await markAsSent(latestPost.slug);
    console.log('[SUCCESS] Newsletter process completed.');
  } catch (error) {
    console.error('[ERROR] Failed to send newsletter:', error.message);
    process.exit(1);
  }
}

main();
