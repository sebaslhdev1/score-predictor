"use client"

import { en } from "./locales/en"
import { es } from "./locales/es"
import { useLocale } from "./provider"

const locales = { en, es }

export function useT() {
  const { locale } = useLocale()
  return locales[locale]
}
