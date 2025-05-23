"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { loginAction } from "./actions"
import { useAuth } from "@/hooks/use-auth"
import { AuthService } from "@/lib/auth-service"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

// Initial state for the form
const initialState = {
  success: false,
  error: null,
  user: null,
  jwt: null,
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
      disabled={pending}
    >
      {pending ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [state, formAction] = useActionState(loginAction, initialState)
  const { setUserData, refreshUser } = useAuth()
  const hasRedirected = useRef(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  // Handle successful login after form submission
  useEffect(() => {
    if (state.success && state.user && !hasRedirected.current) {
      console.log("Login successful, user data:", state.user)

      // Set flag to prevent multiple redirects
      hasRedirected.current = true

      // Update auth context with user data
      setUserData(state.user)

      // Store JWT in both localStorage and cookies
      if (state.jwt) {
        // Store in localStorage for client-side access
        localStorage.setItem("auth_token", state.jwt)

        // Store in cookies using AuthService
        AuthService.storeTokenInCookie(state.jwt)

        // Also store using fetch to ensure server-side cookie is set
        fetch("/api/auth/set-cookie", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: state.jwt }),
        }).catch((err) => console.error("Failed to set cookie:", err))
      }

      toast({
        title: "Login successful!",
        description: "Welcome back to NailFeed",
      })

      // Force a refresh of the user data
      refreshUser().then(() => {
        // Redirect to home page with a slight delay
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 500)
      })
    }
  }, [state.success, state.user, state.jwt, router, toast, setUserData, refreshUser])

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input name="email" placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox name="rememberMe" checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="text-sm font-normal cursor-pointer">Remember me</FormLabel>
              </FormItem>
            )}
          />

          <Link href="/auth/forgot-password" className="text-sm text-pink-500 p-0 h-auto font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        {state.error && (
          <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
            <p>{state.error}</p>
          </div>
        )}

        <SubmitButton />
      </form>
    </Form>
  )
}
