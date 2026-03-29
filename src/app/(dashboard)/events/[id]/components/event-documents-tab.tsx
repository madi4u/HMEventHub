'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Upload, Download, Trash2, FileText, Image, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import type { EventDocument } from '@/types'

interface EventDocumentsTabProps {
  eventId: string
  tenantId: string
  isManager: boolean
}

const categoryLabels: Record<string, string> = {
  ID: 'Ausweis',
  TICKET: 'Eintrittskarte',
  CONTRACT: 'Unterlagen',
  PHOTO: 'Foto',
  PDF: 'PDF',
  OTHER: 'Sonstiges',
}

export function EventDocumentsTab({ eventId, tenantId, isManager }: EventDocumentsTabProps) {
  const [documents, setDocuments] = useState<EventDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState('OTHER')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('event_documents')
      .select('*, uploader:profiles(full_name)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    setDocuments((data as EventDocument[]) ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const fileName = `${Date.now()}_${file.name}`
      const filePath = `events/${eventId}/documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('event-documents')
        .upload(filePath, file)

      if (uploadError) {
        toast.error('Fehler beim Hochladen')
        return
      }

      await supabase.from('event_documents').insert({
        event_id: eventId,
        tenant_id: tenantId,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        category,
        uploaded_by: profile?.id,
      })

      toast.success('Dokument hochgeladen')
      await loadDocuments()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(doc: EventDocument) {
    const supabase = createClient()
    await supabase.storage.from('event-documents').remove([doc.file_path])
    await supabase.from('event_documents').delete().eq('id', doc.id)
    toast.success('Dokument gelöscht')
    await loadDocuments()
  }

  async function handleDownload(doc: EventDocument) {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('event-documents')
      .createSignedUrl(doc.file_path, 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.startsWith('image/')) return <Image className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Dokumente ({documents.length})</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Hochladen
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine Dokumente vorhanden</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const uploader = doc.uploader as unknown as { full_name: string } | null
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-muted-foreground">{getFileIcon(doc.file_type)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {uploader?.full_name ?? 'Unbekannt'} · {formatDateTime(doc.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[doc.category] ?? doc.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isManager && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
