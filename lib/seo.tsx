const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kitstartai.com";

/** JSON-LD объект для вставки через <script type="application/ld+json"> */
export function jsonLd(data: Record<string, unknown>) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SubSplit",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    "https://x.com/subsplit",
    "https://www.tiktok.com/@subsplit",
  ],
};

export function softwareApplicationSchema() {
  return {
    ...ORGANIZATION_SCHEMA,
    "@type": "SoftwareApplication",
    name: "SubSplit",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "3.99",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "2000",
    },
  };
}

export function faqPageSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

export function blogPostingSchema({
  title,
  description,
  slug,
  date,
  author = "SubSplit Team",
}: {
  title: string;
  description: string;
  slug: string;
  date: string;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    author: { "@type": "Organization", name: author, url: SITE_URL },
    publisher: { "@type": "Organization", name: "SubSplit", url: SITE_URL },
    datePublished: date,
    dateModified: date,
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
    image: `${SITE_URL}/api/og`,
  };
}

export { SITE_URL };
