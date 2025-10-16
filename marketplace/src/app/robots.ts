import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/fassalapremierprojectbsk/',
          '/vendor/dashboard/',
          '/vendor/products/',
          '/vendor/analytics/',
          '/vendor/subscription/',
        ],
      },
    ],
    sitemap: 'https://rimmarsa.com/sitemap.xml',
  }
}
