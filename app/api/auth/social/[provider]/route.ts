import { type NextRequest, NextResponse } from "next/server"
import { initiateSocialAuthAction } from "@/app/auth/actions"

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider

  if (!["google", "facebook", "instagram"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  try {
    const result = await initiateSocialAuthAction(provider)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error initiating ${provider} auth:`, error)
    return NextResponse.json({ error: "Failed to initiate social authentication" }, { status: 500 })
  }
}
