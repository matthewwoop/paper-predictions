import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OrderHistory } from '@/components/order-history'

export default async function OrdersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      <OrderHistory />
    </main>
  )
}
