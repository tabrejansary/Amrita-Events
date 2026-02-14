import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amrita Events - All Events, One Place",
  description: "Campus Event Discovery Platform for Amrita Vishwa Vidyapeetham, Bengaluru",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
