"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { useT } from "@/i18n/use-t"
import { isNewUserError, signIn, signUp, verifyOtp } from "@/services/auth"
import { saveSession } from "@/lib/session"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type View = "auth" | "signup" | "verify"

export default function LoginPage() {
  const router = useRouter()
  const t = useT()
  const [view, setView] = useState<View>("auth")
  const [pendingEmail, setPendingEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSendCode(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const email = new FormData(e.currentTarget).get("email") as string
    setIsLoading(true)
    try {
      await signIn(email)
      setPendingEmail(email)
      setView("verify")
    } catch (err) {
      if (isNewUserError(err)) {
        setPendingEmail(email)
        setView("signup")
      } else {
        setError(t.auth.signInError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignUp(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const name = new FormData(e.currentTarget).get("name") as string
    setIsLoading(true)
    try {
      await signUp(pendingEmail, name)
      await signIn(pendingEmail)
      setView("verify")
    } catch {
      setError(t.auth.createAccountError)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerify() {
    setError("")
    setIsLoading(true)
    try {
      const result = await verifyOtp(pendingEmail, otp)
      saveSession(result)
      router.push("/dashboard")
    } catch {
      setError(t.auth.verifyError)
    } finally {
      setIsLoading(false)
    }
  }

  function handleBack() {
    setView("auth")
    setOtp("")
    setError("")
  }

  return (
    <div className='mx-auto w-full max-w-sm'>
      <div className='absolute top-4 right-4'>
        <LanguageSwitcher />
      </div>

      <div className='mb-8 text-center'>
        <h1 className='text-2xl font-bold tracking-tight text-white'>
          {t.nav.appTitle}
        </h1>
        <p className='mt-1 text-sm' style={{ color: "var(--brand-muted)" }}>
          {t.auth.subtitle}
        </p>
      </div>

      {view === "auth" && (
        <Card className='border-0 bg-white/95 shadow-2xl shadow-black/40 backdrop-blur-sm'>
          <CardHeader>
            <CardTitle className='text-lg'>{t.auth.signIn}</CardTitle>
            <CardDescription>{t.auth.otpHint}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form onSubmit={handleSendCode} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>{t.auth.email}</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder={t.auth.emailPlaceholder}
                  required
                  autoComplete='email'
                  autoFocus
                />
              </div>
              {error && <p className='text-sm text-destructive'>{error}</p>}
              <Button
                type='submit'
                className='w-full py-5'
                style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
                disabled={isLoading}
              >
                {isLoading ? t.auth.sendingCode : t.auth.sendCode}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {view === "signup" && (
        <Card className='border-0 bg-white/95 shadow-2xl shadow-black/40 backdrop-blur-sm'>
          <CardHeader>
            <button
              onClick={handleBack}
              className='mb-2 -ml-1 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
            >
              <ArrowLeft className='h-4 w-4' />
              {t.auth.back}
            </button>
            <CardTitle className='text-lg'>{t.auth.newUserTitle}</CardTitle>
            <CardDescription>
              {t.auth.newUserDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form onSubmit={handleSignUp} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>{t.auth.name}</Label>
                <Input
                  id='name'
                  name='name'
                  type='text'
                  placeholder={t.auth.namePlaceholder}
                  required
                  autoComplete='name'
                  autoFocus
                />
              </div>
              <p className='text-xs text-muted-foreground'>
                {t.auth.email}: <span className='font-medium text-foreground'>{pendingEmail}</span>
              </p>
              {error && <p className='text-sm text-destructive'>{error}</p>}
              <Button
                type='submit'
                className='w-full py-5'
                style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
                disabled={isLoading}
              >
                {isLoading ? t.auth.creatingAccount : t.auth.createAccount}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {view === "verify" && (
        <Card className='border-0 bg-white/95 shadow-2xl shadow-black/40 backdrop-blur-sm'>
          <CardHeader>
            <button
              onClick={handleBack}
              className='mb-2 -ml-1 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
            >
              <ArrowLeft className='h-4 w-4' />
              {t.auth.back}
            </button>
            <CardTitle className='text-lg'>{t.auth.checkEmail}</CardTitle>
            <CardDescription>
              {t.auth.codeSentTo}{" "}
              <span className='font-medium text-foreground'>{pendingEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <form
              onSubmit={(e) => { e.preventDefault(); handleVerify() }}
              className='space-y-6'
            >
              <div className='flex justify-center'>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerify}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className='h-12 w-10 text-base' />
                    <InputOTPSlot index={1} className='h-12 w-10 text-base' />
                    <InputOTPSlot index={2} className='h-12 w-10 text-base' />
                    <InputOTPSlot index={3} className='h-12 w-10 text-base' />
                    <InputOTPSlot index={4} className='h-12 w-10 text-base' />
                    <InputOTPSlot index={5} className='h-12 w-10 text-base' />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && (
                <p className='text-center text-sm text-destructive'>{error}</p>
              )}
              <Button
                type='submit'
                className='w-full'
                style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
                disabled={otp.length < 6 || isLoading}
              >
                {isLoading ? t.auth.verifying : t.auth.verify}
              </Button>
            </form>
            <p className='text-center text-xs text-muted-foreground'>
              {t.auth.didntReceive}{" "}
              <button
                type='button'
                onClick={handleBack}
                className='underline underline-offset-2 transition-colors hover:text-foreground'
              >
                {t.auth.resend}
              </button>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
