export type ConcernType = 'Inquiry' | 'Complaint' | 'Request' | 'Follow-up' | 'Other'
export type ConcernStatus = 'Unread' | 'Pending' | 'Completed'
export type VisitorType = 
  | 'PCIEERD Employee'
  | 'DOST Employee (Other Unit)'
  | 'Executive / Management'
  | 'Government Agency'
  | 'Private Organization / Company'
  | 'Researcher / Partner Institution'
  | 'Student / Intern'
  | 'Contractor / Supplier'
  | 'Visitor / Walk-in Client'
  | 'Other'

export type AttachmentType = 'image' | 'file' | 'link'

export interface Attachment {
  id: string
  type: AttachmentType
  name: string
  url: string
  mimeType?: string
  size?: number
}

export interface Concern {
  id: string
  fullName: string
  visitorType: VisitorType
  organization: string
  contactNumber: string
  email: string
  concernType: ConcernType
  concernDetails: string
  additionalNotes: string
  attachments: Attachment[]
  dateSubmitted: string
  timeSubmitted: string
  status: ConcernStatus
  createdAt: Date
}

export interface AdminCredentials {
  username: string
  password: string
}
