"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type KalshiMarket } from './market-card'

interface OrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  market: KalshiMarket | null
  side: 'yes' | 'no' | null
}

function formatCents(price: string | null | undefined): string {
  if (!price || parseFloat(price) === 0) return 'N/A'
  return `${(parseFloat(price) * 100).toFixed(0)}¢`
}

export function OrderDialog({ open, onOpenChange, market, side }: OrderDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!market || !side) return null

  const askPrice = side === 'yes' ? market.yes_ask_dollars : market.no_ask_dollars
  const askPriceNum = parseFloat(askPrice)
  const totalCost = isNaN(askPriceNum) ? 0 : parseFloat((askPriceNum * quantity).toFixed(2))

  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 1) setQuantity(val)
  }

  function handleOpenChange(next: boolean) {
    if (!submitting) {
      if (!next) {
        setQuantity(1)
        setError(null)
      }
      onOpenChange(next)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: market!.ticker, side, quantity }),
      })
      const data = await res.json()
      if (res.ok) {
        setQuantity(1)
        onOpenChange(false)
      } else if (data?.error === 'Insufficient balance') {
        setError('Insufficient balance to place this order.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isYes = side === 'yes'
  const sideLabel = isYes ? 'Buy YES' : 'Buy NO'
  const badgeClass = isYes
    ? 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={badgeClass}>{side.toUpperCase()}</span>
            {sideLabel}
          </DialogTitle>
          <DialogDescription className="text-sm leading-snug">
            {market.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ask Price</span>
            <span className="font-semibold">{formatCents(askPrice)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="quantity" className="text-sm text-muted-foreground">
              Quantity (contracts)
            </label>
            <Input
              id="quantity"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={handleQuantityChange}
              disabled={submitting}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total cost</span>
            <span className="font-semibold">${totalCost.toFixed(2)}</span>
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className={
              isYes
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }
          >
            {submitting ? 'Placing…' : 'Place Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
