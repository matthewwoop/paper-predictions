'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BalanceDisplayProps {
  initialBalance: string
}

export function BalanceDisplay({ initialBalance }: BalanceDisplayProps) {
  const [balance, setBalance] = useState(initialBalance)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/user')
        if (res.ok) {
          const data = await res.json()
          setBalance(data.balance)
        }
      } catch {
        // silently ignore network errors between polls
      }
    }, 10_000)

    return () => clearInterval(interval)
  }, [])

  const formatted = parseFloat(balance).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <Card className="w-64">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Paper Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatted}</p>
      </CardContent>
    </Card>
  )
}
