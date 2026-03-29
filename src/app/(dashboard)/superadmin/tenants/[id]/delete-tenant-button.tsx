'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function DeleteTenantButton({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function deleteTenant() {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Fehler beim Löschen'); return }
      toast.success(`Mandant "${tenantName}" wurde gelöscht`)
      router.push('/superadmin')
    } catch { toast.error('Fehler') } finally { setLoading(false) }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-1" />
        Mandant löschen
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mandant löschen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Mandant <strong className="text-foreground">{tenantName}</strong> wirklich löschen?
            Alle Benutzer, Veranstaltungen und Daten dieses Mandanten werden unwiderruflich gelöscht.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={deleteTenant} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Endgültig löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
