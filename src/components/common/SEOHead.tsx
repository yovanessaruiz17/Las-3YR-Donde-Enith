import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'Las 3YR — Donde Enith | Catálogo & Tienda Online en Cartagena';
const DEFAULT_DESCRIPTION = 'Tienda de catálogo en Cartagena: Natura, Avon, Yanbal, Leonisa, Ésika y Azzorti. Perfumería, belleza y cuidado personal con entregas por DiDi / inDrive en Cartagena y pagos por Nequi, Llave o Contraentrega.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80';
const AUTHOR = 'Yordev';
const AUTHOR_URL = 'https://yordevctg17.netlify.app/';

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = 'Las 3YR, Donde Enith, Yordev, Natura Cartagena, Avon Cartagena, Yanbal Cartagena, Leonisa Cartagena, Ésika Cartagena, Azzorti, catálogo de belleza Cartagena, perfumes originales Cartagena, domicilios didi indriver cartagena, pago contraentrega cartagena, transferencia nequi, transferencia llave',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  jsonLd,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const fullTitle = title ? `${title} | Las 3YR — Donde Enith Cartagena` : DEFAULT_TITLE;
    document.title = fullTitle;

    // 2. Helper to set or create meta tags
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Standard SEO Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'author', AUTHOR);
    setMetaTag('name', 'creator', `${AUTHOR} (${AUTHOR_URL})`);
    setMetaTag('name', 'publisher', 'Las 3YR — Donde Enith');
    setMetaTag('name', 'geo.region', 'CO-BOL');
    setMetaTag('name', 'geo.placename', 'Cartagena, Bolívar, Colombia');
    setMetaTag('name', 'geo.position', '10.3910;-75.4794');
    setMetaTag('name', 'ICBM', '10.3910, -75.4794');

    // Open Graph Tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'Las 3YR — Donde Enith');
    if (url) setMetaTag('property', 'og:url', url);

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);
    setMetaTag('name', 'twitter:creator', '@yordev');

    // Dynamic JSON-LD injection if provided
    let scriptTag: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify(jsonLd);
      scriptTag.id = 'dynamic-page-seo-jsonld';
      document.head.appendChild(scriptTag);
    }

    return () => {
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, [title, description, keywords, image, url, type, jsonLd]);

  return null;
};
