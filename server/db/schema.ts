import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const trackedItems = sqliteTable('tracked_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('Waiting for Deal'),
  bestPrice: real('best_price').notNull(),
  targetPrice: real('target_price').notNull(),
  /** 'absolute' = targetPrice is the threshold; 'percent_off' = threshold = reference * (1 - percent/100) */
  targetMode: text('target_mode').notNull().default('absolute'),
  targetPercent: real('target_percent'),
  targetReferencePrice: real('target_reference_price'),
  image: text('image').notNull().default(''),
  url: text('url').default(''),
  alertEmail: text('alert_email').default(''),
  updatedAt: text('updated_at').notNull().default(''),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => chatSessions.id),
  sender: text('sender').notNull(), // 'PENNY' | 'YOU'
  text: text('text').notNull(),
  isChipActive: integer('is_chip_active', { mode: 'boolean' }).default(false),
  hasCards: integer('has_cards', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const priceHistory = sqliteTable('price_history', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  itemId: text('item_id').notNull().references(() => trackedItems.id),
  price: real('price').notNull(),
  source: text('source').default('manual'),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
