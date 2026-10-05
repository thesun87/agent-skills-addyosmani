import type { Metadata } from "next";
import { Be_Vietnam_Pro, Lora } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tuấn Linh Coffee — Đặt món online",
    template: "%s · Tuấn Linh Coffee",
  },
  description: "Đặt cà phê, trà và bánh từ Tuấn Linh Coffee — giao tận nơi hoặc lấy tại quán.",
  icons: {
    icon: [
      { url: "/brand/logo-mark.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Tuấn Linh Coffee — Đặt món online",
    description: "Cà phê rang mộc pha máy đậm đà bản sắc. Giao tận nơi trong 5km hoặc nhận tại quán.",
    siteName: "Tuấn Linh Coffee",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tuấn Linh Coffee — Đặt món online",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${lora.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
