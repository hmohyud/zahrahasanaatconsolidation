/**
 * Rich-text component templates shared by every body field.
 * These are the "special blocks" an editor can insert beyond plain prose:
 * image+text rows, highlight cards, photo galleries, embeds, button rows.
 * The converter emits matching MDX tags when migrating the old WordPress
 * markup, so legacy layouts stay editable as structured blocks.
 */
import type { Template } from 'tinacms';

/* Leaf blocks: insertable at the top level AND inside cards/media rows.
   (Their own children are plain rich text — no further nesting.) */
const galleryTemplate: Template = {
  name: 'Gallery',
  label: 'Photo Gallery',
  fields: [
    {
      type: 'rich-text',
      name: 'children',
      label: 'Images (add one image per line)',
    },
  ],
};

const embedTemplate: Template = {
  name: 'Embed',
  label: 'Video / Embed',
  fields: [
    { type: 'string', name: 'url', label: 'Embed URL (YouTube embed URL, Issuu, etc.)' },
    { type: 'string', name: 'title', label: 'Title (accessibility)' },
    { type: 'number', name: 'aspect', label: 'Aspect ratio % (default 56.25 = 16:9)' },
  ],
};

const videoFileTemplate: Template = {
  name: 'VideoFile',
  label: 'Video File',
  fields: [
    { type: 'string', name: 'src', label: 'Video URL (mp4)' },
    { type: 'image', name: 'poster', label: 'Poster image' },
  ],
};

const buttonRowTemplate: Template = {
  name: 'ButtonRow',
  label: 'Buttons',
  fields: [
    {
      type: 'rich-text',
      name: 'children',
      label: 'Buttons (each link becomes a button)',
    },
  ],
};

const contactCardTemplate: Template = {
  name: 'ContactCard',
  label: 'Contact Details',
  fields: [
    { type: 'string', name: 'heading', label: 'Heading (optional)' },
    { type: 'string', name: 'email', label: 'Email address' },
    { type: 'string', name: 'phone', label: 'Phone number' },
    { type: 'string', name: 'hours', label: 'Phone hours (e.g. 9am – 5pm IST)' },
    {
      type: 'string',
      name: 'address',
      label: 'Postal address',
      ui: { component: 'textarea' },
    },
    { type: 'string', name: 'note', label: 'Note below the details (optional)', ui: { component: 'textarea' } },
  ],
};

const leafTemplates: Template[] = [
  galleryTemplate,
  embedTemplate,
  videoFileTemplate,
  buttonRowTemplate,
  contactCardTemplate,
];

export const richTextTemplates: Template[] = [
  {
    name: 'MediaText',
    label: 'Image + Text Row',
    fields: [
      { type: 'image', name: 'image', label: 'Image' },
      { type: 'string', name: 'alt', label: 'Image alt text' },
      {
        type: 'boolean',
        name: 'mediaRight',
        label: 'Image on the right',
      },
      {
        type: 'rich-text',
        name: 'children',
        label: 'Text',
        templates: leafTemplates,
      },
    ],
  },
  {
    name: 'CoverCard',
    label: 'Highlight Card',
    fields: [
      {
        type: 'rich-text',
        name: 'children',
        label: 'Card content',
        templates: leafTemplates,
      },
    ],
  },
  ...leafTemplates,
];

/** The standard rich-text body field used by pages and stories. */
export const bodyField = {
  type: 'rich-text' as const,
  name: 'body',
  label: 'Body',
  isBody: true,
  templates: richTextTemplates,
};
