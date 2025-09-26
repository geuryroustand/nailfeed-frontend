"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

type FieldErrors = Record<string, string>

type AuthState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: FieldErrors
}

const initialState: AuthState = { status: "idle" }

export default function LoginForm() {
  const router = useRouter()
  const { login, checkAuthStatus } = useAuth()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [state, setState] = useState<AuthState>(initialState)
  const [isPending, setIsPending] = useState(false)

  const validateInputs = (): FieldErrors => {
    const errors: FieldErrors = {}

    if (!identifier.trim()) {
      errors.identifier = "Email or username is required"
    }

    if (!password.trim()) {
      errors.password = "Password is required"
    }

    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors = validateInputs()
    if (Object.keys(errors).length > 0) {
      setState({
        status: "error",
        message: "Please fix the errors and try again.",
        fieldErrors: errors,
      })
      return
    }

    setIsPending(true)
    setState(initialState)

    const result = await login({ identifier, password, rememberMe })

    if (!result.success) {
      setState({
        status: "error",
        message: result.error || "Invalid credentials",
      })
      setIsPending(false)
      return
    }

    setState({ status: "success", message: "Login successful" })

    await checkAuthStatus()
    router.replace("/")
    router.refresh()

    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="login-form-status">
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
