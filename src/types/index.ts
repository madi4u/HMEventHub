// ============================================================
// ENUMS
// ============================================================

export type UserRole =
  | 'SUPERADMIN'
  | 'TENANT_ADMIN'
  | 'OWNER'
  | 'EVENT_MANAGER'
  | 'STANDLEITER'
  | 'EMPLOYEE'
  | 'READ_ONLY'

export type EventStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'

export type EventType =
  | 'FESTIVAL'
  | 'CORPORATE'
  | 'PRIVATE'
  | 'MARKET'
  | 'CATERING'
  | 'OTHER'

export type CashReportStatus = 'OPEN' | 'SUBMITTED' | 'FINAL'

export type TimeEntryStatus = 'ACTIVE' | 'COMPLETED' | 'APPROVED'

export type ChecklistItemType =
  | 'CHECKBOX'
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'PHOTO'
  | 'SIGNATURE'

export type PreferredLanguage = 'de' | 'en' | 'es'

export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type FeedCategory = 'DAMAGE' | 'INFO' | 'PHOTO' | 'NOTE'

export type InventorySessionType = 'INTAKE' | 'RETURN' | 'COUNT'

export type ChecklistRunStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'

export type EventDayStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED'

export type RoleInEvent = 'STANDLEITER' | 'EMPLOYEE' | 'DRIVER' | 'SUPPORT'

export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'IN_REPAIR'

export type DocumentCategory = 'ID' | 'TICKET' | 'CONTRACT' | 'PHOTO' | 'PDF' | 'OTHER'

export type ChecklistCategory = 'GENERAL' | 'HYGIENE' | 'VEHICLE' | 'CLEANING' | 'OTHER'

export type ExportType = 'FULL' | 'CASH_REPORT' | 'CHECKLIST' | 'TEAM'

export type DenominationType = 'NOTE' | 'COIN'

// ============================================================
// INTERFACES
// ============================================================

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  tenant_id: string | null
  full_name: string
  email: string
  role: UserRole
  preferred_language: PreferredLanguage
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  tenant_id: string
  title: string
  event_type: EventType
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  departure_time: string | null
  status: EventStatus
  address: string | null
  city: string | null
  postal_code: string | null
  country: string
  google_maps_url: string | null
  apple_maps_url: string | null
  organizer_name: string | null
  organizer_contact: string | null
  stand_contact_name: string | null
  stand_contact_phone: string | null
  stand_number: string | null
  emergency_phone: string | null
  internal_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EventDay {
  id: string
  tenant_id: string
  event_id: string
  event_date: string
  day_label: string
  status: EventDayStatus
  created_at: string
}

export interface EventAssignment {
  id: string
  tenant_id: string
  event_id: string
  user_id: string
  role_in_event: RoleInEvent
  created_at: string
  // Joined
  profile?: Profile
}

export interface Vehicle {
  id: string
  tenant_id: string
  name: string
  license_plate: string | null
  type: string | null
  status: VehicleStatus
  notes: string | null
  created_at: string
}

export interface Foodtruck {
  id: string
  tenant_id: string
  name: string
  type: string | null
  status: string
  notes: string | null
  created_at: string
}

export interface CoolingTrailer {
  id: string
  tenant_id: string
  name: string
  status: string
  notes: string | null
  created_at: string
}

export interface Equipment {
  id: string
  tenant_id: string
  name: string
  category: string | null
  status: string
  notes: string | null
  created_at: string
}

export interface EventLogisticsAssignment {
  id: string
  tenant_id: string
  event_id: string
  vehicle_id: string | null
  foodtruck_id: string | null
  cooling_trailer_id: string | null
  equipment_notes: string | null
  created_at: string
  // Joined
  vehicle?: Vehicle
  foodtruck?: Foodtruck
  cooling_trailer?: CoolingTrailer
}

export interface ProductCategory {
  id: string
  tenant_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  tenant_id: string
  name: string
  category_id: string | null
  unit: string
  notes: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  // Joined
  category?: ProductCategory
}

export interface InventorySession {
  id: string
  tenant_id: string
  event_id: string
  event_day_id: string | null
  session_type: InventorySessionType
  photo_url: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  // Joined
  items?: InventoryItem[]
  creator?: Profile
}

export interface InventoryItem {
  id: string
  session_id: string
  product_id: string
  quantity: number
  notes: string | null
  // Joined
  product?: Product
}

export interface TimeEntry {
  id: string
  tenant_id: string
  event_id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  break_minutes: number
  status: TimeEntryStatus
  location_in: { lat: number; lng: number } | null
  location_out: { lat: number; lng: number } | null
  created_at: string
  // Joined
  profile?: Profile
}

export interface CashReport {
  id: string
  tenant_id: string
  event_id: string
  event_day_id: string
  submitted_by_user_id: string | null
  submitted_at: string | null
  status: CashReportStatus
  total_amount: number
  notes: string | null
  signature_file_path: string | null
  cash_photo_file_path: string | null
  pdf_file_path: string | null
  created_at: string
  updated_at: string
  // Joined
  denominations?: CashReportDenomination[]
  event_day?: EventDay
  submitted_by?: Profile
}

export interface CashReportDenomination {
  id: string
  cash_report_id: string
  denomination_type: DenominationType
  denomination_value: number
  quantity: number
  subtotal: number
}

export interface ChecklistTemplate {
  id: string
  tenant_id: string
  name: string
  description: string | null
  category: ChecklistCategory
  is_active: boolean
  created_at: string
  // Joined
  items?: ChecklistTemplateItem[]
}

export interface ChecklistTemplateItem {
  id: string
  template_id: string
  label: string
  label_en: string | null
  label_es: string | null
  item_type: ChecklistItemType
  is_required: boolean
  sort_order: number
  options: Record<string, unknown> | null
}

export interface ChecklistRun {
  id: string
  tenant_id: string
  event_id: string
  template_id: string
  completed_by: string | null
  completed_at: string | null
  signature_file_path: string | null
  status: ChecklistRunStatus
  created_at: string
  // Joined
  template?: ChecklistTemplate
  answers?: ChecklistAnswer[]
  completer?: Profile
}

export interface ChecklistAnswer {
  id: string
  run_id: string
  template_item_id: string
  value: string | null
  photo_url: string | null
}

export interface FeedEntry {
  id: string
  tenant_id: string
  event_id: string
  user_id: string
  content: string | null
  category: FeedCategory
  location: { lat: number; lng: number } | null
  created_at: string
  // Joined
  author?: Profile
  attachments?: FeedAttachment[]
}

export interface FeedAttachment {
  id: string
  feed_entry_id: string
  file_path: string
  file_type: string
  file_name: string | null
  created_at: string
}

export interface EventDocument {
  id: string
  tenant_id: string
  event_id: string
  file_path: string
  file_name: string
  file_type: string | null
  category: DocumentCategory
  uploaded_by: string | null
  created_at: string
  // Joined
  uploader?: Profile
}

export interface OnboardingModule {
  id: string
  tenant_id: string
  title_de: string
  title_en: string | null
  title_es: string | null
  content_de: string | null
  content_en: string | null
  content_es: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  assets?: OnboardingAsset[]
}

export interface OnboardingAsset {
  id: string
  module_id: string
  file_path: string
  file_type: 'IMAGE' | 'VIDEO' | 'PDF'
  title: string | null
  sort_order: number
}

export interface ActivityLog {
  id: string
  tenant_id: string | null
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  // Joined
  actor?: Profile
}

export interface ProductPass {
  id: string
  tenant_id: string
  product_id: string | null
  title: string
  recipe_de: string | null
  recipe_en: string | null
  recipe_es: string | null
  image_url: string | null
  created_at: string
  // Joined
  product?: Product
}

// ============================================================
// FORM / UI TYPES
// ============================================================

export interface CreateEventInput {
  title: string
  event_type: EventType
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  departure_time?: string
  status: EventStatus
  address?: string
  city?: string
  postal_code?: string
  country?: string
  google_maps_url?: string
  apple_maps_url?: string
  organizer_name?: string
  organizer_contact?: string
  stand_contact_name?: string
  stand_contact_phone?: string
  stand_number?: string
  emergency_phone?: string
  internal_notes?: string
}

export interface DenominationRow {
  type: DenominationType
  value: number
  label: string
  quantity: number
  subtotal: number
}

export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: number | string
  roles?: UserRole[]
}
