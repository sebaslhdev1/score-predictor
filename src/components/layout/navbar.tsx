"use client"

import { useState, useSyncExternalStore } from "react"
import { BarChart2, LogOut, Trophy, User, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { useT } from "@/i18n/use-t"
import { cn } from "@/lib/utils"
import { logout } from "@/services/auth"
import { getUserName } from "@/lib/session"

const tournamentNavItems = [
  { segment: "predictions",  labelKey: "predictions"  as const, icon: Trophy    },
  { segment: "scoreboard",   labelKey: "scoreboard"   as const, icon: BarChart2 },
  { segment: "participants", labelKey: "participants" as const, icon: Users     },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const t = useT()
  const [openMenu, setOpenMenu] = useState<"language" | "user" | null>(null)
  const tournamentId = params?.id as string | undefined

  const userName = useSyncExternalStore(
    () => () => {},
    () => getUserName(),
    () => null,
  )

  function handleLogout() {
    logout()
    router.push("/login")
  }

  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL

  return (
    <header
      className="sticky top-0 z-50 shadow-md"
      style={{ backgroundColor: "var(--brand-dark)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex h-16 w-full items-center gap-4 px-6">
        {/* Logo */}
        <Link href="/tournaments" className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Score Predictor logo"
              width={36}
              height={36}
              className="rounded-xl"
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--brand-orange)" }}
            >
              <Trophy className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-white">{t.nav.appTitle}</span>
            <span className="text-[10px] tracking-wide" style={{ color: "var(--brand-muted)" }}>
              {t.nav.appSubtitle}
            </span>
          </div>
        </Link>

        {/* Tournament nav links — desktop only */}
        {tournamentId && (
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {tournamentNavItems.map(({ segment, labelKey, icon: Icon }) => {
              const href = `/tournaments/${tournamentId}/${segment}`
              const isActive = pathname === href
              return (
                <Link
                  key={segment}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-white bg-white/10"
                      : "text-white/50 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.nav[labelKey]}
                </Link>
              )
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1 -mr-2 ml-auto">
          {/* Greeting */}
          {userName && (
            <span className="hidden sm:flex items-center gap-1.5 text-sm pr-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              {t.nav.greeting},{" "}
              <span className="font-semibold text-white">{userName}</span>
            </span>
          )}

          <div className="hidden md:block">
            <LanguageSwitcher
              open={openMenu === "language"}
              onOpenChange={(o) => setOpenMenu(o ? "language" : null)}
            />
          </div>

          {/* User dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/10"
              onClick={() => setOpenMenu((prev) => (prev === "user" ? null : "user"))}
            >
              <User className="h-5 w-5" />
            </Button>

            {openMenu === "user" && (
              <>
                <div className="fixed inset-0" onClick={() => setOpenMenu(null)} />
                <div
                  className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl bg-white shadow-lg"
                  style={{ border: "1px solid color-mix(in srgb, var(--brand-dark) 10%, transparent)" }}
                >
                  {userName && (
                    <div
                      className="border-b px-4 py-2.5"
                      style={{ borderColor: "color-mix(in srgb, var(--brand-dark) 8%, transparent)" }}
                    >
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>
                        {userName}
                      </p>
                    </div>
                  )}
                  <div className="block md:hidden px-4 py-2.5 border-b" style={{ borderColor: "color-mix(in srgb, var(--brand-dark) 8%, transparent)" }}>
                    <LanguageSwitcher
                      open={openMenu === "language"}
                      onOpenChange={(o) => setOpenMenu(o ? "language" : null)}
                    />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    style={{ color: "var(--brand-dark)" }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t.nav.logOut}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
