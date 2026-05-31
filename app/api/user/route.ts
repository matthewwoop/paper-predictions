import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let [user] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)
  if (!user) {
    await db.insert(users).values({ clerkUserId: userId, balance: '1000.00' })
    ;[user] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)
  }
  return NextResponse.json({ balance: user.balance })
}
