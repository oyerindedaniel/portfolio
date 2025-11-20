import * as React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { geistMono, geistSans, shadowsIntoLight } from "@/lib/fonts";
import { cn } from "../lib/cn";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://oyerindedaniel.com";

export const metadata: Metadata = {
  title: {
    default: "Oyerinde Daniel",
    template: "%s | Oyerinde Daniel",
  },
  description:
    "Full-Stack TypeScript Engineer. I love engineering systems - building software that work seamlessly and scale effortlessly.",
  keywords: [
    "Oyerinde Daniel",
    "Full-Stack Developer",
    "TypeScript Engineer",
    "Software Engineer",
    "Web Developer",
    "Portfolio",
  ],
  authors: [{ name: "Oyerinde Daniel" }],
  creator: "Oyerinde Daniel",
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Oyerinde Daniel",
    title: "Oyerinde Daniel - Full-Stack TypeScript Engineer",
    description:
      "Full-Stack TypeScript Engineer. I love engineering systems - building software that work seamlessly and scale effortlessly.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Oyerinde Daniel - Full-Stack TypeScript Engineer",
      },
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Oyerinde Daniel - Full-Stack TypeScript Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oyerinde Daniel - Full-Stack TypeScript Engineer",
    description:
      "Full-Stack TypeScript Engineer. I love engineering systems - building software that work seamlessly and scale effortlessly.",
    images: ["/og-image.jpg"],
    creator: "@fybnow",
  },
};

export default function RootLayout(props: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          shadowsIntoLight.variable,
          "antialiased px-6 min-h-dvh h-full"
        )}
      >
        {props.children}
      </body>
    </html>
  );
}
