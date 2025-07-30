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
  icons: {
    icon: '/League_Logo.png', // Renamed file without spaces
    // Alternative: you can specify multiple formats
    // icon: [
    //   { url: '/league-of-naija-logo.svg', type: 'image/svg+xml' },
    //   { url: '/favicon.ico' },
    // ],
  },
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
