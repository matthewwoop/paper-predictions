'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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

function formatCents(price: number): string {
  return `${(price * 100).toFixed(0)}¢`
}

function formatDollar(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatPnl(pnl: number): string {
  const abs = formatDollar(Math.abs(pnl))
  return pnl >= 0 ? `+${abs}` : `-${abs}`
}

export function PositionsTable() {
  const [positions, setPositions] = useState<Position[] | null>(null)

  useEffect(() => {
    async function fetchPositions() {
      try {
        const res = await fetch('/api/user')
        if (res.ok) {
          const data = await res.json()
          setPositions(data.positions ?? [])
        }
      } catch {
        // silently ignore on poll failure
      }
    }

    fetchPositions()
    const interval = setInterval(fetchPositions, 10_000)
    return () => clearInterval(interval)
  }, [])

  if (positions === null) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No positions yet. Place a trade to get started.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead>Side</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Avg Fill</TableHead>
            <TableHead className="text-right">Current</TableHead>
            <TableHead className="text-right">P&amp;L</TableHead>
            <TableHead className="text-right">Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((pos) => (
            <TableRow key={`${pos.marketTicker}:${pos.side}`}>
              <TableCell className="max-w-[240px] truncate font-medium" title={pos.marketTitle}>
                {pos.marketTitle}
              </TableCell>
              <TableCell>
                {pos.side === 'yes' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">YES</Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">NO</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">{pos.totalQuantity}</TableCell>
              <TableCell className="text-right">{formatCents(pos.avgFillPrice)}</TableCell>
              <TableCell className="text-right">
                {pos.currentPrice !== null ? formatCents(pos.currentPrice) : '—'}
              </TableCell>
              <TableCell className="text-right">
                {pos.unrealizedPnl !== null ? (
                  <span className={pos.unrealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {formatPnl(pos.unrealizedPnl)}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-right">{formatDollar(pos.totalCost)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
