import {
  pgTable,
  pgEnum,
  text,
  numeric,
  integer,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const sideEnum = pgEnum('side', ['yes', 'no'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  balance: numeric('balance', { precision: 10, scale: 2 }).notNull().default('1000.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  marketTicker: text('market_ticker').notNull(),
  marketTitle: text('market_title').notNull(),
  side: sideEnum('side').notNull(),
  quantity: integer('quantity').notNull(),
  fillPrice: numeric('fill_price', { precision: 10, scale: 4 }).notNull(),
  totalCost: numeric('total_cost', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
