import type { Metadata } from "next";
import {
  Be_Vietnam_Pro,
  Inter,
} from "next/font/google";

import { AppChrome } from "@/components/app-shell/app-chrome";
import { AppFooter } from "@/components/app-shell/app-footer";

import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: [
    "latin",
    "vietnamese",
  ],
});

const beVietnamPro =
  Be_Vietnam_Pro({
    variable: "--font-dts",
    subsets: [
      "latin",
      "vietnamese",
    ],
    weight: [
      "400",
      "500",
      "600",
      "700",
    ],
  });

export const metadata: Metadata = {
  title: "DTS",
  description:
    "Hệ thống luyện thi bằng lái xe",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col"
        suppressHydrationWarning
      >
        <Providers>
          <AppChrome />

          <main className="flex-1">
            {children}
          </main>

          <AppFooter />
        </Providers>
      </body>
    </html>
  );
}