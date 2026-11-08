import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET(context: any) {
  const posts = await getCollection('posts');

  return rss({

    title: 'Ramper | Noticias',
    description: 'Actualidad, comunicados y novedades de Ramper.',
    site: context.site || 'https://ramper.band',

    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.summary,
      link: `/news/${post.id}/`,
    })),

    // (optional) inject custom xml
    customData: `<language>es</language>`,
  });
}
