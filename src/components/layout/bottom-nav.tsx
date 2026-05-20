"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useT } from "@/i18n/use-t"
import { BarChart2, Trophy, Users } from "lucide-react"

const navItems = [
  { href: "/predictions",  labelKey: "predictions" as const, icon: Trophy    },
  { href: "/scoreboard",   labelKey: "scoreboard"  as const, icon: BarChart2 },
  { href: "/participants", labelKey: "participants" as const, icon: Users     },
]

export function BottomNav() {
  const pathname = usePathname()
  const t = useT()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t md:hidden"
      style={{
        backgroundColor: "var(--brand-dark)",
        borderColor: "rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-16 items-stretch">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
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
