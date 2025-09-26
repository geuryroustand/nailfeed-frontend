import { type NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_API_URL

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    const token = session?.strapiJWT

    if (!session || !token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams()

    // Copy search params
    searchParams.forEach((value, key) => {
      params.append(key, value)
    })

    // Default params for collections
    if (!params.has('populate[0]')) {
      params.set('populate[0]', 'coverImage')
      params.set('populate[1]', 'owner')
      params.set('populate[2]', 'posts')
      params.set('populate[3]', 'shares')
    }

    if (!params.has('sort')) {
      params.set('sort', 'updatedAt:desc')
    }

    const response = await fetch(`${STRAPI_BASE_URL}/api/collections?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Strapi collections error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Collections proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    const token = session?.strapiJWT

    if (!session || !token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${STRAPI_BASE_URL}/api/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('Strapi create collection error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to create collection' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Create collection proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}