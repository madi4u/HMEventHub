import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getInitials, formatDateTime } from '@/lib/utils'
import type { FeedEntry as FeedEntryType, FeedCategory, FeedAttachment } from '@/types'

interface FeedEntryProps {
  entry: FeedEntryType
}

const categoryConfig: Record<FeedCategory, { label: string; color: string }> = {
  DAMAGE: { label: 'Schaden', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  INFO: { label: 'Info', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  PHOTO: { label: 'Foto', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  NOTE: { label: 'Notiz', color: 'bg-secondary text-secondary-foreground border-border' },
}

export function FeedEntry({ entry }: FeedEntryProps) {
  const author = entry.author as unknown as { full_name: string; avatar_url: string | null } | null
  const attachments = (entry.attachments as FeedAttachment[]) ?? []
  const config = categoryConfig[entry.category] ?? categoryConfig.NOTE

  return (
    <Card className="border-border">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={author?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-secondary text-xs">
              {author ? getInitials(author.full_name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{author?.full_name ?? 'Unbekannt'}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</span>
              <Badge variant="outline" className={`text-xs ${config.color}`}>
                {config.label}
              </Badge>
            </div>
            {entry.content && (
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{entry.content}</p>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((att) => {
                  if (att.file_type.startsWith('image/')) {
                    return (
                      <a
                        key={att.id}
                        href={`/api/storage/${att.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="w-20 h-20 rounded-md border border-border bg-secondary flex items-center justify-center overflow-hidden">
                          <img
                            src={att.file_path}
                            alt={att.file_name ?? 'Foto'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </a>
                    )
                  }
                  return (
                    <a
                      key={att.id}
                      href={att.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      {att.file_name ?? 'Datei'}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
