"use client"

import { useLocale } from "@/i18n/provider"
import { useT } from "@/i18n/use-t"
import { cn } from "@/lib/utils"
import { isMatchLocked } from "@/services/predictions"
import type { Question, QuestionOption } from "@/types/questions"
import { ChevronDown, Search, Star, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { Countdown } from "./countdown"

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000

function formatCloseDate(dueDateStr: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/Bogota",
    }).format(new Date(dueDateStr + "-05:00"))
  } catch {
    return dueDateStr
  }
}

interface ChampionPickerProps {
  question: Question
  value: QuestionOption | null
  onChange: (option: QuestionOption | null) => void
}

export function ChampionPicker({
  question,
  value,
  onChange,
}: ChampionPickerProps) {
  const t = useT()
  const { locale } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  const questionTitle =
    question.question[locale as "en" | "es"] ?? question.question.en

  const [isLocked, setIsLocked] = useState(() =>
    isMatchLocked(question.due_date),
  )
  const handleExpire = useCallback(() => {
    setIsLocked(true)
    setExpanded(false)
    setDropdownOpen(false)
  }, [])

  const [showStaticClose] = useState(
    () =>
      !isMatchLocked(question.due_date) &&
      new Date(question.due_date + "-05:00").getTime() - Date.now() >
        FIVE_HOURS_MS,
  )

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const inInput = inputWrapperRef.current?.contains(e.target as Node)
      const inDropdown = dropdownRef.current?.contains(e.target as Node)
      if (!inInput && !inDropdown) {
        setDropdownOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = question.options.filter((opt) =>
    opt.option_text.toLowerCase().includes(search.toLowerCase()),
  )

  // Update dropdown position directly in the DOM to avoid re-render lag on scroll
  useEffect(() => {
    if (!dropdownOpen) return
    function syncPos() {
      if (!inputWrapperRef.current || !dropdownRef.current) return
      const r = inputWrapperRef.current.getBoundingClientRect()
      dropdownRef.current.style.top = `${r.bottom + 6}px`
      dropdownRef.current.style.left = `${r.left}px`
      dropdownRef.current.style.width = `${r.width}px`
    }
    window.addEventListener("scroll", syncPos, true)
    window.addEventListener("resize", syncPos)
    return () => {
      window.removeEventListener("scroll", syncPos, true)
      window.removeEventListener("resize", syncPos)
    }
  }, [dropdownOpen])

  function openDropdown() {
    if (inputWrapperRef.current) {
      const r = inputWrapperRef.current.getBoundingClientRect()
      setDropdownPos({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    setDropdownOpen(true)
  }

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    if (!next) {
      setDropdownOpen(false)
      setSearch("")
    } else if (!value) {
      setTimeout(() => {
        openDropdown()
        inputRef.current?.focus()
      }, 300)
    }
  }

  function handleSelect(option: QuestionOption) {
    onChange(option)
    setSearch("")
    setDropdownOpen(false)
    setExpanded(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
    setSearch("")
    setTimeout(() => {
      openDropdown()
      inputRef.current?.focus()
    }, 0)
  }

  const closeLabel = showStaticClose ? (
    <span className='text-xs text-muted-foreground'>
      {t.predictions.closesOn} {formatCloseDate(question.due_date, locale)}
    </span>
  ) : !isLocked ? (
    <Countdown dueDateStr={question.due_date} onExpire={handleExpire} />
  ) : null

  return (
    <div
      className='mb-6 rounded-2xl bg-card'
      style={{
        border:
          "1px solid color-mix(in srgb, var(--brand-orange) 22%, transparent)",
        borderTop: "3px solid var(--brand-orange)",
      }}
    >
      {/* Header — toggle button */}
      <button
        onClick={handleToggle}
        className='flex w-full flex-col gap-1 px-5 py-4 text-left transition-opacity hover:opacity-80'
      >
        {/* Mobile countdown — first row */}
        {closeLabel && <div className='sm:hidden'>{closeLabel}</div>}

        {/* Main header row */}
        <div className='flex w-full items-center justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-2.5'>
            <div
              className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full'
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--brand-orange) 14%, transparent)",
              }}
            >
              <Star
                className='h-4 w-4'
                style={{ color: "var(--brand-orange)" }}
                fill='currentColor'
              />
            </div>
            <div className='min-w-0'>
              <p
                className='text-sm font-bold leading-tight'
                style={{ color: "var(--brand-dark)" }}
              >
                {questionTitle}
              </p>
            </div>
          </div>

          <div className='flex shrink-0 items-center gap-2'>
            {/* Desktop countdown — top right */}
            {closeLabel && <div className='hidden sm:flex'>{closeLabel}</div>}

            {value && (
              <div className='flex items-center gap-1.5'>
                <Image
                  src={`https://flagcdn.com/w40/${value.icon_code}.png`}
                  alt={value.option_text}
                  width={22}
                  height={15}
                  className='rounded object-cover'
                  unoptimized
                />
                <span
                  className='text-sm font-semibold'
                  style={{ color: "var(--brand-dark)" }}
                >
                  {value.option_text}
                </span>
              </div>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-300",
                expanded ? "rotate-180" : "",
              )}
            />
          </div>
        </div>
      </button>

      {/* Collapsible combobox */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className='overflow-hidden'>
          <div className='px-5 pb-5'>
            <div
              ref={inputWrapperRef}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3.5 py-3 transition-all",
                dropdownOpen
                  ? "border-(--brand-orange)"
                  : "border-border hover:border-muted-foreground/40",
              )}
              style={
                dropdownOpen
                  ? {
                      boxShadow:
                        "0 0 0 3px color-mix(in srgb, var(--brand-orange) 15%, transparent)",
                    }
                  : undefined
              }
              onClick={() => {
                if (!value) {
                  if (dropdownOpen) {
                    setDropdownOpen(false)
                  } else {
                    openDropdown()
                    inputRef.current?.focus()
                  }
                }
              }}
            >
              {value ? (
                <>
                  <Image
                    src={`https://flagcdn.com/w40/${value.icon_code}.png`}
                    alt={value.option_text}
                    width={26}
                    height={18}
                    className='shrink-0 rounded object-cover'
                    unoptimized
                  />
                  <span
                    className='flex-1 text-sm font-semibold'
                    style={{ color: "var(--brand-dark)" }}
                  >
                    {value.option_text}
                  </span>
                  <button
                    onClick={handleClear}
                    className='shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </>
              ) : (
                <>
                  <Search className='h-4 w-4 shrink-0 text-muted-foreground' />
                  <input
                    ref={inputRef}
                    type='text'
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      openDropdown()
                    }}
                    onFocus={openDropdown}
                    placeholder={t.predictions.championPlaceholder}
                    className='flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
                  />
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      dropdownOpen ? "rotate-180" : "",
                    )}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Country dropdown — fixed so it escapes overflow-hidden, z-40 keeps it below navbar */}
      {dropdownOpen && !value && (
        <div
          ref={dropdownRef}
          className='fixed z-40 max-h-60 overflow-y-auto rounded-xl bg-white shadow-xl'
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            border:
              "1px solid color-mix(in srgb, var(--brand-dark) 10%, transparent)",
          }}
        >
          {filteredOptions.length === 0 ? (
            <p className='py-6 text-center text-sm text-muted-foreground'>
              {t.predictions.championNoResults}
            </p>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.id}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(opt)
                }}
                className='flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-black/5'
                style={{ color: "var(--brand-dark)" }}
              >
                <Image
                  src={`https://flagcdn.com/w40/${opt.icon_code}.png`}
                  alt={opt.option_text}
                  width={24}
                  height={16}
                  className='shrink-0 rounded object-cover'
                  unoptimized
                />
                <span>{opt.option_text}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
