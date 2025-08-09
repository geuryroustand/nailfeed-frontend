"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { loginWithFormAction, type AuthActionState } from "@/app/auth/actions"
import { Eye, EyeOff, Loader2 } from "lucide-react"

const initialState: AuthActionState = { status: "idle" }

export default function LoginForm() {
  const router = useRouter()
  const [state, action, isPending] = useActionState(loginWithFormAction, initialState)

  // Controlled inputs to preserve values on error
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Hydrate inputs from server-returned values on error
  useEffect(() => {
    if (state.status === "error" && state.values) {
      if (state.values.identifier) setIdentifier(state.values.identifier)
      if (state.values.rememberMe) setRememberMe(true)
    }
  }, [state])

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/")
    }
  }, [state.status, router])

  return (
    <form action={action} className="space-y-4" aria-describedby="login-form-status">
      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
          Email or Username
        </label>
        <Input
          id="identifier"
          name="identifier"
          placeholder="you@example.com or your_username"
          autoComplete="username"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.identifier)}
          aria-errormessage={state.fieldErrors?.identifier ? "identifier-error" : undefined}
        />
        {state.fieldErrors?.identifier && (
          <p id="identifier-error" className="mt-1 text-sm text-red-600">
            {state.fieldErrors.identifier}
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
            autoComplete="current-password"
            required
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
        {state.fieldErrors?.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={(v) => setRememberMe(Boolean(v))}
          aria-label="Remember me"
        />
        <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
          Remember me
        </label>
        {/* Hidden field to actually submit the boolean reliably */}
        <input type="hidden" name="rememberMe" value={rememberMe ? "on" : ""} />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div id="login-form-status" className="min-h-[1.25rem]" aria-live="polite" aria-atomic="true">
        {state.status === "error" && (
          <p className="text-sm text-red-600">{state.message || "Something went wrong. Try again."}</p>
        )}
        {state.status === "success" && <p className="text-sm text-green-600">Success! Redirecting…</p>}
      </div>
    </form>
  )
}
