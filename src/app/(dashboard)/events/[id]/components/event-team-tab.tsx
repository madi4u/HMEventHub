'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserPlus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getInitials } from '@/lib/utils'
import type { Profile, EventAssignment } from '@/types'

interface EventTeamTabProps {
  eventId: string
  tenantId: string
  isManager: boolean
}

export function EventTeamTab({ eventId, tenantId, isManager }: EventTeamTabProps) {
  const [assignments, setAssignments] = useState<EventAssignment[]>([])
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('EMPLOYEE')
  const [searchQuery, setSearchQuery] = useState('')
  const [adding, setAdding] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('event_assignments')
      .select('*, profile:profiles(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    setAssignments((data as EventAssignment[]) ?? [])
    setLoading(false)
  }, [eventId])

  const loadUsers = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    setAvailableUsers((data as Profile[]) ?? [])
  }, [tenantId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (addDialogOpen) loadUsers()
  }, [addDialogOpen, loadUsers])

  async function handleAddUser() {
    if (!selectedUserId) return
    setAdding(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('event_assignments').insert({
        event_id: eventId,
        tenant_id: tenantId,
        user_id: selectedUserId,
        role_in_event: selectedRole,
      })

      if (error) {
        toast.error('Fehler beim Hinzufügen des Mitarbeiters')
        return
      }

      toast.success('Mitarbeiter hinzugefügt')
      setAddDialogOpen(false)
      setSelectedUserId('')
      await loadData()
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveUser(assignmentId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('event_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      toast.error('Fehler beim Entfernen')
      return
    }

    toast.success('Mitarbeiter entfernt')
    await loadData()
  }

  const roleLabels: Record<string, string> = {
    STANDLEITER: 'Standleiter',
    EMPLOYEE: 'Mitarbeiter',
    DRIVER: 'Fahrer',
    SUPPORT: 'Support',
  }

  const roleBadgeColors: Record<string, string> = {
    STANDLEITER: 'bg-green-500/20 text-green-400 border-green-500/30',
    EMPLOYEE: 'bg-secondary text-secondary-foreground border-border',
    DRIVER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    SUPPORT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }

  const filteredUsers = availableUsers.filter(
    (u) =>
      !assignments.some((a) => a.user_id === u.id) &&
      (u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
        <CardTitle className="text-base">Zugewiesenes Team ({assignments.length})</CardTitle>
        {isManager && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-1" />
                Mitarbeiter hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mitarbeiter hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Rolle</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDLEITER">Standleiter</SelectItem>
                      <SelectItem value="EMPLOYEE">Mitarbeiter</SelectItem>
                      <SelectItem value="DRIVER">Fahrer</SelectItem>
                      <SelectItem value="SUPPORT">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mitarbeiter suchen</Label>
                  <Input
                    placeholder="Name oder E-Mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Keine Mitarbeiter verfügbar
                    </p>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                          selectedUserId === u.id
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">{getInitials(u.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddUser}
                  disabled={!selectedUserId || adding}
                >
                  {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Hinzufügen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Kein Team zugewiesen
          </p>
        ) : (
          <div className="space-y-2">
            {assignments.map((assignment) => {
              const p = assignment.profile
              if (!p) return null
              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-secondary">
                        {getInitials(p.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${roleBadgeColors[assignment.role_in_event] ?? ''}`}
                    >
                      {roleLabels[assignment.role_in_event] ?? assignment.role_in_event}
                    </Badge>
                    {isManager && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(assignment.id)}
                        className="text-destructive hover:text-destructive h-7 w-7 p-0"
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
