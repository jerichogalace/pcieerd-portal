// Concern utilities for formatting and data transformation
// Database operations are handled directly in API routes via Prisma

import { 
  Concern, 
  ConcernStatus, 
  ConcernType, 
  VisitorType, 
  Attachment 
} from '@/types/concern'

// Philippines timezone (Asia/Manila - UTC+8)
const PH_TIMEZONE = 'Asia/Manila'

// Format date to MM/DD/YYYY in Philippine timezone
export const formatDatePH = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: PH_TIMEZONE
  })
}

// Format time to HH:MM:SS AM/PM in Philippine timezone
export const formatTimePH = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: PH_TIMEZONE
  })
}

// Get current time in Philippines timezone
export const getNowInPH = (): Date => {
  const now = new Date()
  const phTimeStr = now.toLocaleString('en-US', { timeZone: PH_TIMEZONE })
  return new Date(phTimeStr)
}

// Type for creating a new concern in the database
export interface CreateConcernInput {
  fullName: string
  visitorType: VisitorType
  organization?: string
  contactNumber?: string
  email?: string
  concernType: ConcernType
  concernDetails: string
  additionalNotes?: string
  attachments?: Attachment[]
}

// Type for concern from database
export interface ConcernFromDB {
  id: string
  fullName: string
  visitorType: string
  organization: string | null
  contactNumber: string | null
  email: string | null
  concernType: string
  concernDetails: string
  additionalNotes: string | null
  attachments: string | any[] | null // Can be string (SQLite), array (PostgreSQL), or null
  dateSubmitted: string
  timeSubmitted: string
  status: string
  createdAt: Date
  updatedAt: Date
}

// Parse attachments - handles both SQLite (string) and PostgreSQL (JSON) formats
function parseAttachments(attachments: string | any[] | null): Attachment[] {
  if (!attachments) return []
  
  // If it's already an array (PostgreSQL JSON), return it
  if (Array.isArray(attachments)) {
    return attachments as Attachment[]
  }
  
  // If it's a string (SQLite), parse it
  if (typeof attachments === 'string') {
    try {
      const parsed = JSON.parse(attachments)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  
  return []
}

// Transform database concern to frontend Concern type
export function transformConcernFromDB(dbConcern: ConcernFromDB): Concern {
  return {
    id: dbConcern.id,
    fullName: dbConcern.fullName,
    visitorType: dbConcern.visitorType as VisitorType,
    organization: dbConcern.organization || '',
    contactNumber: dbConcern.contactNumber || '',
    email: dbConcern.email || '',
    concernType: dbConcern.concernType as ConcernType,
    concernDetails: dbConcern.concernDetails,
    additionalNotes: dbConcern.additionalNotes || '',
    attachments: parseAttachments(dbConcern.attachments),
    dateSubmitted: dbConcern.dateSubmitted,
    timeSubmitted: dbConcern.timeSubmitted,
    status: dbConcern.status as ConcernStatus,
    createdAt: dbConcern.createdAt,
  }
}

// Validate concern type
export function isValidConcernType(type: string): type is ConcernType {
  return ['Inquiry', 'Complaint', 'Request', 'Follow-up', 'Other'].includes(type)
}

// Validate visitor type
export function isValidVisitorType(type: string): type is VisitorType {
  const validTypes: VisitorType[] = [
    'PCIEERD Employee',
    'DOST Employee (Other Unit)',
    'Executive / Management',
    'Government Agency',
    'Private Organization / Company',
    'Researcher / Partner Institution',
    'Student / Intern',
    'Contractor / Supplier',
    'Visitor / Walk-in Client',
    'Other'
  ]
  return validTypes.includes(type as VisitorType)
}

// Validate concern status
export function isValidConcernStatus(status: string): status is ConcernStatus {
  return ['Unread', 'Pending', 'Completed'].includes(status)
}

// Serialize attachments for database storage
export function serializeAttachments(attachments: Attachment[]): string {
  return JSON.stringify(attachments)
}
