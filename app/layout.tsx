import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { StoreHydrator } from "@/lib/store/store-hydrator";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "따로같이",
  description: "함께 장소를 모으고, 드래그로 일정을 짜는 여행 계획 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex h-dvh flex-col overflow-hidden">
        <StoreHydrator />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
