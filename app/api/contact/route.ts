import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.issues },
        { status: 400 }
      );
    }

    const apiUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:1337"
        : process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.nailfeed.com";

    const apiToken = process.env.API_TOKEN;

    if (!apiToken) {
      console.error("API_TOKEN is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiUrl}/api/conctacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ data: result.data }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Strapi error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
