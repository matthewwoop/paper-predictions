import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { BalanceDisplay } from '@/components/balance-display'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const existing = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)
  if (!existing.length) {
    await db.insert(users).values({ clerkUserId: userId, balance: '1000.00' })
  }

  const [user] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <BalanceDisplay initialBalance={user.balance} />
    </main>
  )
}
