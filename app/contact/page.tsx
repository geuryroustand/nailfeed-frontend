"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

// Hoist schema outside component to avoid recreation (js-hoist-regexp pattern)
const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be less than 200 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;
type FieldErrors = Partial<Record<keyof ContactFormData, string>>;

// Hoist static JSX outside component (rendering-hoist-jsx)
const SuccessIcon = <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />;
const HeaderIcon = (
  <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
    <Mail className="h-8 w-8 text-pink-500" />
  </div>
);
const SendIcon = <Send className="mr-2 h-4 w-4" />;
const LoadingIcon = <Loader2 className="mr-2 h-4 w-4 animate-spin" />;


export default function ContactPage() {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Use useCallback with functional setState for stable reference (rerender-functional-setstate)
  const clearFieldError = useCallback((field: keyof ContactFormData) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Memoize onChange handlers to prevent recreation on each render (rerender-memo-with-default-value)
  const fieldHandlers = useMemo(
    () => ({
      name: () => clearFieldError("name"),
      email: () => clearFieldError("email"),
      subject: () => clearFieldError("subject"),
      message: () => clearFieldError("message"),
    }),
    [clearFieldError]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);
      const rawData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        subject: formData.get("subject") as string,
        message: formData.get("message") as string,
      };

      // Validate with Zod
      const result = contactSchema.safeParse(rawData);

      // Early exit on validation error (js-early-exit)
      if (!result.success) {
        const errors: FieldErrors = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof ContactFormData;
          if (!errors[field]) {
            errors[field] = issue.message;
          }
        }
        setFieldErrors(errors);
        return;
      }

      // Clear previous errors
      setFieldErrors({});
      setError(null);

      // Use startTransition for non-urgent update (rerender-transitions)
      startTransition(async () => {
        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result.data),
          });

          if (!response.ok) {
            throw new Error("Failed to send message");
          }

          setIsSubmitted(true);
        } catch {
          setError(
            "Failed to send message. Please try again or email us directly.",
          );
        }
      });
    },
    [],
  );

  // Early return for success state (js-early-exit)
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
          {SuccessIcon}
          <h1 className="text-2xl font-bold mb-2">Message Sent!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We'll get back to you as soon as
            possible.
          </p>
          <Link href="/">
            <Button className="bg-pink-500 hover:bg-pink-600">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="text-center mb-8">
            {HeaderIcon}
            <h1 className="text-2xl sm:text-3xl font-bold">Contact Us</h1>
            <p className="text-gray-600 mt-2">
              Have a question or feedback? We'd love to hear from you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  aria-invalid={fieldErrors.name ? "true" : "false"}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                  className={fieldErrors.name ? "border-red-500" : ""}
                  onChange={fieldHandlers.name}
                />
                {fieldErrors.name ? (
                  <p id="name-error" className="text-sm text-red-600">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  aria-invalid={fieldErrors.email ? "true" : "false"}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={fieldErrors.email ? "border-red-500" : ""}
                  onChange={fieldHandlers.email}
                />
                {fieldErrors.email ? (
                  <p id="email-error" className="text-sm text-red-600">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="How can we help?"
                aria-invalid={fieldErrors.subject ? "true" : "false"}
                aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
                className={fieldErrors.subject ? "border-red-500" : ""}
                onChange={fieldHandlers.subject}
              />
              {fieldErrors.subject ? (
                <p id="subject-error" className="text-sm text-red-600">
                  {fieldErrors.subject}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us more..."
                rows={5}
                aria-invalid={fieldErrors.message ? "true" : "false"}
                aria-describedby={fieldErrors.message ? "message-error" : undefined}
                className={fieldErrors.message ? "border-red-500" : ""}
                onChange={fieldHandlers.message}
              />
              {fieldErrors.message ? (
                <p id="message-error" className="text-sm text-red-600">
                  {fieldErrors.message}
                </p>
              ) : null}
            </div>

            {/* Use ternary instead of && (rendering-conditional-render) */}
            {error ? (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  {LoadingIcon}
                  Sending...
                </>
              ) : (
                <>
                  {SendIcon}
                  Send Message
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            <p>
              You can also reach us directly at{" "}
              <a
                href="mailto:hello@nailfeed.com"
                className="text-pink-500 hover:underline"
              >
                hello@nailfeed.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
