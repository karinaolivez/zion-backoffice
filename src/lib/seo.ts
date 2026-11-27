import type { Metadata } from 'next';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Zion App Name';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  locale?: string;
  siteName?: string;
}

const defaultSEO = {
  siteName: APP_NAME,
  description: 'Modern backoffice application built with Next.js',
  image: '/og-image.png',
  type: 'website' as const,
  locale: 'pt-BR',
};

export function generateSEO({
  title,
  description = defaultSEO.description,
  keywords = [],
  image = defaultSEO.image,
  url,
  type = defaultSEO.type,
  locale = defaultSEO.locale,
  siteName = defaultSEO.siteName,
}: SEOProps = {}): Metadata {
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: url ? new URL(url) : undefined,
    alternates: {
      canonical: url,
      languages: {
        'pt-BR': '/pt',
        'en-US': '/en',
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@zionbackoffice',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

export function generateStructuredData(data: {
  type: 'Organization' | 'WebSite' | 'WebPage';
  name: string;
  url: string;
  description?: string;
  logo?: string;
  sameAs?: string[];
}) {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': data.type,
    name: data.name,
    url: data.url,
    description: data.description,
  };

  switch (data.type) {
    case 'Organization':
      return {
        ...baseStructure,
        logo: data.logo,
        sameAs: data.sameAs,
      };
    case 'WebSite':
      return {
        ...baseStructure,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${data.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
    default:
      return baseStructure;
  }
}

export const jsonLd = {
  organization: generateStructuredData({
    type: 'Organization',
    name: APP_NAME,
    url: 'https://zion-backoffice.com',
    description: 'Modern backoffice application built with Next.js',
    logo: 'https://zion-backoffice.com/logo.png',
    sameAs: [
      'https://twitter.com/zionbackoffice',
      'https://linkedin.com/company/zionbackoffice',
    ],
  }),
  website: generateStructuredData({
    type: 'WebSite',
    name: APP_NAME,
    url: 'https://zion-backoffice.com',
    description: 'Modern backoffice application built with Next.js',
  }),
};