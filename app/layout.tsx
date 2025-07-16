import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-free/css/all.min.css';
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: "League of Naija",
  description: "A league of Naija Community we",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} antialiased min-h-full`}>
        {children}
      </body>
    </html>
  );
}
