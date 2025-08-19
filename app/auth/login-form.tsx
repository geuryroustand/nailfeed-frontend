"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

// Login schema with proper validation
const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "Email or username is required" })
    .refine(
      (value) => {
        // Check if it's an email or username
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
        return emailRegex.test(value) || usernameRegex.test(value)
      },
      { message: "Please enter a valid email or username" },
    ),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { setUserData, checkAuthStatus } = useAuth()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true)

    try {
      console.log("[v0] Starting login process...")

      // Validate data before submission
      const validatedData = loginSchema.parse(data)

      // Make API call to login
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/local`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: validatedData.identifier,
          password: validatedData.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || "Login failed")
      }

      console.log("[v0] Login successful, storing token and updating context...")

      if (result.jwt) {
        // Store in localStorage for client-side access
        localStorage.setItem("authToken", result.jwt)
        localStorage.setItem("jwt", result.jwt)

        // Store in cookies via server API for server-side access
        try {
          await fetch("/api/auth/set-cookie", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: result.jwt }),
          })
          console.log("[v0] JWT token stored in cookies via server API")
        } catch (cookieError) {
          console.error("[v0] Failed to set cookie via server API:", cookieError)
        }

        // Also set cookies directly on client side as fallback
        const maxAge = 60 * 60 * 24 * 7 // 7 days
        document.cookie = `authToken=${result.jwt}; path=/; max-age=${maxAge}; SameSite=Lax;`
        document.cookie = `jwt=${result.jwt}; path=/; max-age=${maxAge}; SameSite=Lax;`
        console.log("[v0] JWT token stored in client-side cookies")
      }

      if (result.user) {
        setUserData(result.user, result.jwt)
        console.log("[v0] Updated auth context with user data")
      }

      await checkAuthStatus()
      console.log("[v0] Completed auth status check")

      // Handle successful login
      toast({
        title: "Login successful!",
        description: "Welcome back to your account.",
      })

      // Redirect to dashboard or home
      router.push("/")
      router.refresh() // Force page refresh to update server-side state
    } catch (error) {
      console.error("[v0] Login error:", error)

      if (error instanceof z.ZodError) {
        // Handle validation errors
        error.errors.forEach((err) => {
          const fieldName = err.path[0] as keyof LoginFormValues
          form.setError(fieldName, {
            type: "manual",
            message: err.message,
          })
        })
      } else {
        toast({
          title: "Login failed",
          description: error instanceof Error ? error.message : "Invalid credentials",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email or Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your email or username"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    form.trigger("identifier")
                  }}
                />
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
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      form.trigger("password")
                    }}
                  />
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

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="text-sm font-normal cursor-pointer">Remember me</FormLabel>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  )
}
