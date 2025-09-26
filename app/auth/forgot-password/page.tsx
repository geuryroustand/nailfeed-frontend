"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { forgotPasswordAction } from "@/app/actions/auth-actions"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  // ✅ SECURITY: Use server action for password reset
  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    try {
      const result = await forgotPasswordAction(data.email)

      if (result.success) {
        setIsSubmitted(true)
        toast({
          title: "Reset link sent",
          description: "Please check your email for password reset instructions",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send reset link",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 border-b bg-white">
        <div className="container max-w-5xl mx-auto">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold mr-2">
              N
            </div>
            <h1 className="text-xl font-bold">NailFeed</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <Link href="/auth" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
              </Link>

              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Forgot Password</h1>
                <p className="text-gray-500 mt-2">
                  {isSubmitted
                    ? "Check your email for a reset link"
                    : "Enter your email and we'll send you a reset link"}
                </p>
              </div>

              {!isSubmitted ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="text-center">
                  <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
                    We've sent a password reset link to your email address. Please check your inbox.
                  </div>
                  <Button onClick={() => router.push("/auth")} variant="outline" className="w-full">
                    Return to Login
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4 border-t bg-white text-center text-sm text-gray-500">
        <div className="container max-w-5xl mx-auto">
          <p>© 2023 NailFeed. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
