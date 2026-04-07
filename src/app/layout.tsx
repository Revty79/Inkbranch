import type { Metadata } from "next";
import { Literata, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bodySerif = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  display: "swap",
});

const uiSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Inkbranch",
    template: "%s | Inkbranch",
  },
  description:
    "Inkbranch is a multi-perspective interactive fiction platform shaped around canon, Chronicle state, and reader agency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodySerif.variable} ${uiSans.variable} h-full antialiased`}
    >
      <body className="min-h-full text-[var(--ink-text)]">{children}</body>
    </html>
  );
}
