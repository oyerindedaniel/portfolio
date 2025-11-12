import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

const shadowsIntoLight = localFont({
  src: "../app/fonts/shadows-into-light/ShadowsIntoLight-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-shadows-into-light",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export { shadowsIntoLight, geistMono, geistSans };
