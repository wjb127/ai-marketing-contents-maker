import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChakraProvider } from "@/components/providers/ChakraProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI SNS 콘텐츠 메이커",
  description: "AI로 SNS 콘텐츠를 자동으로 생성하고 스케줄링하세요",
  keywords: ["AI", "SNS", "콘텐츠", "자동생성", "스케줄링", "소셜미디어"],
  authors: [{ name: "AI SNS Maker" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI SNS Maker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AI SNS 콘텐츠 메이커",
    title: "AI SNS 콘텐츠 메이커",
    description: "AI로 SNS 콘텐츠를 자동으로 생성하고 스케줄링하세요",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#3182ce',
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChakraProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ChakraProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
