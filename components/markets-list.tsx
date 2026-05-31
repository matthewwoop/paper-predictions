"use client"

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { MarketCard, type KalshiMarket } from './market-card'

export function MarketsList() {
  const [markets, setMarkets] = useState<KalshiMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchMarkets() {
    try {
      const res = await fetch('/api/markets')
      if (!res.ok) throw new Error('Failed to fetch markets')
      const data = await res.json()
      setMarkets(data.markets ?? [])
      setError(null)
    } catch {
      setError('Unable to load markets. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarkets()
    const id = setInterval(fetchMarkets, 3000)
    return () => clearInterval(id)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">No open markets found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {markets.map((market) => (
        <MarketCard
          key={market.ticker}
          market={market}
          onOrder={() => {}}
        />
      ))}
    </div>
  )
}
