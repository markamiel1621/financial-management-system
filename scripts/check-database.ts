import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('Set DATABASE_URL in .env before checking the development database.')

const client = postgres(url, { max: 1, connect_timeout: 5 })
try {
  const db = drizzle(client, { schema })
  await db.execute(sql`select 1`)
  console.log('Connected to the development PostgreSQL database.')
} finally {
  await client.end()
}
