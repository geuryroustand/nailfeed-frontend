"use client"

import { useEffect, useMemo, useState } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { registerWithFormAction, type AuthActionState } from "@/app/auth/actions"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/context/auth-context"

const initialState: AuthActionState = { status: "idle" }

export default function RegistrationForm() {
  const router = useRouter()
  const { checkAuthStatus } = useAuth() // Added auth context hook
  const [state, action, isPending] = useActionState(registerWithFormAction, initialState)

  // Controlled inputs to preserve values on error
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agree, setAgree] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Hydrate inputs from server-returned values on error (we never echo passwords back)
  useEffect(() => {
    if (state.status === "error" && state.values) {
      if (state.values.username) setUsername(state.values.username)
      if (state.values.email) setEmail(state.values.email)
    }
  }, [state])

  useEffect(() => {
    if (state.status === "success") {
      setTimeout(async () => {
        console.log("[v0] Registration successful, refreshing auth state...")
        await checkAuthStatus()
        router.replace("/")
        router.refresh()
      }, 500)
    }
  }, [state.status, router, checkAuthStatus])

  const passwordStrength = useMemo(() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 8) s += 25
    if (/[A-Z]/.test(password)) s += 25
    if (/[a-z]/.test(password)) s += 25
    if (/[0-9]/.test(password)) s += 25
    return s
  }, [password])

  return (
    <form action={action} className="space-y-4" aria-describedby="signup-form-status">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <Input
          id="username"
          name="username"
          placeholder="your_username"
          autoComplete="username"
          required
          minLength={3}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.username)}
          aria-errormessage={state.fieldErrors?.username ? "username-error" : undefined}
        />
        {state.fieldErrors?.username && (
          <p id="username-error" className="mt-1 text-sm text-red-600">
            {state.fieldErrors.username}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-errormessage={state.fieldErrors?.email ? "email-error" : undefined}
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-errormessage={state.fieldErrors?.password ? "password-error" : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {password && (
          <div className="mt-2 space-y-1">
            <Progress value={passwordStrength} />
            <p className="text-xs text-gray-500">
              {passwordStrength < 50 ? "Weak" : passwordStrength < 100 ? "Medium" : "Strong"}
            </p>
          </div>
        )}

        {state.fieldErrors?.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            aria-errormessage={state.fieldErrors?.confirmPassword ? "confirm-error" : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 text-gray-500 hover:text-gray-700"
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            aria-pressed={showConfirm}
            onClick={() => setShowConfirm((s) => !s)}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {state.fieldErrors?.confirmPassword && (
          <p id="confirm-error" className="mt-1 text-sm text-red-600">
            {state.fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Terms agreement: ensure a proper value gets submitted */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="agreeTerms"
          checked={agree}
          onCheckedChange={(v) => setAgree(Boolean(v))}
          aria-label="I agree to the Terms and Privacy Policy"
        />
        {/* Hidden input to carry the boolean to FormData reliably */}
        <input type="hidden" name="agreeTerms" value={agree ? "on" : ""} />
        <label htmlFor="agreeTerms" className="text-sm text-gray-700 cursor-pointer leading-6">
          I agree to the{" "}
          <a href="/policies/terms-of-service" className="text-pink-500 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/policies/privacy-policy" className="text-pink-500 hover:underline">
            Privacy Policy
          </a>
          .
        </label>
      </div>
      {state.fieldErrors?.agreeTerms && <p className="mt-1 text-sm text-red-600">{state.fieldErrors.agreeTerms}</p>}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <div id="signup-form-status" className="min-h-[1.25rem]" aria-live="polite" aria-atomic="true">
        {state.status === "error" && (
          <p className="text-sm text-red-600">{state.message || "Something went wrong. Try again."}</p>
        )}
        {state.status === "success" && <p className="text-sm text-green-600">Success! Redirecting…</p>}
      </div>
    </form>
  )
}
