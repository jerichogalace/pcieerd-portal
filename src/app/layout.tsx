import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DOST-PCIEERD Portal",
  description: "Submit your concerns and inquiries to DOST-PCIEERD Portal. A convenient way for visitors to communicate with our office.",
  keywords: ["DOST", "PCIEERD", "Concern", "Government", "Philippines"],
  authors: [{ name: "EUSTDD INTERNS 2026" }],
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "DOST-PCIEERD Portal",
    description: "Submit your concerns and inquiries to DOST-PCIEERD Portal",
    type: "website",
    images: [
      { url: "/logo.png", width: 1200, height: 400, alt: "DOST-PCIEERD Logo" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
