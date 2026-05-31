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

type Order = {
  id: string
  marketTicker: string
  marketTitle: string
  side: 'yes' | 'no'
  quantity: number
  fillPrice: string
  totalCost: string
  createdAt: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatCents(price: string): string {
  return `${(parseFloat(price) * 100).toFixed(0)}¢`
}

function formatDollar(amount: string): string {
  return parseFloat(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function OrderHistory() {
  const [orderList, setOrderList] = useState<Order[] | null>(null)

  useEffect(() => {
    fetch('/api/orders/history')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setOrderList(data.orders ?? []))
      .catch(() => setOrderList([]))
  }, [])

  if (orderList === null) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (orderList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No orders yet.</p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Market</TableHead>
            <TableHead>Side</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Fill Price</TableHead>
            <TableHead className="text-right">Total Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderList.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                {formatDate(order.createdAt)}
              </TableCell>
              <TableCell className="max-w-[240px] truncate font-medium" title={order.marketTitle}>
                {order.marketTitle}
              </TableCell>
              <TableCell>
                {order.side === 'yes' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">YES</Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">NO</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">{order.quantity}</TableCell>
              <TableCell className="text-right">{formatCents(order.fillPrice)}</TableCell>
              <TableCell className="text-right">{formatDollar(order.totalCost)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
