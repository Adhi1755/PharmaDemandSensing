import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GlobalMotion from "@/components/GlobalMotion";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PharmaSense AI - Intermittent Demand Sensing",
  description:
    "AI-powered demand sensing for intermittent pharma sales using Temporal Fusion Transformer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        <GlobalMotion />
        {children}
      </body>
    </html>
  );
}
