/**
 * EventHub: Data migration from Supabase → Hetzner PostgreSQL
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." SUPABASE_URL="https://..." SUPABASE_SERVICE_KEY="..." \
 *   npx ts-node scripts/migrate-from-supabase.ts
 */

import { Pool } from "pg"

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
const DATABASE_URL = process.env.DATABASE_URL!

if (!SUPABASE_URL || !SUPABASE_KEY || !DATABASE_URL) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_SERVICE_KEY, DATABASE_URL")
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

async function supabaseFetch(table: string, select = "*", filter?: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${filter ? "&" + filter : ""}`
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      "Range-Unit": "items",
      Range: "0-9999",
    },
  })
  if (!res.ok) throw new Error(`Supabase fetch ${table} failed: ${res.statusText}`)
  return res.json()
}

async function upsertRows(table: string, rows: Record<string, unknown>[], conflictCol = "id") {
  if (rows.length === 0) return
  const keys = Object.keys(rows[0])
  const cols = keys.map((k) => `"${k}"`).join(", ")
  const updates = keys.filter((k) => k !== conflictCol).map((k) => `"${k}" = EXCLUDED."${k}"`).join(", ")

  for (const row of rows) {
    const vals = keys.map((k) => row[k])
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
    const sql = `INSERT INTO eventhub."${table}" (${cols}) VALUES (${placeholders})
                 ON CONFLICT ("${conflictCol}") DO UPDATE SET ${updates}`
    await pool.query(sql, vals)
  }
}

async function main() {
  console.log("🚀 Starting EventHub migration: Supabase → Hetzner")
  console.log("")

  // ============================================================
  // 1. Tenants
  // ============================================================
  console.log("📦 Migrating tenants...")
  const tenants = await supabaseFetch("tenants")
  await upsertRows("tenants", tenants.map((t: Record<string, unknown>) => ({
    id: t.id,
    name: t.name,
    slug: t.slug ?? String(t.name).toLowerCase().replace(/\s+/g, "-"),
    status: t.status ?? "ACTIVE",
    logo_url: t.logo_url ?? null,
    created_at: t.created_at,
    updated_at: t.updated_at,
  })))
  console.log(`  ✅ ${tenants.length} tenants`)

  // ============================================================
  // 2. Profiles (user_id maps to identity.users.id)
  // Note: Supabase auth.users UUIDs need to map to identity.users
  // For now, we create profiles with the same UUID as tenant user
  // ============================================================
  console.log("📦 Migrating profiles...")
  const profiles = await supabaseFetch("profiles")
  let profilesMigrated = 0
  for (const p of profiles) {
    // Check if identity.users already has this user (by email)
    const { rows: existing } = await pool.query(
      'SELECT id FROM identity.users WHERE email = $1',
      [p.email]
    )
    const userId = existing[0]?.id ?? p.user_id

    await pool.query(`
      INSERT INTO eventhub.profiles (id, user_id, tenant_id, full_name, email, role, preferred_language, avatar_url, phone, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        tenant_id = EXCLUDED.tenant_id,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at
    `, [p.id, userId, p.tenant_id, p.full_name, p.email, p.role, p.preferred_language ?? 'de', p.avatar_url, p.phone, p.is_active ?? true, p.created_at, p.updated_at])
    profilesMigrated++
  }
  console.log(`  ✅ ${profilesMigrated} profiles`)

  // ============================================================
  // 3. Events
  // ============================================================
  console.log("📦 Migrating events...")
  const events = await supabaseFetch("events")
  await upsertRows("events", events)
  console.log(`  ✅ ${events.length} events`)

  // ============================================================
  // 4. Event Days
  // ============================================================
  console.log("📦 Migrating event_days...")
  const eventDays = await supabaseFetch("event_days")
  await upsertRows("event_days", eventDays)
  console.log(`  ✅ ${eventDays.length} event_days`)

  // ============================================================
  // 5. Event Assignments
  // ============================================================
  console.log("📦 Migrating event_assignments...")
  const assignments = await supabaseFetch("event_assignments")
  await upsertRows("event_assignments", assignments)
  console.log(`  ✅ ${assignments.length} assignments`)

  // ============================================================
  // 6. Vehicles
  // ============================================================
  console.log("📦 Migrating vehicles, foodtrucks, equipment...")
  const vehicles = await supabaseFetch("vehicles")
  await upsertRows("vehicles", vehicles)
  const foodtrucks = await supabaseFetch("foodtrucks")
  await upsertRows("foodtrucks", foodtrucks)
  const equipment = await supabaseFetch("equipment")
  await upsertRows("equipment", equipment)
  const coolingTrailers = await supabaseFetch("cooling_trailers")
  await upsertRows("cooling_trailers", coolingTrailers)
  console.log(`  ✅ ${vehicles.length} vehicles, ${foodtrucks.length} foodtrucks, ${equipment.length} equipment, ${coolingTrailers.length} cooling_trailers`)

  // ============================================================
  // 7. Products
  // ============================================================
  console.log("📦 Migrating products...")
  const productCats = await supabaseFetch("product_categories")
  await upsertRows("product_categories", productCats)
  const products = await supabaseFetch("products")
  await upsertRows("products", products)
  console.log(`  ✅ ${products.length} products`)

  // ============================================================
  // 8. Time Entries
  // ============================================================
  console.log("📦 Migrating time_entries...")
  const timeEntries = await supabaseFetch("time_entries")
  await upsertRows("time_entries", timeEntries)
  console.log(`  ✅ ${timeEntries.length} time entries`)

  // ============================================================
  // 9. Cash Reports
  // ============================================================
  console.log("📦 Migrating cash_reports...")
  const cashReports = await supabaseFetch("cash_reports")
  await upsertRows("cash_reports", cashReports)
  const denominations = await supabaseFetch("cash_report_denominations")
  // Filter out computed column
  await upsertRows("cash_report_denominations",
    denominations.map((d: Record<string, unknown>) => ({ id: d.id, cash_report_id: d.cash_report_id, denomination: d.denomination, count: d.count }))
  )
  console.log(`  ✅ ${cashReports.length} cash reports`)

  // ============================================================
  // 10. Checklists
  // ============================================================
  console.log("📦 Migrating checklists...")
  const templates = await supabaseFetch("checklist_templates")
  await upsertRows("checklist_templates", templates)
  const templateItems = await supabaseFetch("checklist_template_items")
  await upsertRows("checklist_template_items", templateItems)
  const runs = await supabaseFetch("event_checklist_runs")
  await upsertRows("event_checklist_runs", runs)
  const answers = await supabaseFetch("event_checklist_answers")
  await upsertRows("event_checklist_answers", answers)
  console.log(`  ✅ ${templates.length} templates, ${runs.length} runs`)

  // ============================================================
  // 11. Feed
  // ============================================================
  console.log("📦 Migrating feed entries...")
  const feedEntries = await supabaseFetch("event_feed_entries")
  await upsertRows("event_feed_entries", feedEntries)
  const feedAttachments = await supabaseFetch("event_feed_attachments")
  await upsertRows("event_feed_attachments", feedAttachments)
  console.log(`  ✅ ${feedEntries.length} feed entries`)

  // ============================================================
  // 12. Inventory
  // ============================================================
  console.log("📦 Migrating inventory...")
  const invSessions = await supabaseFetch("event_inventory_sessions")
  await upsertRows("event_inventory_sessions", invSessions)
  const invItems = await supabaseFetch("event_inventory_items")
  await upsertRows("event_inventory_items", invItems)
  console.log(`  ✅ ${invSessions.length} inventory sessions`)

  // ============================================================
  // 13. Activity Logs
  // ============================================================
  console.log("📦 Migrating activity_logs...")
  const logs = await supabaseFetch("activity_logs")
  await upsertRows("activity_logs", logs)
  console.log(`  ✅ ${logs.length} logs`)

  await pool.end()
  console.log("")
  console.log("✅ Migration complete!")
  console.log("")
  console.log("Verify with:")
  console.log(`  SELECT COUNT(*) FROM eventhub.events;`)
  console.log(`  SELECT COUNT(*) FROM eventhub.profiles;`)
}

main().catch((err) => {
  console.error("❌ Migration failed:", err)
  process.exit(1)
})
