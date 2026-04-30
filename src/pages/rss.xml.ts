import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET(context: any) {
  const posts = await getCollection('posts');

  return rss({

    title: 'Ramper | Transmissions',
    description: 'News, announcements and releases from the Spanish post-rock project.',
    site: context.site,

    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.summary,
      link: `/news/${post.id}/`,
    })),

    // (optional) inject custom xml
    customData: `<language>en-us</language>`,
  });
}
