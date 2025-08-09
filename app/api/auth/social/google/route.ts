import { NextResponse } from "next/server"

/**
 * Proxies Google id_token to Strapi's Google auth callback if the Strapi backend supports it.
 * Query: ?id_token=...
 * Returns the Strapi JSON response as-is, or a 400 if exchange fails.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const idToken = searchParams.get("id_token")

  if (!idToken) {
    return NextResponse.json({ error: "missing_id_token" }, { status: 400 })
  }

  const strapiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!strapiUrl) {
    return NextResponse.json({ error: "missing_strapi_url" }, { status: 500 })
  }

  try {
    console.log("Proxying id_token to Strapi...")

    const res = await fetch(`${strapiUrl}/api/auth/google/callback?id_token=${encodeURIComponent(idToken)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const text = await res.text()
    let data: unknown

    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    if (!res.ok) {
      console.error("Strapi exchange failed:", res.status, data)
      return NextResponse.json(
        {
          ok: false,
          error: "strapi_exchange_failed",
          status: res.status,
          data,
        },
        { status: 400 },
      )
    }

    console.log("Strapi exchange successful")
    return NextResponse.json(data as any, { status: 200 })
  } catch (e) {
    console.error("Proxy failed:", e)
    return NextResponse.json({ ok: false, error: "proxy_failed" }, { status: 500 })
  }
}
