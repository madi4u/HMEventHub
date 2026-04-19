/**
 * Database client for EventHub.
 * Wraps pg (raw SQL) with a Supabase-compatible query interface
 * so existing server actions need minimal changes.
 */

import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 10,
  idleTimeoutMillis: 30000,
})

// ----------------------------------------------------------------
// Lightweight Supabase-compatible query builder backed by raw SQL
// ----------------------------------------------------------------

type Row = Record<string, unknown>
type QueryResult = { data: Row[] | null; error: Error | null }

class QueryBuilder {
  private _table: string
  private _schema: string
  private _selectCols: string = "*"
  private _filters: string[] = []
  private _params: unknown[] = []
  private _single: boolean = false
  private _orderBy: string | null = null
  private _limit: number | null = null
  private _insert: Row[] | null = null
  private _update: Row | null = null
  private _delete: boolean = false
  private _upsert: Row[] | null = null
  private _conflictCols: string[] | null = null

  constructor(table: string, schema: string = "eventhub") {
    this._table = table
    this._schema = schema
  }

  select(cols: string = "*") {
    this._selectCols = cols
    return this
  }

  eq(col: string, value: unknown) {
    this._params.push(value)
    this._filters.push(`"${col}" = $${this._params.length}`)
    return this
  }

  neq(col: string, value: unknown) {
    this._params.push(value)
    this._filters.push(`"${col}" != $${this._params.length}`)
    return this
  }

  gt(col: string, value: unknown) {
    this._params.push(value)
    this._filters.push(`"${col}" > $${this._params.length}`)
    return this
  }

  gte(col: string, value: unknown) {
    this._params.push(value)
    this._filters.push(`"${col}" >= $${this._params.length}`)
    return this
  }

  lt(col: string, value: unknown) {
    this._params.push(value)
    this._filters.push(`"${col}" < $${this._params.length}`)
    return this
  }

  lte(col: string, value: unknown) {
    this._params.push(value)
    this._filters.push(`"${col}" <= $${this._params.length}`)
    return this
  }

  is(col: string, value: unknown) {
    if (value === null) {
      this._filters.push(`"${col}" IS NULL`)
    } else {
      this._params.push(value)
      this._filters.push(`"${col}" IS $${this._params.length}`)
    }
    return this
  }

  in(col: string, values: unknown[]) {
    this._params.push(values)
    this._filters.push(`"${col}" = ANY($${this._params.length}::text[])`)
    return this
  }

  ilike(col: string, pattern: string) {
    this._params.push(pattern)
    this._filters.push(`"${col}" ILIKE $${this._params.length}`)
    return this
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._orderBy = `"${col}" ${opts?.ascending === false ? "DESC" : "ASC"}`
    return this
  }

  limit(n: number) {
    this._limit = n
    return this
  }

  single() {
    this._single = true
    this._limit = 1
    return this
  }

  insert(data: Row | Row[]) {
    this._insert = Array.isArray(data) ? data : [data]
    return this
  }

  update(data: Row) {
    this._update = data
    return this
  }

  upsert(data: Row | Row[], opts?: { onConflict?: string }) {
    this._upsert = Array.isArray(data) ? data : [data]
    this._conflictCols = opts?.onConflict ? [opts.onConflict] : null
    return this
  }

  delete() {
    this._delete = true
    return this
  }

  private whereClause() {
    if (this._filters.length === 0) return ""
    return "WHERE " + this._filters.join(" AND ")
  }

  async execute(): Promise<{ data: Row | Row[] | null; error: Error | null }> {
    const fqt = `"${this._schema}"."${this._table}"`
    try {
      // INSERT
      if (this._insert) {
        const rows = this._insert
        const keys = Object.keys(rows[0])
        const cols = keys.map((k) => `"${k}"`).join(", ")
        const placeholders = rows
          .map((_, ri) => "(" + keys.map((_, ci) => `$${ri * keys.length + ci + 1}`).join(", ") + ")")
          .join(", ")
        const values = rows.flatMap((r) => keys.map((k) => r[k]))
        const sql = `INSERT INTO ${fqt} (${cols}) VALUES ${placeholders} RETURNING *`
        const res = await pool.query(sql, values)
        const result = this._single ? res.rows[0] ?? null : res.rows
        return { data: result, error: null }
      }

      // UPSERT
      if (this._upsert) {
        const rows = this._upsert
        const keys = Object.keys(rows[0])
        const cols = keys.map((k) => `"${k}"`).join(", ")
        const placeholders = rows
          .map((_, ri) => "(" + keys.map((_, ci) => `$${ri * keys.length + ci + 1}`).join(", ") + ")")
          .join(", ")
        const values = rows.flatMap((r) => keys.map((k) => r[k]))
        const conflict = this._conflictCols ? `ON CONFLICT (${this._conflictCols.map((c) => `"${c}"`).join(",")}) DO UPDATE SET ${keys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(", ")}` : "ON CONFLICT DO NOTHING"
        const sql = `INSERT INTO ${fqt} (${cols}) VALUES ${placeholders} ${conflict} RETURNING *`
        const res = await pool.query(sql, values)
        const result = this._single ? res.rows[0] ?? null : res.rows
        return { data: result, error: null }
      }

      // UPDATE
      if (this._update) {
        const data = this._update
        const keys = Object.keys(data)
        const setClauses = keys.map((k, i) => {
          this._params.unshift(undefined)
          return `"${k}" = $${i + 1}`
        })
        const updateParams = [...keys.map((k) => data[k]), ...this._params.filter((p) => p !== undefined)]
        const whereParams = this._params.filter((p) => p !== undefined)
        const setStr = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ")
        const whereStr = this._filters.length ? "WHERE " + this._filters.map((f, i) => f.replace(/\$\d+/g, (m) => `$${keys.length + parseInt(m.slice(1))}`)).join(" AND ") : ""
        const allParams = [...keys.map((k) => data[k]), ...whereParams]
        const sql = `UPDATE ${fqt} SET ${setStr} ${whereStr} RETURNING *`
        const res = await pool.query(sql, allParams)
        const result = this._single ? res.rows[0] ?? null : res.rows
        return { data: result, error: null }
      }

      // DELETE
      if (this._delete) {
        const sql = `DELETE FROM ${fqt} ${this.whereClause()} RETURNING *`
        const res = await pool.query(sql, this._params)
        const result = this._single ? res.rows[0] ?? null : res.rows
        return { data: result, error: null }
      }

      // SELECT
      let sql = `SELECT ${this._selectCols} FROM ${fqt} ${this.whereClause()}`
      if (this._orderBy) sql += ` ORDER BY ${this._orderBy}`
      if (this._limit) sql += ` LIMIT ${this._limit}`
      const res = await pool.query(sql, this._params)
      const result = this._single ? res.rows[0] ?? null : res.rows
      return { data: result, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  then(resolve: (v: { data: Row | Row[] | null; error: Error | null }) => void) {
    return this.execute().then(resolve)
  }
}

// ----------------------------------------------------------------
// Main DB client — Supabase-compatible interface
// ----------------------------------------------------------------

export const db = {
  from(table: string) {
    // Map 'profiles', 'tenants' etc → eventhub schema
    // Special case: identity tables route to identity schema
    const identityTables = ["users", "organizations", "memberships"]
    const schema = identityTables.includes(table) ? "identity" : "eventhub"
    return new QueryBuilder(table, schema)
  },

  // Raw query escape hatch
  query(sql: string, params?: unknown[]) {
    return pool.query(sql, params)
  },
}

export type { Row }
