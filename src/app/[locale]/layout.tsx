import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/lib/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthPermissionsProvider } from "@/contexts/permission-context";
import { locales } from '@/i18n';
import "flag-icons/css/flag-icons.min.css";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Zion App Name';

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Modern backoffice application built with Next.js, TypeScript, and Tailwind CSS",
  keywords: ["backoffice", "dashboard", "nextjs", "typescript", "tailwind"],
  authors: [{ name: "Zion Team" }],
  creator: "Zion Team",
  publisher: "Zion",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      'pt': '/pt',
      'en': '/en',
      'es': '/es',
      'x-default': '/',
    },
  },
  openGraph: {
    title: APP_NAME,
    description: "Modern backoffice application built with Next.js, TypeScript, and Tailwind CSS",
    siteName: APP_NAME,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: "Modern backoffice application built with Next.js, TypeScript, and Tailwind CSS",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased dark">
        <ErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange
              forcedTheme="dark"
            >
              <AuthProvider>
                <AuthPermissionsProvider>
                  {children}
                </AuthPermissionsProvider>
              </AuthProvider>
              <Toaster />
            </ThemeProvider>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}