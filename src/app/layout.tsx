import { Toaster } from "@/components/ui/sonner"
import { LocaleProvider } from "@/i18n/provider"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SportiQ",
  description: "Predict scores for your favorite tournaments",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      translate='no'
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased notranslate`}
    >
      <body className='min-h-full flex flex-col'>
        <LocaleProvider>{children}</LocaleProvider>
        <Toaster position='bottom-center' richColors mobileOffset={80} />
      </body>
    </html>
  )
}
