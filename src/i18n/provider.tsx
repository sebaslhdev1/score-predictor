"use client"

import { createContext, useCallback, useContext, useSyncExternalStore } from "react"
import type { Locale } from "./types"

type LocaleContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
})

let _current: Locale | null = null
const _listeners = new Set<() => void>()

function getSnapshot(): Locale {
  if (_current === null) {
    const saved = localStorage.getItem("locale")
    _current =
      saved === "en" || saved === "es"
        ? saved
        : navigator.language.startsWith("es")
          ? "es"
          : "en"
  }
  return _current
}

function subscribe(cb: () => void) {
  _listeners.add(cb)
  return () => _listeners.delete(cb)
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // getServerSnapshot always returns "en" — prevents SSR/client hydration mismatch
  const locale = useSyncExternalStore(subscribe, getSnapshot, () => "en" as Locale)

  const setLocale = useCallback((l: Locale) => {
    _current = l
    localStorage.setItem("locale", l)
    _listeners.forEach((cb) => cb())
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
