import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bluehour",
  description: "Before Your Sunrise — AI 기반 이력서 분석, CS 퀴즈, 지원 현황 관리 플랫폼",
  metadataBase: new URL("https://bluehour.my"),
  openGraph: {
    title: "Bluehour",
    description: "Before Your Sunrise, 당신의 아침이 시작되는 곳",
    siteName: "Bluehour",
    url: "https://bluehour.my",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1"
        />
      </head>
      <body className={`${manrope.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
        <SpeedInsights />
      </body>
    </html>
  );
}
