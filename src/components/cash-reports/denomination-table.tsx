'use client'

import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import type { DenominationRow, DenominationType } from '@/types'

const DEFAULT_DENOMINATIONS: Omit<DenominationRow, 'quantity' | 'subtotal'>[] = [
  { type: 'NOTE', value: 500, label: '500 €' },
  { type: 'NOTE', value: 200, label: '200 €' },
  { type: 'NOTE', value: 100, label: '100 €' },
  { type: 'NOTE', value: 50, label: '50 €' },
  { type: 'NOTE', value: 20, label: '20 €' },
  { type: 'NOTE', value: 10, label: '10 €' },
  { type: 'NOTE', value: 5, label: '5 €' },
  { type: 'COIN', value: 2, label: '2 €' },
  { type: 'COIN', value: 1, label: '1 €' },
  { type: 'COIN', value: 0.5, label: '50 ct' },
  { type: 'COIN', value: 0.2, label: '20 ct' },
  { type: 'COIN', value: 0.1, label: '10 ct' },
  { type: 'COIN', value: 0.05, label: '5 ct' },
  { type: 'COIN', value: 0.02, label: '2 ct' },
  { type: 'COIN', value: 0.01, label: '1 ct' },
]

export function getDefaultDenominations(): DenominationRow[] {
  return DEFAULT_DENOMINATIONS.map((d) => ({ ...d, quantity: 0, subtotal: 0 }))
}

interface DenominationTableProps {
  value: DenominationRow[]
  onChange: (rows: DenominationRow[]) => void
  readOnly?: boolean
}

export function DenominationTable({ value, onChange, readOnly = false }: DenominationTableProps) {
  function handleQuantityChange(index: number, qty: number) {
    const updated = value.map((row, i) => {
      if (i !== index) return row
      const quantity = Math.max(0, qty)
      const subtotal = Math.round(quantity * row.value * 100) / 100
      return { ...row, quantity, subtotal }
    })
    onChange(updated)
  }

  const notes = value.filter((d) => d.type === 'NOTE')
  const coins = value.filter((d) => d.type === 'COIN')
  const noteTotal = notes.reduce((s, d) => s + d.subtotal, 0)
  const coinTotal = coins.reduce((s, d) => s + d.subtotal, 0)
  const grandTotal = Math.round((noteTotal + coinTotal) * 100) / 100

  const DenomSection = ({ rows, title, typeFilter }: { rows: DenominationRow[]; title: string; typeFilter: DenominationType }) => (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
      <div className="space-y-1">
        {rows.map((row, globalIdx) => {
          const idx = value.findIndex((d) => d.type === typeFilter && d.value === row.value)
          return (
            <div
              key={`${row.type}-${row.value}`}
              className="grid grid-cols-3 items-center gap-3 py-1.5 border-b border-border last:border-0"
            >
              <span className="text-sm font-medium tabular-nums">{row.label}</span>
              <div>
                {readOnly ? (
                  <span className="text-sm tabular-nums">{row.quantity}</span>
                ) : (
                  <Input
                    type="number"
                    min={0}
                    value={row.quantity || ''}
                    onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                    className="h-8 text-sm text-center"
                    placeholder="0"
                  />
                )}
              </div>
              <span className="text-sm tabular-nums text-right">
                {row.quantity > 0 ? formatCurrency(row.subtotal) : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-3 gap-3 pb-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">Stückelung</span>
        <span className="text-xs font-medium text-muted-foreground">Anzahl</span>
        <span className="text-xs font-medium text-muted-foreground text-right">Betrag</span>
      </div>

      <DenomSection rows={notes} title="Scheine" typeFilter="NOTE" />
      <DenomSection rows={coins} title="Münzen" typeFilter="COIN" />

      {/* Totals */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Scheine:</span>
          <span className="tabular-nums">{formatCurrency(noteTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Münzen:</span>
          <span className="tabular-nums">{formatCurrency(coinTotal)}</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t border-border pt-2">
          <span>Gesamtbetrag:</span>
          <span className="tabular-nums text-lg">{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}
