import { MarketsList } from '@/components/markets-list'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Live Markets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Prices update every 3 seconds. Sign in to place paper trades.
        </p>
      </div>
      <MarketsList />
    </div>
  )
}
