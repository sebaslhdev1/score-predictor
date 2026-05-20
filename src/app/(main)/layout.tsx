import { BottomNav } from "@/components/layout/bottom-nav"
import { Navbar } from "@/components/layout/navbar"
import { SubNav } from "@/components/layout/sub-nav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <SubNav />
      {children}
      <BottomNav />
    </div>
  )
}
