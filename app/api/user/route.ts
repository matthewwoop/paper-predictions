import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users, orders } from '@/db/schema'
import { eq } from 'drizzle-orm'

type Position = {
  marketTicker: string
  marketTitle: string
  side: 'yes' | 'no'
  totalQuantity: number
  avgFillPrice: number
  currentPrice: number | null
  unrealizedPnl: number | null
  totalCost: number
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let [user] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)
  if (!user) {
    await db.insert(users).values({ clerkUserId: userId, balance: '1000.00' })
    ;[user] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)
  }

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))

  if (userOrders.length === 0) {
    return NextResponse.json({ balance: user.balance, positions: [] })
  }

  // Aggregate orders into positions in memory
  const posMap = new Map<string, {
    marketTicker: string
    marketTitle: string
    side: 'yes' | 'no'
    totalQuantity: number
    weightedFillSum: number
    totalCost: number
  }>()

  for (const order of userOrders) {
    const key = `${order.marketTicker}:${order.side}`
    const existing = posMap.get(key)
    if (!existing) {
      posMap.set(key, {
        marketTicker: order.marketTicker,
        marketTitle: order.marketTitle,
        side: order.side as 'yes' | 'no',
        totalQuantity: order.quantity,
        weightedFillSum: parseFloat(order.fillPrice) * order.quantity,
        totalCost: parseFloat(order.totalCost),
      })
    } else {
      existing.totalQuantity += order.quantity
      existing.weightedFillSum += parseFloat(order.fillPrice) * order.quantity
      existing.totalCost += parseFloat(order.totalCost)
    }
  }

  // Fetch current prices for all unique tickers in parallel
  const uniqueTickers = [...new Set([...posMap.values()].map(p => p.marketTicker))]

  const priceResults = await Promise.all(
    uniqueTickers.map(async (ticker) => {
      try {
        const res = await fetch(
          `https://external-api.kalshi.com/trade-api/v2/markets/${ticker}`,
          { headers: { accept: 'application/json' } }
        )
        if (!res.ok) return { ticker, market: null }
        const data = await res.json()
        return { ticker, market: data.market }
      } catch {
        return { ticker, market: null }
      }
    })
  )

  const priceMap = new Map<string, { yes: number | null; no: number | null }>()
  for (const { ticker, market } of priceResults) {
    if (!market) {
      priceMap.set(ticker, { yes: null, no: null })
    } else {
      priceMap.set(ticker, {
        yes: market.yes_ask_dollars != null ? parseFloat(market.yes_ask_dollars) : null,
        no: market.no_ask_dollars != null ? parseFloat(market.no_ask_dollars) : null,
      })
    }
  }

  // Build final positions array
  const positions: Position[] = []
  for (const pos of posMap.values()) {
    const avgFillPrice = pos.weightedFillSum / pos.totalQuantity
    const prices = priceMap.get(pos.marketTicker)
    const currentPrice = prices ? (pos.side === 'yes' ? prices.yes : prices.no) : null
    const unrealizedPnl =
      currentPrice !== null ? (currentPrice - avgFillPrice) * pos.totalQuantity : null

    positions.push({
      marketTicker: pos.marketTicker,
      marketTitle: pos.marketTitle,
      side: pos.side,
      totalQuantity: pos.totalQuantity,
      avgFillPrice,
      currentPrice,
      unrealizedPnl,
      totalCost: pos.totalCost,
    })
  }

  return NextResponse.json({ balance: user.balance, positions })
}
