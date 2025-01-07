import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "App Status Dashboard",
  description: "Monitor your application status",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
        <Providers>
          <div className="min-h-full">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
