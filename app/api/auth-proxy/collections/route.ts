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

    // Force collections to be scoped to the authenticated owner
    params.delete('filters[owner][id][$eq]')
    params.delete('filters[owner][email][$eq]')
    params.delete('filters[owner][username][$eq]')

    const ownerId = Number(session.userId)
    if (Number.isFinite(ownerId)) {
      params.set('filters[owner][id][$eq]', ownerId.toString())
    } else if (session.email) {
      params.set('filters[owner][email][$eq]', session.email)
    } else if (session.username) {
      params.set('filters[owner][username][$eq]', session.username)
    }

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

    const bodyData = (body && typeof body === 'object' && !Array.isArray(body))
      ? (body.data && typeof body.data === 'object' ? body.data : body)
      : {}

    const { owner: _ignoredOwner, ...restData } = bodyData as Record<string, unknown>

    const ownerId = Number(session.userId)
    if (!Number.isFinite(ownerId)) {
      return NextResponse.json({ error: 'Unable to resolve authenticated owner' }, { status: 400 })
    }

    const ownerRelation = { owner: { connect: [ownerId] } }

    const payload = {
      data: {
        ...restData,
        ...ownerRelation,
      },
    }

    const response = await fetch(`${STRAPI_BASE_URL}/api/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
