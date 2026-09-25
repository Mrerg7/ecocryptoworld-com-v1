export const SITE = {
  name: 'ecocryptoworld.com',
  title: 'ecocryptoworld.com • Eco Crypto World | Premium Domain for Sale',
  description:
    'ecocryptoworld.com — The premium .com domain for "Eco Crypto World". A powerful, mission-driven brand for the intersection of cryptocurrency, sustainability, regenerative finance, and planetary impact.',
  url: 'https://ecocryptoworld.com/',
  locale: 'en_US',
  acquisitionEmail: 'sales@desertrich.com',
  updated: '2026-09-25',
} as const;

/** Public asking price — must stay identical to the Offer.price structured data in SEO.astro. */
export const DOMAIN_PRICE = {
  amount: '27500.00',
  currency: 'USD',
  display: '$27,500',
} as const;

const SUBJECT = `${SITE.name} — Domain Acquisition Inquiry`;

export const ACQUISITION_MAILTO = `mailto:${SITE.acquisitionEmail}?subject=${encodeURIComponent(
  SUBJECT,
)}&body=${encodeURIComponent(
  'Hello,\n\nI am interested in acquiring ecocryptoworld.com. Please share availability, terms, and next steps.\n\n— ',
)}`;

/** Compose a pre-filled inquiry email from the on-page offer form. */
export function buildInquiryMailto(input: {
  name: string;
  email: string;
  offer?: string;
  message?: string;
}): string {
  const lines = [
    'Hello,',
    '',
    `I would like to discuss acquiring ${SITE.name}.`,
    '',
    `Name: ${input.name}`,
    `Reply to: ${input.email}`,
  ];

  const offer = (input.offer ?? '').trim();
  if (offer) {
    const normalized = /^\$/.test(offer) ? offer : `$${offer}`;
    lines.push(`Offer: ${normalized}${/usd/i.test(offer) ? '' : ' USD'}`);
  }

  if (input.message) {
    lines.push('', 'Message:', input.message);
  }
  lines.push('', '— ');

  return `mailto:${SITE.acquisitionEmail}?subject=${encodeURIComponent(
    SUBJECT,
  )}&body=${encodeURIComponent(lines.join('\n'))}`;
}
