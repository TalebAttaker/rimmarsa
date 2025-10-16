import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "ريمارسا - سوق متعدد البائعين",
  description: "اشترِ وبع المنتجات مباشرة من البائعين المحليين في موريتانيا. انضم إلى سوقنا مع مزايا الإحالة الحصرية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} antialiased font-cairo`}
      >
        {children}
      </body>
    </html>
  );
}
