import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.tributoo.com';

const LANG_LOCALE = { en: 'en_US', de: 'de_DE', it: 'it_IT' };

// Detect current language from URL prefix
const getLangFromPath = (pathname) => {
    if (pathname.startsWith('/de/') || pathname === '/de') return 'de';
    if (pathname.startsWith('/it/') || pathname === '/it') return 'it';
    return 'en';
};

// Given a path, return the same path for each language variant
const buildAlternates = (pathname) => {
    // Strip existing lang prefix to get the base path
    let basePath = pathname;
    if (pathname.startsWith('/de')) basePath = pathname.slice(3) || '/';
    else if (pathname.startsWith('/it')) basePath = pathname.slice(3) || '/';

    return {
        en: `${SITE_URL}${basePath}`,
        de: `${SITE_URL}/de${basePath === '/' ? '' : basePath}`,
        it: `${SITE_URL}/it${basePath === '/' ? '' : basePath}`,
    };
};

const SEO = ({ title, description, keywords, ogImage, canonicalUrl }) => {
    const defaultTitle = "Tributoo - Digital Memorials";
    const defaultDescription = "Create everlasting digital memorials for your loved ones.";

    const location = useLocation();
    const currentLang = getLangFromPath(location.pathname);
    const ogLocale = LANG_LOCALE[currentLang];
    const alternates = buildAlternates(location.pathname);
    const canonical = canonicalUrl || alternates[currentLang];

    const finalTitle = title ? `${title} | Tributoo` : defaultTitle;
    const finalDescription = description || defaultDescription;

    return (
        <Helmet>
            <html lang={currentLang} />
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            {keywords && <meta name="keywords" content={keywords} />}

            {/* Canonical & hreflang */}
            <link rel="canonical" href={canonical} />
            <link rel="alternate" hrefLang="en" href={alternates.en} />
            <link rel="alternate" hrefLang="de" href={alternates.de} />
            <link rel="alternate" hrefLang="it" href={alternates.it} />
            <link rel="alternate" hrefLang="x-default" href={alternates.en} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:locale" content={ogLocale} />
            <meta property="og:locale:alternate" content={LANG_LOCALE[currentLang === 'en' ? 'de' : 'en']} />
            <meta property="og:locale:alternate" content={LANG_LOCALE[currentLang === 'it' ? 'de' : 'it']} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            {ogImage && <meta property="og:image" content={ogImage} />}
            <meta property="og:url" content={canonical} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}
        </Helmet>
    );
};

export default SEO;
