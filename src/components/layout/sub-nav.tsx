"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useT } from "@/i18n/use-t"
import { BarChart2, Trophy, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/predictions",  labelKey: "predictions" as const, icon: Trophy    },
  { href: "/scoreboard",   labelKey: "scoreboard"  as const, icon: BarChart2 },
  { href: "/participants", labelKey: "participants" as const, icon: Users     },
]

export function SubNav() {
  const pathname = usePathname()
  const t = useT()

  return (
    <nav
      className="sticky top-16 z-40 hidden border-b md:block"
      style={{ backgroundColor: "var(--brand-dark)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto flex max-w-3xl px-4">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-[var(--brand-orange)] text-white"
                  : "border-transparent text-white/50 hover:text-white/80",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.nav[labelKey]}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
