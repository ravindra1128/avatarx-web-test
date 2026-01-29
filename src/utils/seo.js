// SEO Utility Functions
export class SEO {
  static setTitle(title) {
    document.title = title;
  }

  static setMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  static setOpenGraphTag(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  static setCanonical(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  static setStructuredData(data) {
    // Remove existing structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  static updatePageSEO({
    title,
    description,
    keywords,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    twitterCard = 'summary_large_image',
    structuredData
  }) {
    // Set title
    if (title) {
      this.setTitle(title);
    }

    // Set meta description
    if (description) {
      this.setMetaTag('description', description);
    }

    // Set keywords
    if (keywords) {
      this.setMetaTag('keywords', keywords);
    }

    // Set canonical URL
    if (canonical) {
      this.setCanonical(canonical);
    }

    // Set Open Graph tags
    if (ogTitle) {
      this.setOpenGraphTag('og:title', ogTitle);
    }
    if (ogDescription) {
      this.setOpenGraphTag('og:description', ogDescription);
    }
    if (ogImage) {
      this.setOpenGraphTag('og:image', ogImage);
    }
    if (ogUrl) {
      this.setOpenGraphTag('og:url', ogUrl);
    }
    this.setOpenGraphTag('og:type', 'website');

    // Set Twitter Card tags
    this.setMetaTag('twitter:card', twitterCard);
    if (ogTitle) {
      this.setMetaTag('twitter:title', ogTitle);
    }
    if (ogDescription) {
      this.setMetaTag('twitter:description', ogDescription);
    }
    if (ogImage) {
      this.setMetaTag('twitter:image', ogImage);
    }

    // Set structured data
    if (structuredData) {
      this.setStructuredData(structuredData);
    }
  }
}

// Predefined SEO configurations for different pages
export const SEO_CONFIGS = {
  home: {
    title: 'AvatarX Health - AI-Powered Healthcare Solutions | Chronic Care Management & Remote Patient Monitoring',
    description: 'Transform healthcare delivery with AvatarX Health. AI-powered chronic care management and remote patient monitoring solutions that improve patient outcomes and reduce costs.',
    keywords: 'healthcare AI, chronic care management, remote patient monitoring, digital health, patient engagement, healthcare technology',
    ogTitle: 'AvatarX Health - AI-Powered Healthcare Solutions',
    ogDescription: 'Transform healthcare delivery with AI-powered chronic care management and remote patient monitoring.',
    ogImage: '/social.png',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'AvatarX Health',
      url: 'https://theavatarx.com',
      logo: 'https://theavatarx.com/logo.png',
      description: 'AI-powered healthcare solutions for chronic care management and remote patient monitoring',
      sameAs: [
        'https://linkedin.com/company/avatarx-health',
        'https://twitter.com/avatarxhealth'
      ]
    }
  },
  chronicCareManagement: {
    title: 'Chronic Care Management (CCM) - AvatarX Health | Improve Patient Outcomes',
    description: 'Comprehensive chronic care management solutions that boost patient engagement, reduce hospital visits, and improve health outcomes. Custom CCM programs for your practice.',
    keywords: 'chronic care management, CCM, patient engagement, healthcare outcomes, care coordination, Medicare CCM',
    ogTitle: 'Chronic Care Management (CCM) - AvatarX Health',
    ogDescription: 'Comprehensive chronic care management solutions that boost patient engagement and improve health outcomes.',
    ogImage: '/social.png',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Chronic Care Management',
      provider: {
        '@type': 'Organization',
        name: 'AvatarX Health'
      },
      description: 'Comprehensive chronic care management solutions for healthcare providers',
      serviceType: 'Healthcare Management'
    }
  },
  remotePatientMonitoring: {
    title: 'Remote Patient Monitoring (RPM) - AvatarX Health | Continuous Health Tracking',
    description: 'Advanced remote patient monitoring technology that provides continuous health tracking, improves patient engagement, and reduces clinical workload.',
    keywords: 'remote patient monitoring, RPM, health tracking, patient monitoring, telehealth, digital health',
    ogTitle: 'Remote Patient Monitoring (RPM) - AvatarX Health',
    ogDescription: 'Advanced remote patient monitoring technology for continuous health tracking and improved patient engagement.',
    ogImage: '/social.png',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Remote Patient Monitoring',
      provider: {
        '@type': 'Organization',
        name: 'AvatarX Health'
      },
      description: 'Advanced remote patient monitoring technology for continuous health tracking',
      serviceType: 'Healthcare Monitoring'
    }
  },
  contact: {
    title: 'Contact AvatarX Health - Get Started with AI Healthcare Solutions',
    description: 'Ready to transform your healthcare practice? Contact AvatarX Health today to learn about our AI-powered chronic care management and remote patient monitoring solutions.',
    keywords: 'contact AvatarX Health, healthcare consultation, AI healthcare solutions, get started',
    ogTitle: 'Contact AvatarX Health - Get Started Today',
    ogDescription: 'Ready to transform your healthcare practice? Contact AvatarX Health today.',
    ogImage: '/social.png'
  },
  privacy: {
    title: 'Privacy Policy - AvatarX Health | Your Data Security Matters',
    description: 'Learn how AvatarX Health protects your privacy and secures your healthcare data. Our comprehensive privacy policy ensures your information is safe and confidential.',
    keywords: 'privacy policy, data security, healthcare privacy, HIPAA compliance, data protection',
    ogTitle: 'Privacy Policy - AvatarX Health',
    ogDescription: 'Learn how AvatarX Health protects your privacy and secures your healthcare data.',
    ogImage: '/social.png'
  },
  terms: {
    title: 'Terms of Service - AvatarX Health | Service Agreement',
    description: 'Read AvatarX Health\'s terms of service to understand our service agreement, user responsibilities, and platform usage guidelines.',
    keywords: 'terms of service, service agreement, user agreement, platform terms',
    ogTitle: 'Terms of Service - AvatarX Health',
    ogDescription: 'Read AvatarX Health\'s terms of service and service agreement.',
    ogImage: '/social.png'
  }
}; 