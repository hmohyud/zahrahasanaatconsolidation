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
    { type: 'string', name: 'caption', label: 'Caption under the gallery (optional, e.g. event and date)' },
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

const carouselTemplate: Template = {
  name: 'Carousel',
  label: 'Sliding Gallery (carousel)',
  fields: [
    {
      type: 'string',
      name: 'variant',
      label: 'Style',
      options: [
        { value: 'photos', label: 'Photos (wide, filled)' },
        { value: 'quotes', label: 'Square cards (shown whole)' },
      ],
    },
    {
      type: 'rich-text',
      name: 'children',
      label: 'Slides — add one image per line; its alt text becomes the caption',
    },
  ],
};

const portalEmbedTemplate: Template = {
  name: 'PortalEmbed',
  label: 'Embedded Portal (full-page iframe)',
  fields: [
    { type: 'string', name: 'url', label: 'Portal URL' },
    { type: 'string', name: 'title', label: 'Title (accessibility + fallback link text)' },
    { type: 'number', name: 'minHeight', label: 'Minimum height in px (default 900)' },
  ],
};

const leafTemplates: Template[] = [
  carouselTemplate,
  portalEmbedTemplate,
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
        type: 'string',
        name: 'layout',
        label: 'Layout',
        options: [
          { value: 'split', label: 'Side by side (default)' },
          { value: 'wide', label: 'Wide photo, text below' },
          { value: 'inset', label: 'Small photo, text wraps around it' },
        ],
      },
      {
        type: 'boolean',
        name: 'mediaRight',
        label: 'Image on the right',
      },
      {
        type: 'string',
        name: 'ratio',
        label: 'Photo shape (blank = the photo as it is)',
        options: [
          { value: '3/2', label: 'Landscape 3:2' },
          { value: '4/3', label: 'Landscape 4:3' },
          { value: '16/9', label: 'Wide 16:9' },
          { value: '21/9', label: 'Panorama 21:9' },
          { value: '3/1', label: 'Panorama strip 3:1' },
          { value: '1/1', label: 'Square' },
          { value: '4/5', label: 'Portrait 4:5' },
        ],
      },
      { type: 'string', name: 'focus', label: 'Focal point when cropped (e.g. "50% 30%" = centre, upper third)' },
      { type: 'string', name: 'caption', label: 'Caption under the photo (optional)' },
      {
        type: 'boolean',
        name: 'illustration',
        label: 'Drawing or graphic (no photo frame, sits on the page colour)',
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
