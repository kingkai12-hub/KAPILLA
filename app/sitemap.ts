import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kapilla-logistics.vercel.app';
  const now = new Date();
  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changefreq: 'daily',
      priority: 1,
    },
  ];
}
