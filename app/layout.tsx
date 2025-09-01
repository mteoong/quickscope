import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const switzer = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-switzer",
})

export const metadata: Metadata = {
  title: "Crypto Trading Terminal",
  description: "Professional crypto trading terminal with real-time charts and data",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${inter.variable} ${switzer.variable} antialiased bg-background text-foreground`}
      >
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </body>
    </html>
  )
}
