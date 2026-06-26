import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    image: {
      render: component('./src/components/MarkdocImage.astro'),
      attributes: {
        src: { type: String, required: true },
        alt: { type: String },
        title: { type: String },
      },
    },
  },
});
