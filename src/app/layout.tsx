import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Global Metadata (applies to all pages)
export const metadata: Metadata = {
  title: "MyBeratur - Malaysia's Digital Queue System",
  description:
    "Skip the long lines! Book your queue number online for JPN, JPJ, Immigration, and Police services. Priority queue for senior citizens, OKU, pregnant women, and children.",
  keywords: [
    "Malaysia Queue System",
    "Digital Queue",
    "Online Queue Booking",
    "IC Renewal",
    "Passport Renewal",
    "License Renewal",
    "Saman Payment",
    "JPN Services",
    "JPJ Services",
    "Immigration Malaysia",
    "Police Services",
    "Priority Queue",
    "Warga Emas",
    "OKU",
    "Wanita Hamil",
    "Kanak-kanak",
    "Government Services",
    "Malaysia Government",
  ],
  authors: [{ name: "MyBeratur Team" }],
  creator: "MyBeratur",
  publisher: "MyBeratur",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://myberatur.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MyBeratur - Malaysia's Digital Queue System",
    description:
      "Skip the long lines! Book your queue number online for JPN, JPJ, Immigration, and Police services. Priority queue for senior citizens, OKU, pregnant women, and children.",
    url: "https://myberatur.com",
    siteName: "MyBeratur",
    locale: "en_MY",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MyBeratur - Malaysia's Digital Queue System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyBeratur - Malaysia's Digital Queue System",
    description:
      "Skip the long lines! Book your queue number online for JPN, JPJ, Immigration, and Police services.",
    images: ["/og-image.jpg"],
    creator: "@myberatur",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('color-theme');
                  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
