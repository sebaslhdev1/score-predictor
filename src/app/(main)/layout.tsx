import { BottomNav } from "@/components/layout/bottom-nav"
import { Navbar } from "@/components/layout/navbar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      {children}
      <BottomNav />
    </div>
  )
}
