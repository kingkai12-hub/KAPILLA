import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/staff', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
