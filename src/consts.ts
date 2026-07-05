export const SITE = {
  name: 'ecocryptoworld.com',
  title: 'ecocryptoworld.com • Eco Crypto World | Premium Domain for Sale',
  description:
    'ecocryptoworld.com — The premium .com domain for "Eco Crypto World". A powerful, mission-driven brand for the intersection of cryptocurrency, sustainability, regenerative finance, and planetary impact.',
  url: 'https://ecocryptoworld.com/',
  locale: 'en_US',
  acquisitionEmail: 'sales@desertrich.com',
  updated: '2026-06-01',
} as const;

export const ACQUISITION_MAILTO = `mailto:${SITE.acquisitionEmail}?subject=${encodeURIComponent(
  `${SITE.name} — Domain Acquisition Inquiry`,
)}&body=${encodeURIComponent(
  'Hello,\n\nI am interested in acquiring ecocryptoworld.com. Please share availability, terms, and next steps.\n\n— ',
)}`;
