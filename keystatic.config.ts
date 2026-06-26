// Defines the CMS schema

import { config, fields, collection, singleton } from '@keystatic/core';

export default config({

  storage: process.env.NODE_ENV === 'production' 
    ? {
        kind: 'cloud',
        branchPrefix: 'keystatic/',
      }
    : {
        kind: 'local',
      },
  cloud: {
    project: 'ramper/ramper-web',
  },

  // Singletons: one-off data entries for the site
  singletons: {
    about: singleton({
      label: 'About Section',
      path: 'src/content/about/index',
      format: { data: 'json', contentField: 'bio' },
      schema: {
        bio: fields.markdoc({
          label: 'Band Biography',
          description: 'The main "About Us" text.',
          options: {
            image: {
              directory: 'public/images/about',
              publicPath: '/images/about/'
            }
          }
        }),
      },
    }),

  },

  // Collections: repeating content like news posts or releases
  collections: {
    posts: collection({
      label: 'News / Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({
          label: 'Publish Date',
          validation: { isRequired: true }
        }),
        summary: fields.text({
          label: 'Summary',
          description: 'A short teaser description.',
          multiline: true
        }),
        content: fields.markdoc({
          label: 'Post Content',
          options: {
            image: {
              directory: 'public/images/posts',
              publicPath: '/images/posts/'
            }
          }
        }),
      },
    }),

    releases: collection({
      label: 'Published Material (Releases)',
      slugField: 'title',
      path: 'src/content/releases/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Album/Release Title' } }),
        releaseDate: fields.date({ label: 'Release Date' }),
        type: fields.select({
          label: 'Release Type',
          options: [
            { label: 'Album', value: 'album' },
            { label: 'EP', value: 'ep' },
            { label: 'Single', value: 'single' },
            { label: 'Live', value: 'live' },
            { label: 'Demo', value: 'demo' },
            { label: 'Session', value: 'session' },
          ],
          defaultValue: 'album'
        }),
        coverImage: fields.image({
          label: 'Cover Image',
          description: 'Cover art for the release',
          directory: 'public/images/covers',
          publicPath: '/images/covers/',
        }),
        bandcampUrl: fields.url({ label: 'Bandcamp URL' }),
        spotifyUrl: fields.url({ label: 'Spotify URL' }),
        tidalUrl: fields.url({ label: 'Tidal URL' }),
        qobuzUrl: fields.url({ label: 'Qobuz URL' }),
        appleMusicUrl: fields.url({ label: 'Apple Music URL' }),
        storeUrl: fields.url({ 
          label: 'Store URL', 
          description: 'Link to buy physical copies (e.g., Humo store)' 
        }),
        tracks: fields.array(
          fields.object({
            title: fields.text({ label: 'Track Title' }),
            lyrics: fields.text({ label: 'Lyrics', multiline: true }),
          }),
          {
            label: 'Tracklist',
            itemLabel: props => props.fields.title.value || 'New Track'
          }
        ),
        content: fields.markdoc({
          label: 'Description / Credits',
          options: {
            image: {
              directory: 'public/images/releases',
              publicPath: '/images/releases/'
            }
          }
        }),
      },
    }),
  },
});