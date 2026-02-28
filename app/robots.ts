import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://kapilla-logistics.vercel.app';
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
