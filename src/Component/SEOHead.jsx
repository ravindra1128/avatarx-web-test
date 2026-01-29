import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO } from '../utils/seo.js';

const SEOHead = ({ 
  title, 
  description, 
  keywords, 
  ogTitle, 
  ogDescription, 
  ogImage, 
  canonical,
  structuredData,
  noIndex = false 
}) => {
  const location = useLocation();

  useEffect(() => {
    const currentUrl = canonical || `${window.location.origin}${location.pathname}`;
    
    SEO.updatePageSEO({
      title,
      description,
      keywords,
      canonical: currentUrl,
      ogTitle: ogTitle || title,
      ogDescription: ogDescription || description,
      ogImage: ogImage || '/social.png',
      ogUrl: currentUrl,
      structuredData,
      twitterCard: 'summary_large_image'
    });

    // Set noindex if specified
    if (noIndex) {
      SEO.setMetaTag('robots', 'noindex, nofollow');
    } else {
      SEO.setMetaTag('robots', 'index, follow');
    }

    // Cleanup function
    return () => {
      // Reset to default SEO when component unmounts
      SEO.updatePageSEO({
        title: 'AvatarX Health - AI-Powered Healthcare Solutions',
        description: 'Transform healthcare delivery with AvatarX Health. AI-powered chronic care management and remote patient monitoring solutions.',
        keywords: 'healthcare AI, chronic care management, remote patient monitoring, digital health',
        canonical: window.location.origin,
        ogTitle: 'AvatarX Health - AI-Powered Healthcare Solutions',
        ogDescription: 'Transform healthcare delivery with AI-powered healthcare solutions.',
        ogImage: '/social.png',
        ogUrl: window.location.origin
      });
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, canonical, structuredData, noIndex, location.pathname]);

  return null; // This component doesn't render anything
};

export default SEOHead; 