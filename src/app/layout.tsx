import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import GlobalMotion from "@/components/GlobalMotion";

const dmSans = DM_Sans({
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
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="h-full min-h-screen bg-black m-0 p-0 flex flex-col overflow-x-hidden font-[family-name:var(--font-inter)]">
        <GlobalMotion />
        {children}
      </body>
    </html>
  );
}
