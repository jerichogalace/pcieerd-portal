import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/socket.io',
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

// Helper to broadcast counts
const broadcastCounts = () => {
  const todayDate = formatDate(new Date())
  io.emit('counts', { 
    todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
    totalCount: concerns.length,
    unreadCount: concerns.filter(c => c.status === 'Unread').length,
    pendingCount: concerns.filter(c => c.status === 'Pending').length,
    completedCount: concerns.filter(c => c.status === 'Completed').length,
  })
}

// Helper to add a new concern
const addConcern = (data: Omit<Concern, 'id' | 'dateSubmitted' | 'timeSubmitted' | 'createdAt' | 'status'>): Concern => {
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
  broadcastCounts()
  
  console.log(`New concern submitted by ${newConcern.fullName} at ${newConcern.timeSubmitted} PH Time with ${newConcern.attachments.length} attachments`)
  
  return newConcern
}

// HTTP request handler for API calls
const handleHttpRequest = async (req: IncomingMessage, res: ServerResponse) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  const url = req.url || '/'
  
  // Handle POST /api/concern - submit new concern
  if (req.method === 'POST' && url === '/api/concern') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        const newConcern = addConcern(data)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, concern: newConcern }))
      } catch (error) {
        console.error('Error parsing request:', error)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }))
      }
    })
    return
  }
  
  // Handle GET /api/concerns - get all concerns
  if (req.method === 'GET' && url === '/api/concerns') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      concerns: concerns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) 
    }))
    return
  }
  
  // Handle GET /api/counts - get counts
  if (req.method === 'GET' && url === '/api/counts') {
    const todayDate = formatDate(new Date())
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
      totalCount: concerns.length,
      unreadCount: concerns.filter(c => c.status === 'Unread').length,
      pendingCount: concerns.filter(c => c.status === 'Pending').length,
      completedCount: concerns.filter(c => c.status === 'Completed').length,
    }))
    return
  }
  
  // Handle POST /api/concern/:id/status - update status
  const statusMatch = url.match(/^\/api\/concern\/([^/]+)\/status$/)
  if (req.method === 'POST' && statusMatch) {
    const concernId = statusMatch[1]
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const { status } = JSON.parse(body)
        const concern = concerns.find(c => c.id === concernId)
        if (concern) {
          concern.status = status
          io.emit('status-updated', { id: concernId, status })
          broadcastCounts()
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: false, error: 'Concern not found' }))
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }))
      }
    })
    return
  }
  
  // Handle DELETE /api/concern/:id - delete concern
  const deleteMatch = url.match(/^\/api\/concern\/([^/]+)$/)
  if (req.method === 'DELETE' && deleteMatch) {
    const concernId = deleteMatch[1]
    const index = concerns.findIndex(c => c.id === concernId)
    if (index !== -1) {
      concerns.splice(index, 1)
      io.emit('concern-deleted', { id: concernId })
      broadcastCounts()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: 'Concern not found' }))
    }
    return
  }
  
  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

// Handle socket.io upgrade requests
httpServer.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/socket.io')) {
    // Let socket.io handle the upgrade
    io.engine.handleUpgrade(req, socket, head)
  }
})

// Handle regular HTTP requests
httpServer.on('request', (req, res) => {
  if (!req.url?.startsWith('/socket.io')) {
    handleHttpRequest(req, res)
  }
})

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Send existing concerns to newly connected client (admin)
  socket.emit('initial-concerns', { concerns: concerns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) })

  // Send current counts
  broadcastCounts()

  // Handle new concern submission from visitor form (still support WebSocket)
  socket.on('submit-concern', (data: Omit<Concern, 'id' | 'dateSubmitted' | 'timeSubmitted' | 'createdAt' | 'status'>) => {
    addConcern(data)
    socket.emit('concern-submitted', { success: true })
  })

  // Handle delete concern
  socket.on('delete-concern', (data: { id: string }) => {
    const index = concerns.findIndex(c => c.id === data.id)
    if (index !== -1) {
      concerns.splice(index, 1)
      io.emit('concern-deleted', { id: data.id })
      broadcastCounts()
      console.log(`Concern ${data.id} deleted`)
    }
  })

  // Handle update concern status
  socket.on('update-status', (data: { id: string; status: ConcernStatus }) => {
    const concern = concerns.find(c => c.id === data.id)
    if (concern) {
      concern.status = data.status
      io.emit('status-updated', { id: data.id, status: data.status })
      broadcastCounts()
      console.log(`Concern ${data.id} status updated to ${data.status}`)
    }
  })

  // Handle mark as pending (when admin views details)
  socket.on('mark-pending', (data: { id: string }) => {
    const concern = concerns.find(c => c.id === data.id)
    if (concern && concern.status === 'Unread') {
      concern.status = 'Pending'
      io.emit('status-updated', { id: data.id, status: 'Pending' })
      broadcastCounts()
      console.log(`Concern ${data.id} marked as Pending`)
    }
  })

  // Handle get counts request
  socket.on('get-counts', () => {
    broadcastCounts()
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
  console.log(`Concern service running on port ${PORT}`)
  console.log(`- WebSocket: ws://localhost:${PORT}/socket.io`)
  console.log(`- HTTP API: http://localhost:${PORT}/api/concern`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down server...')
  httpServer.close(() => {
    console.log('Concern server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down server...')
  httpServer.close(() => {
    console.log('Concern server closed')
    process.exit(0)
  })
})
