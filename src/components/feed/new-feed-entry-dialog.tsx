'use client'

import { useState, useRef } from 'react'
import { Loader2, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FeedCategory } from '@/types'

interface NewFeedEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onSuccess: () => void
}

const categoryOptions: { value: FeedCategory; label: string }[] = [
  { value: 'NOTE', label: 'Notiz' },
  { value: 'INFO', label: 'Info' },
  { value: 'DAMAGE', label: 'Schaden' },
  { value: 'PHOTO', label: 'Foto' },
]

export function NewFeedEntryDialog({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: NewFeedEntryDialogProps) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<FeedCategory>('NOTE')
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    if (!content.trim() && !photo) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, tenant_id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      // Create feed entry
      const { data: entry, error } = await supabase
        .from('event_feed_entries')
        .insert({
          event_id: eventId,
          tenant_id: profile.tenant_id,
          user_id: profile.id,
          content: content.trim() || null,
          category,
        })
        .select()
        .single()

      if (error || !entry) {
        toast.error('Fehler beim Erstellen des Eintrags')
        return
      }

      // Upload photo if present
      if (photo) {
        const fileName = `${Date.now()}_${photo.name}`
        const filePath = `feed/${eventId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('feed-attachments')
          .upload(filePath, photo)

        if (!uploadError) {
          await supabase.from('event_feed_attachments').insert({
            feed_entry_id: entry.id,
            file_path: filePath,
            file_type: photo.type,
            file_name: photo.name,
          })
        }
      }

      toast.success('Eintrag erstellt')
      setContent('')
      setCategory('NOTE')
      setPhoto(null)
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Unerwarteter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Feed-Eintrag</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nachricht</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Schreiben Sie eine Nachricht..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Foto (optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Foto anhängen
              </Button>
              {photo && (
                <span className="text-xs text-muted-foreground">{photo.name}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && !photo)}
              className="flex-1"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Senden
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
