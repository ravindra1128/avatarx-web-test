import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO, SEO_CONFIGS } from '../utils/seo.js';

export const useSEO = (config = {}) => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    let seoConfig = {};

    // Determine which SEO config to use based on the current path
    if (currentPath === '/') {
      seoConfig = SEO_CONFIGS.home;
    } else if (currentPath === '/chronic-care-management') {
      seoConfig = SEO_CONFIGS.chronicCareManagement;
    } else if (currentPath === '/remote-patient-monitoring') {
      seoConfig = SEO_CONFIGS.remotePatientMonitoring;
    } else if (currentPath === '/contact-us') {
      seoConfig = SEO_CONFIGS.contact;
    } else if (currentPath === '/privacy') {
      seoConfig = SEO_CONFIGS.privacy;
    } else if (currentPath === '/terms') {
      seoConfig = SEO_CONFIGS.terms;
    } else {
      // Default SEO for other pages
      seoConfig = {
        title: 'AvatarX Health - AI-Powered Healthcare Solutions',
        description: 'Transform healthcare delivery with AvatarX Health. AI-powered chronic care management and remote patient monitoring solutions.',
        keywords: 'healthcare AI, chronic care management, remote patient monitoring, digital health',
        ogTitle: 'AvatarX Health - AI-Powered Healthcare Solutions',
        ogDescription: 'Transform healthcare delivery with AI-powered healthcare solutions.',
        ogImage: '/social.png'
      };
    }

    // Merge with custom config passed to the hook
    const finalConfig = {
      ...seoConfig,
      ...config,
      canonical: config.canonical || `${window.location.origin}${currentPath}`,
      ogUrl: config.ogUrl || `${window.location.origin}${currentPath}`
    };

    // Update SEO
    SEO.updatePageSEO(finalConfig);

    // Cleanup function to reset to default SEO when component unmounts
    return () => {
      SEO.updatePageSEO(SEO_CONFIGS.home);
    };
  }, [location.pathname, config]);

  return null;
}; 