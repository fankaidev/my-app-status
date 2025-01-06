import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "My App Status",
  description: "My App Status Page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
