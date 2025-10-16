import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rimmarsa.com'),
  title: {
    default: "ريمارسا - سوق متعدد البائعين في موريتانيا | Rimmarsa Marketplace",
    template: "%s | ريمارسا"
  },
  description: "ريمارسا هو أفضل سوق إلكتروني متعدد البائعين في موريتانيا. اشترِ وبع المنتجات المحلية مباشرة من البائعين الموثوقين. احصل على عمولات إحالة حصرية وانضم إلى مجتمع التجارة الإلكترونية الأسرع نمواً في موريتانيا.",
  keywords: [
    "ريمارسا", "Rimmarsa", "سوق موريتانيا", "تجارة إلكترونية",
    "بيع وشراء", "منتجات محلية", "بائعون موريتانيا",
    "متجر إلكتروني", "نواكشوط", "موريتانيا",
    "marketplace mauritania", "e-commerce mauritania",
    "buy sell online", "local vendors", "nouakchott"
  ],
  authors: [{ name: "Rimmarsa Team" }],
  creator: "Rimmarsa",
  publisher: "Rimmarsa",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ar_MR",
    alternateLocale: ["en_US", "fr_FR"],
    url: "https://rimmarsa.com",
    siteName: "ريمارسا Rimmarsa",
    title: "ريمارسا - سوق متعدد البائعين في موريتانيا",
    description: "اشترِ وبع المنتجات المحلية مباشرة من البائعين الموثوقين في موريتانيا. انضم إلى أسرع سوق إلكتروني نمواً مع مزايا الإحالة الحصرية.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ريمارسا - سوق موريتانيا الإلكتروني",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ريمارسا - سوق متعدد البائعين في موريتانيا",
    description: "اشترِ وبع المنتجات المحلية مباشرة من البائعين الموثوقين",
    images: ["/twitter-image.png"],
    creator: "@rimmarsa",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://rimmarsa.com",
    languages: {
      'ar': "https://rimmarsa.com",
      'en': "https://rimmarsa.com/en",
      'fr': "https://rimmarsa.com/fr",
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    other: {
      "facebook-domain-verification": "your-facebook-verification-code",
    },
  },
  category: "e-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Additional SEO Tags */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "ريمارسا Rimmarsa",
              "alternateName": "Rimmarsa Marketplace",
              "url": "https://rimmarsa.com",
              "description": "أفضل سوق إلكتروني متعدد البائعين في موريتانيا",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://rimmarsa.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "inLanguage": ["ar", "en", "fr"]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "ريمارسا Rimmarsa",
              "url": "https://rimmarsa.com",
              "logo": "https://rimmarsa.com/logo.png",
              "description": "سوق متعدد البائعين في موريتانيا",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "MR",
                "addressLocality": "Nouakchott"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+222-XX-XX-XX-XX",
                "contactType": "customer service",
                "availableLanguage": ["Arabic", "French", "English"]
              },
              "sameAs": [
                "https://facebook.com/rimmarsa",
                "https://twitter.com/rimmarsa",
                "https://instagram.com/rimmarsa",
                "https://linkedin.com/company/rimmarsa"
              ]
            })
          }}
        />
      </head>
      <body
        className={`${cairo.variable} antialiased font-cairo`}
      >
        {children}
      </body>
    </html>
  );
}
