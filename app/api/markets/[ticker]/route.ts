import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: { ticker: string } }
) {
  const { ticker } = params
  const res = await fetch(
    `https://external-api.kalshi.com/trade-api/v2/markets/${ticker}`,
    { headers: { accept: 'application/json' } }
  )
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch market' }, { status: 500 })
  const data = await res.json()
  return NextResponse.json(data)
}
