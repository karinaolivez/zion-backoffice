import { MetadataRoute } from 'next'
import { locales } from '@/i18n'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
  
  // Define the main routes
  const routes = ['', '/login', '/profile']
  
  // Generate sitemap entries for each locale and route
  const sitemapEntries: MetadataRoute.Sitemap = []
  
  // Add default entries (without locale prefix)
  routes.forEach(route => {
    sitemapEntries.push({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: route === '' ? 1 : 0.8,
      alternates: {
        languages: locales.reduce((acc, locale) => {
          acc[locale] = `${baseUrl}/${locale}${route}`
          return acc
        }, {} as Record<string, string>)
      }
    })
  })
  
  // Add localized entries
  locales.forEach(locale => {
    routes.forEach(route => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 0.9 : 0.7,
      })
    })
  })
  
  return sitemapEntries
}