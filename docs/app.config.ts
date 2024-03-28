export default defineAppConfig({
  ui: {
    primary: 'blue',
    gray: 'slate',
    footer: {
      bottom: {
        left: 'text-sm text-gray-500 dark:text-gray-400',
        wrapper: 'border-t border-gray-200 dark:border-gray-800',
      },
    },
  },
  seo: {
    siteName: 'tRPC Vue-Query',
  },
  header: {
    logo: {
      alt: '',
      light: '',
      dark: '',
    },
    search: true,
    colorMode: true,
    links: [
      {
        'icon': 'i-simple-icons-github',
        'to': 'https://github.com/falcondev-oss/trpc-vue-query',
        'target': '_blank',
        'aria-label': 'tRPC Vue-Query on GitHub',
      },
    ],
  },
  footer: {
    credits: 'Copyright © 2024',
    colorMode: false,
    links: [
      {
        'icon': 'i-simple-icons-github',
        'to': 'https://github.com/falcondev-oss/trpc-vue-query',
        'target': '_blank',
        'aria-label': 'tRPC Vue-Query on GitHub',
      },
    ],
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      links: [
        {
          icon: 'i-heroicons-star',
          label: 'Star on GitHub',
          to: 'https://github.com/falcondev-oss/trpc-vue-query',
          target: '_blank',
        },
      ],
    },
  },
})
