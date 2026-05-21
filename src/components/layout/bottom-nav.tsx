"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useT } from "@/i18n/use-t"
import { BarChart2, Trophy, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const navItems = [
  { segment: "predictions",  labelKey: "predictions" as const, icon: Trophy    },
  { segment: "scoreboard",   labelKey: "scoreboard"  as const, icon: BarChart2 },
  { segment: "participants", labelKey: "participants" as const, icon: Users     },
]

export function BottomNav() {
  const pathname = usePathname()
  const params = useParams()
  const t = useT()
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY
      if (currentY < 10) {
        setVisible(true)
      } else if (currentY > lastScrollY.current + 4) {
        setVisible(false)
      } else if (currentY < lastScrollY.current - 4) {
        setVisible(true)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const tournamentId = params?.id as string | undefined
  if (!tournamentId) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t transition-transform duration-300 md:hidden"
      style={{
        backgroundColor: "var(--brand-dark)",
        borderColor: "rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
      }}
    >
      <div className="flex h-16 items-stretch">
        {navItems.map(({ segment, labelKey, icon: Icon }) => {
          const href = `/tournaments/${tournamentId}/${segment}`
          const isActive = pathname === href
          return (
            <Link
              key={segment}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-opacity active:opacity-70"
            >
              <Icon
                className="h-5 w-5 transition-colors"
                style={{ color: isActive ? "var(--brand-orange)" : "rgba(255,255,255,0.35)" }}
              />
              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: isActive ? "var(--brand-orange)" : "rgba(255,255,255,0.35)" }}
              >
                {t.nav[labelKey]}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
