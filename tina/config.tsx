import { defineConfig } from 'tinacms';
import { bodyField } from './templates';

// Tina Cloud credentials (added as GitHub secrets once the account exists).
// In local mode (`npm run dev`) these are undefined and everything still works.
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main';

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH
      ? process.env.NEXT_PUBLIC_BASE_PATH.replace(/^\//, '')
      : '',
  },
  media: {
    tina: {
      mediaRoot: 'assets/uploads',
      publicFolder: 'public',
    },
  },

  schema: {
    collections: [
      // ---------- Standard pages ----------
      {
        name: 'page',
        label: 'Pages',
        path: 'content/pages',
        format: 'mdx',
        ui: {
          router: ({ document }) => `/${document._sys.filename}`,
        },
        fields: [
          { type: 'string', name: 'title', label: 'Title', isTitle: true, required: true },
          {
            type: 'string',
            name: 'eyebrow',
            label: 'Eyebrow (small label above the title)',
          },
          {
            type: 'string',
            name: 'subtitle',
            label: 'Subtitle (short line under the title)',
            ui: { component: 'textarea' },
          },
          { type: 'image', name: 'heroImage', label: 'Hero background photo' },
          bodyField,
          {
            type: 'object',
            name: 'related',
            label: 'Related link sections (shown at the bottom)',
            list: true,
            ui: { itemProps: (item: any) => ({ label: item?.title || 'Section' }) },
            fields: [
              { type: 'string', name: 'title', label: 'Section heading' },
              {
                type: 'object',
                name: 'links',
                label: 'Links',
                list: true,
                ui: { itemProps: (item: any) => ({ label: item?.label || 'Link' }) },
                fields: [
                  { type: 'string', name: 'label', label: 'Label' },
                  { type: 'string', name: 'href', label: 'Link (e.g. education.html)' },
                ],
              },
            ],
          },
        ],
      },

      // ---------- Stories ----------
      {
        name: 'story',
        label: 'Stories',
        path: 'content/stories',
        format: 'mdx',
        ui: {
          router: ({ document }) => `/${document._sys.filename}`,
          filename: {
            slugify: (values: any) =>
              'story-' +
              (values?.title || 'new-story')
                .toLowerCase()
                .replace(/^story-/, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, ''),
          },
        },
        fields: [
          { type: 'string', name: 'title', label: 'Title', isTitle: true, required: true },
          { type: 'string', name: 'date', label: 'Display date (e.g. July 2022)' },
          {
            type: 'string',
            name: 'tags',
            label: 'Tags',
            list: true,
            ui: { component: 'tags' },
          },
          { type: 'image', name: 'heroImage', label: 'Hero / card photo' },
          bodyField,
        ],
      },

      // ---------- Homepage ----------
      {
        name: 'home',
        label: 'Homepage',
        path: 'content/settings',
        format: 'json',
        match: { include: 'home' },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => '/',
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero',
            fields: [
              { type: 'string', name: 'eyebrow', label: 'Eyebrow' },
              { type: 'string', name: 'title', label: 'Headline', ui: { component: 'textarea' } },
              { type: 'string', name: 'text', label: 'Intro text', ui: { component: 'textarea' } },
              { type: 'image', name: 'image', label: 'Background photo' },
              {
                type: 'object', name: 'buttons', label: 'Buttons', list: true,
                ui: { itemProps: (item: any) => ({ label: item?.label || 'Button' }) },
                fields: [
                  { type: 'string', name: 'label', label: 'Label' },
                  { type: 'string', name: 'href', label: 'Link' },
                  { type: 'boolean', name: 'outline', label: 'Outline style' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'welcome',
            label: 'Welcome passage',
            fields: [
              { type: 'string', name: 'arabic', label: 'Arabic line' },
              { type: 'string', name: 'quote', label: 'Quote (English)', ui: { component: 'textarea' } },
              { type: 'string', name: 'cite', label: 'Attribution' },
              { type: 'string', name: 'body', label: 'Paragraph', ui: { component: 'textarea' } },
            ],
          },
          {
            type: 'object',
            name: 'programs',
            label: 'Program cards',
            list: true,
            ui: { itemProps: (item: any) => ({ label: item?.title || 'Program' }) },
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'text', label: 'Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'href', label: 'Link' },
              {
                type: 'string', name: 'icon', label: 'Icon',
                options: ['book', 'globe', 'heart', 'coin', 'shield', 'home'],
              },
            ],
          },
          {
            type: 'object',
            name: 'impact',
            label: 'Impact numbers',
            list: true,
            ui: { itemProps: (item: any) => ({ label: item?.label || 'Stat' }) },
            fields: [
              { type: 'string', name: 'number', label: 'Number (e.g. 296+)' },
              { type: 'string', name: 'label', label: 'Label' },
            ],
          },
          {
            type: 'string',
            name: 'featuredStories',
            label: 'Featured stories (file names, e.g. story-medical-camp)',
            list: true,
          },
          {
            type: 'object',
            name: 'feature',
            label: 'Feature band',
            fields: [
              { type: 'string', name: 'eyebrow', label: 'Eyebrow' },
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
              { type: 'image', name: 'image', label: 'Photo' },
              { type: 'string', name: 'buttonLabel', label: 'Button label' },
              { type: 'string', name: 'buttonHref', label: 'Button link' },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'Bottom call-to-action',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
              {
                type: 'object', name: 'buttons', label: 'Buttons', list: true,
                ui: { itemProps: (item: any) => ({ label: item?.label || 'Button' }) },
                fields: [
                  { type: 'string', name: 'label', label: 'Label' },
                  { type: 'string', name: 'href', label: 'Link' },
                  { type: 'boolean', name: 'outline', label: 'Outline style' },
                ],
              },
            ],
          },
        ],
      },

      // ---------- Site settings: nav + footer ----------
      {
        name: 'site',
        label: 'Site settings (nav & footer)',
        path: 'content/settings',
        format: 'json',
        match: { include: 'site' },
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: 'string', name: 'siteTitle', label: 'Site title' },
          {
            type: 'object',
            name: 'nav',
            label: 'Main navigation',
            list: true,
            ui: { itemProps: (item: any) => ({ label: item?.label || 'Item' }) },
            fields: [
              { type: 'string', name: 'label', label: 'Label' },
              { type: 'string', name: 'href', label: 'Link' },
              {
                type: 'object', name: 'children', label: 'Dropdown items', list: true,
                ui: { itemProps: (item: any) => ({ label: item?.label || 'Item' }) },
                fields: [
                  { type: 'string', name: 'label', label: 'Label' },
                  { type: 'string', name: 'href', label: 'Link' },
                  {
                    type: 'object', name: 'children', label: 'Flyout items', list: true,
                    ui: { itemProps: (item: any) => ({ label: item?.label || 'Item' }) },
                    fields: [
                      { type: 'string', name: 'label', label: 'Label' },
                      { type: 'string', name: 'href', label: 'Link' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'footer',
            label: 'Footer',
            fields: [
              { type: 'string', name: 'brandText', label: 'Brand paragraph', ui: { component: 'textarea' } },
              { type: 'string', name: 'contactEmail', label: 'Contact email' },
              { type: 'string', name: 'copyright', label: 'Copyright line' },
              {
                type: 'object', name: 'columns', label: 'Link columns', list: true,
                ui: { itemProps: (item: any) => ({ label: item?.title || 'Column' }) },
                fields: [
                  { type: 'string', name: 'title', label: 'Column title' },
                  {
                    type: 'object', name: 'links', label: 'Links', list: true,
                    ui: { itemProps: (item: any) => ({ label: item?.label || 'Link' }) },
                    fields: [
                      { type: 'string', name: 'label', label: 'Label' },
                      { type: 'string', name: 'href', label: 'Link' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});
