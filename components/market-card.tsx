"use client"

import { useAuth, SignInButton } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export type KalshiMarket = {
  ticker: string
  title: string
  subtitle: string
  event_ticker: string
  status: string
  yes_bid_dollars: string
  yes_ask_dollars: string
  no_bid_dollars: string
  no_ask_dollars: string
  last_price_dollars: string
  volume_24h_fp: string
  close_time: string
  expiration_time: string
}

function formatCents(price: string | null | undefined): string {
  if (!price || parseFloat(price) === 0) return 'N/A'
  return `${(parseFloat(price) * 100).toFixed(0)}¢`
}

function formatVolume(volume: string | null | undefined): string {
  if (!volume) return 'N/A'
  const num = parseFloat(volume)
  if (isNaN(num)) return 'N/A'
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`
  return `$${num.toFixed(0)}`
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'N/A'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface MarketCardProps {
  market: KalshiMarket
  onOrder: (ticker: string, side: 'yes' | 'no') => void
}

export function MarketCard({ market, onOrder }: MarketCardProps) {
  const { isSignedIn } = useAuth()

  const yesPrice = formatCents(market.yes_ask_dollars)
  const noPrice = formatCents(market.no_ask_dollars)
  const yesAvailable = !!market.yes_ask_dollars && parseFloat(market.yes_ask_dollars) > 0
  const noAvailable = !!market.no_ask_dollars && parseFloat(market.no_ask_dollars) > 0

  return (
    <Card className="flex flex-col justify-between gap-4 p-4">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium leading-snug text-foreground line-clamp-3">
          {market.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">
              YES
            </Badge>
            <span className="text-sm font-semibold">{yesPrice}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 text-xs">
              NO
            </Badge>
            <span className="text-sm font-semibold">{noPrice}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>Vol 24h: {formatVolume(market.volume_24h_fp)}</span>
          <span>Expires: {formatDate(market.expiration_time)}</span>
        </div>

        <div className="flex gap-2">
          {isSignedIn ? (
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={() => onOrder(market.ticker, 'yes')}
              disabled={!yesAvailable}
            >
              Buy YES
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                disabled={!yesAvailable}
              >
                Buy YES
              </Button>
            </SignInButton>
          )}

          {isSignedIn ? (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50 text-xs"
              onClick={() => onOrder(market.ticker, 'no')}
              disabled={!noAvailable}
            >
              Buy NO
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50 text-xs"
                disabled={!noAvailable}
              >
                Buy NO
              </Button>
            </SignInButton>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
