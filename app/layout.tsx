import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Omid Zanganeh – GIS & Software Developer",
  description: "Resume of Omid Zanganeh, GIS Associate Technician and Software Developer specializing in Python, ArcGIS, and AI-powered workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={ibmPlexMono.variable}>{children}</body>
    </html>
  );
}
