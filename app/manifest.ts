import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kapilla Logistics Management System',
    short_name: 'Kapilla',
    description: 'Professional Logistics & Tracking System - Fast, Reliable, Secure',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b1f3a',
    orientation: 'portrait-primary',
    categories: ['business', 'logistics', 'productivity'],
    icons: [
      {
        src: '/logo-mark.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-mark.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
