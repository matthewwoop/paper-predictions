import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, orders } from '@/db/schema'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { ticker, side, quantity } = body

    if (
      !ticker ||
      !side ||
      (side !== 'yes' && side !== 'no') ||
      quantity === undefined ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Fetch live price from Kalshi
    const kalshiRes = await fetch(
      `https://external-api.kalshi.com/trade-api/v2/markets/${ticker}`,
      { headers: { accept: 'application/json' } }
    )
    if (!kalshiRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch market price' }, { status: 502 })
    }
    const kalshiData = await kalshiRes.json()
    const market = kalshiData.market

    const fillPrice =
      side === 'yes'
        ? parseFloat(market.yes_ask_dollars)
        : parseFloat(market.no_ask_dollars)

    if (isNaN(fillPrice) || fillPrice <= 0) {
      return NextResponse.json({ error: 'Market price unavailable' }, { status: 400 })
    }

    const totalCost = parseFloat((fillPrice * quantity).toFixed(2))

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (parseFloat(user.balance) < totalCost) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ balance: (parseFloat(user.balance) - totalCost).toFixed(2) })
        .where(eq(users.id, user.id))

      await tx.insert(orders).values({
        userId: user.id,
        marketTicker: market.ticker,
        marketTitle: market.title,
        side,
        quantity,
        fillPrice: fillPrice.toFixed(4),
        totalCost: totalCost.toFixed(2),
      })
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
