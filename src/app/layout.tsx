import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestión Electoral Colombia 2026 | Plataforma de Organización Política",
  description: "Sistema de gestión electoral para elecciones Cámara y Senado 2026 en Colombia. Organiza y monitorea tu red política en tiempo real con datos georreferenciados completos.",
  keywords: ["Elecciones Colombia 2026", "Gestión Política", "Organización Electoral", "Candidatos", "Líderes", "Votantes", "Cámara", "Senado"],
  authors: [{ name: "Gestión Electoral Colombia" }],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster />
        </Providers>
      </body>
    </html>
  );
}
