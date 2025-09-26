import { type NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_API_URL

interface RouteParams {
  id: string
}

type RouteContext = { params: Promise<RouteParams> } | { params: RouteParams }

function resolveParams(context: RouteContext): Promise<RouteParams> {
  return Promise.resolve(context.params as RouteParams | Promise<RouteParams>)
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await verifySession()
    const token = session?.strapiJWT

    if (!session || !token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await resolveParams(context)

    const { searchParams } = new URL(request.url)
    const queryParams = new URLSearchParams()

    // Copy search params
    searchParams.forEach((value, key) => {
      queryParams.append(key, value)
    })

    // Default params for collections
    if (!queryParams.has('populate[0]')) {
      queryParams.set('populate[0]', 'coverImage')
      queryParams.set('populate[1]', 'owner')
      queryParams.set('populate[2]', 'posts')
      queryParams.set('populate[3]', 'shares')
    }

    const response = await fetch(`${STRAPI_BASE_URL}/api/collections/${id}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Strapi collection error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to fetch collection' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Collection proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await verifySession()
    const token = session?.strapiJWT

    if (!session || !token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await resolveParams(context)
    const body = await request.json()

    const response = await fetch(`${STRAPI_BASE_URL}/api/collections/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('Strapi update collection error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to update collection' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Update collection proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await verifySession()
    const token = session?.strapiJWT

    if (!session || !token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await resolveParams(context)

    const response = await fetch(`${STRAPI_BASE_URL}/api/collections/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Strapi delete collection error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to delete collection' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete collection proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}