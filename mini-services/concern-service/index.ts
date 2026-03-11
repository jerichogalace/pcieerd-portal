import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 50e6 // 50MB limit for file uploads
})

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

// In-memory storage for concerns
const concerns: Concern[] = []

const generateId = () => Math.random().toString(36).substr(2, 9)

// Philippines timezone (Asia/Manila - UTC+8)
const PH_TIMEZONE = 'Asia/Manila'

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: PH_TIMEZONE
  })
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: PH_TIMEZONE
  })
}

// Get current time in Philippines timezone
const getNowInPH = (): Date => {
  const now = new Date()
  const phTimeStr = now.toLocaleString('en-US', { timeZone: PH_TIMEZONE })
  return new Date(phTimeStr)
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Send existing concerns to newly connected client (admin)
  socket.emit('initial-concerns', { concerns: concerns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) })

  // Send current counts
  const today = formatDate(new Date())
  socket.emit('counts', { 
    todayCount: concerns.filter(c => c.dateSubmitted === today).length,
    totalCount: concerns.length,
    unreadCount: concerns.filter(c => c.status === 'Unread').length,
    pendingCount: concerns.filter(c => c.status === 'Pending').length,
    completedCount: concerns.filter(c => c.status === 'Completed').length,
  })

  // Handle new concern submission from visitor form
  socket.on('submit-concern', (data: Omit<Concern, 'id' | 'dateSubmitted' | 'timeSubmitted' | 'createdAt' | 'status'>) => {
    const now = new Date()
    const nowPH = getNowInPH()
    const newConcern: Concern = {
      ...data,
      id: generateId(),
      dateSubmitted: formatDate(now),
      timeSubmitted: formatTime(now),
      status: 'Unread',
      createdAt: nowPH,
      attachments: data.attachments || []
    }
    
    concerns.push(newConcern)
    
    // Broadcast new concern to all connected clients (admins)
    io.emit('new-concern', { concern: newConcern })
    
    // Broadcast updated counts
    const todayDate = formatDate(new Date())
    io.emit('counts', { 
      todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
      totalCount: concerns.length,
      unreadCount: concerns.filter(c => c.status === 'Unread').length,
      pendingCount: concerns.filter(c => c.status === 'Pending').length,
      completedCount: concerns.filter(c => c.status === 'Completed').length,
    })
    
    console.log(`New concern submitted by ${newConcern.fullName} at ${newConcern.timeSubmitted} PH Time with ${newConcern.attachments.length} attachments`)
  })

  // Handle delete concern
  socket.on('delete-concern', (data: { id: string }) => {
    const index = concerns.findIndex(c => c.id === data.id)
    if (index !== -1) {
      concerns.splice(index, 1)
      io.emit('concern-deleted', { id: data.id })
      
      // Broadcast updated counts
      const todayDate = formatDate(new Date())
      io.emit('counts', { 
        todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
        totalCount: concerns.length,
        unreadCount: concerns.filter(c => c.status === 'Unread').length,
        pendingCount: concerns.filter(c => c.status === 'Pending').length,
        completedCount: concerns.filter(c => c.status === 'Completed').length,
      })
      
      console.log(`Concern ${data.id} deleted`)
    }
  })

  // Handle update concern status
  socket.on('update-status', (data: { id: string; status: ConcernStatus }) => {
    const concern = concerns.find(c => c.id === data.id)
    if (concern) {
      concern.status = data.status
      io.emit('status-updated', { id: data.id, status: data.status })
      
      // Broadcast updated counts
      const todayDate = formatDate(new Date())
      io.emit('counts', { 
        todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
        totalCount: concerns.length,
        unreadCount: concerns.filter(c => c.status === 'Unread').length,
        pendingCount: concerns.filter(c => c.status === 'Pending').length,
        completedCount: concerns.filter(c => c.status === 'Completed').length,
      })
      
      console.log(`Concern ${data.id} status updated to ${data.status}`)
    }
  })

  // Handle mark as pending (when admin views details)
  socket.on('mark-pending', (data: { id: string }) => {
    const concern = concerns.find(c => c.id === data.id)
    if (concern && concern.status === 'Unread') {
      concern.status = 'Pending'
      io.emit('status-updated', { id: data.id, status: 'Pending' })
      
      // Broadcast updated counts
      const todayDate = formatDate(new Date())
      io.emit('counts', { 
        todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
        totalCount: concerns.length,
        unreadCount: concerns.filter(c => c.status === 'Unread').length,
        pendingCount: concerns.filter(c => c.status === 'Pending').length,
        completedCount: concerns.filter(c => c.status === 'Completed').length,
      })
      
      console.log(`Concern ${data.id} marked as Pending`)
    }
  })

  // Handle get counts request
  socket.on('get-counts', () => {
    const todayDate = formatDate(new Date())
    socket.emit('counts', { 
      todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
      totalCount: concerns.length,
      unreadCount: concerns.filter(c => c.status === 'Unread').length,
      pendingCount: concerns.filter(c => c.status === 'Pending').length,
      completedCount: concerns.filter(c => c.status === 'Completed').length,
    })
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Concern WebSocket service running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down server...')
  httpServer.close(() => {
    console.log('Concern WebSocket server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down server...')
  httpServer.close(() => {
    console.log('Concern WebSocket server closed')
    process.exit(0)
  })
})
