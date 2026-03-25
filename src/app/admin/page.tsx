'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LogOut, 
  Search, 
  Calendar,
  Trash2,
  Eye,
  BellRing,
  X,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Lock,
  CheckCircle2,
  Clock,
  Inbox,
  CheckCircle,
  CalendarDays,
  Loader2,
  UserCircle,
  Image as ImageIcon,
  Paperclip,
  ExternalLink,
  Download,
  Link2,
  Settings,
  KeyRound
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { useConcernStore } from '@/store/concern-store'
import { useConcernSocket } from '@/hooks/use-concern-socket'
import { Concern, ConcernType, ConcernStatus, VisitorType, Attachment, AttachmentType } from '@/types/concern'
import { format } from 'date-fns'

const concernTypeColors: Record<ConcernType, string> = {
  'Inquiry': 'bg-blue-100 text-blue-800',
  'Complaint': 'bg-red-100 text-red-800',
  'Request': 'bg-green-100 text-green-800',
  'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Other': 'bg-gray-100 text-gray-800',
}

const statusColors: Record<ConcernStatus, string> = {
  'Unread': 'bg-amber-100 text-amber-800 border-amber-300',
  'Pending': 'bg-sky-100 text-sky-800 border-sky-300',
  'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

const visitorTypeColors: Record<VisitorType, string> = {
  'PCIEERD Employee': 'bg-purple-100 text-purple-800 border-purple-200',
  'DOST Employee (Other Unit)': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Executive / Management': 'bg-amber-100 text-amber-800 border-amber-200',
  'Government Agency': 'bg-teal-100 text-teal-800 border-teal-200',
  'Private Organization / Company': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Researcher / Partner Institution': 'bg-lime-100 text-lime-800 border-lime-200',
  'Student / Intern': 'bg-pink-100 text-pink-800 border-pink-200',
  'Contractor / Supplier': 'bg-orange-100 text-orange-800 border-orange-200',
  'Visitor / Walk-in Client': 'bg-sky-100 text-sky-800 border-sky-200',
  'Other': 'bg-gray-100 text-gray-800 border-gray-200',
}

// Attachment type colors
const attachmentTypeColors: Record<AttachmentType, string> = {
  'image': 'bg-purple-100 text-purple-800 border-purple-200',
  'file': 'bg-blue-100 text-blue-800 border-blue-200',
  'link': 'bg-green-100 text-green-800 border-green-200',
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Image Viewer Dialog Component
function ImageViewerDialog({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageName 
}: { 
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  imageName: string 
}) {
  const handleDownload = () => {
    if (!imageUrl) return
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = imageName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!imageUrl) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-base truncate flex-1">{imageName}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Attachments Display Component
function AttachmentsDisplay({ 
  attachments,
  onImageView 
}: { 
  attachments: Attachment[]
  onImageView: (url: string, name: string) => void
}) {
  if (!attachments || attachments.length === 0) return null

  const downloadFile = (attachment: Attachment) => {
    if (attachment.type === 'link') {
      window.open(attachment.url, '_blank')
      return
    }
    
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-2">
      <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Attachments ({attachments.length})
      </Label>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${attachmentTypeColors[attachment.type]}`}
          >
            {/* Preview for images */}
            {attachment.type === 'image' && (
              <div 
                className="w-16 h-16 rounded overflow-hidden bg-white shrink-0 cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all"
                onClick={() => onImageView(attachment.url, attachment.name)}
              >
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Icon for files */}
            {attachment.type === 'file' && (
              <div className="w-10 h-10 rounded bg-white flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            )}
            
            {/* Icon for links */}
            {attachment.type === 'link' && (
              <div className="w-10 h-10 rounded bg-white flex items-center justify-center shrink-0">
                <Link2 className="h-5 w-5 text-green-600" />
              </div>
            )}
            
            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{attachment.name}</p>
              {attachment.size && (
                <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-1 shrink-0">
              {attachment.type === 'image' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onImageView(attachment.url, attachment.name)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => downloadFile(attachment)}
              >
                {attachment.type === 'link' ? (
                  <ExternalLink className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mobile Card Component for each concern
function ConcernMobileCard({ 
  concern, 
  isNew, 
  onViewDetails, 
  onMarkCompleted, 
  onDelete,
  onImageView
}: { 
  concern: Concern
  isNew: boolean
  onViewDetails: (concern: Concern) => void
  onMarkCompleted: (id: string) => void
  onDelete: (id: string) => void
  onImageView: (url: string, name: string) => void
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <Card className={`${isNew ? 'bg-green-50 animate-in fade-in duration-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="outline"
                className={`${statusColors[concern.status]} font-medium text-xs`}
              >
                {concern.status === 'Unread' && <Clock className="h-3 w-3 mr-1" />}
                {concern.status === 'Pending' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {concern.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {concern.status}
              </Badge>
              <Badge className={`${concernTypeColors[concern.concernType]} text-xs`}>
                {concern.concernType}
              </Badge>
            </div>
            <p className="font-medium text-base truncate">{concern.fullName}</p>
          </div>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <p className="text-xs">{concern.dateSubmitted} • {concern.timeSubmitted}</p>
          {concern.organization && (
            <p className="truncate text-xs">{concern.organization}</p>
          )}
        </div>

        <div className="flex gap-2">
          {/* View Details Dialog */}
          <Dialog open={detailsOpen} onOpenChange={(open) => setDetailsOpen(open)}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 h-10 text-sm touch-manipulation"
                onClick={() => onViewDetails(concern)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
              <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
                <DialogTitle className="text-lg">Concern Details</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline"
                    className={`${statusColors[concern.status]} font-medium`}
                  >
                    {concern.status === 'Unread' && <Clock className="h-3 w-3 mr-1" />}
                    {concern.status === 'Pending' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {concern.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {concern.status}
                  </Badge>
                </div>
                
                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Full Name</Label>
                    <p className="font-medium text-sm break-words">{concern.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-1">
                      <UserCircle className="h-3 w-3" />
                      Visitor Type
                    </Label>
                    <Badge className={`${visitorTypeColors[concern.visitorType]} text-xs`} variant="outline">
                      {concern.visitorType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Organization</Label>
                    <p className="font-medium text-sm break-words">{concern.organization || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Contact Number</Label>
                    <p className="font-medium text-sm break-words">{concern.contactNumber || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Email</Label>
                    <p className="font-medium text-sm break-all">{concern.email || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Concern Type</Label>
                    <Badge className={concernTypeColors[concern.concernType]}>
                      {concern.concernType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Date & Time Submitted</Label>
                    <p className="font-medium text-sm">{concern.dateSubmitted} at {concern.timeSubmitted}</p>
                  </div>
                </div>
                
                {/* Concern Details */}
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Concern Details
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border max-h-60 overflow-y-auto space-y-3">
                    <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {concern.concernDetails}
                    </p>
                    
                    {/* Attachments inside concern details */}
                    {concern.attachments && concern.attachments.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          Attachments ({concern.attachments.length})
                        </p>
                        <div className="space-y-2">
                          {concern.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className={`flex items-center gap-2 p-2 rounded border bg-white ${attachmentTypeColors[attachment.type]}`}
                            >
                              {attachment.type === 'image' && (
                                <div 
                                  className="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0 cursor-pointer hover:ring-2 hover:ring-purple-400"
                                  onClick={() => onImageView(attachment.url, attachment.name)}
                                >
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name || 'Attachment image'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              {attachment.type === 'file' && (
                                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                              )}
                              {attachment.type === 'link' && (
                                <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center shrink-0">
                                  <Link2 className="h-4 w-4 text-green-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{attachment.name}</p>
                                {attachment.size && (
                                  <p className="text-[10px] opacity-70">{formatFileSize(attachment.size)}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 shrink-0"
                                onClick={() => {
                                  if (attachment.type === 'link') {
                                    window.open(attachment.url, '_blank')
                                  } else if (attachment.type === 'image') {
                                    onImageView(attachment.url, attachment.name)
                                  } else {
                                    const link = document.createElement('a')
                                    link.href = attachment.url
                                    link.download = attachment.name
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                  }
                                }}
                              >
                                {attachment.type === 'link' ? (
                                  <ExternalLink className="h-3 w-3" />
                                ) : attachment.type === 'image' ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional Notes */}
                {concern.additionalNotes && (
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Additional Notes
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-md border max-h-40 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        {concern.additionalNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons Footer */}
              {(concern.status === 'Unread' || concern.status === 'Pending') && (
                <div className="px-4 py-3 border-t bg-gray-50 shrink-0">
                  <Button
                    onClick={() => {
                      onMarkCompleted(concern.id)
                      setDetailsOpen(false)
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 touch-manipulation"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Mark Completed Button */}
          {(concern.status === 'Unread' || concern.status === 'Pending') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 touch-manipulation"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg">Mark as Completed</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    Mark concern from <strong>{concern.fullName}</strong> as completed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onMarkCompleted(concern.id)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  >
                    Mark Completed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                className="h-10 px-3 text-red-500 border-red-200 hover:bg-red-50 touch-manipulation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">Delete Concern</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Delete concern from <strong>{concern.fullName}</strong>? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(concern.id)}
                  className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [newConcernData, setNewConcernData] = useState<Concern | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null)
  
  // PIN change states
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentPinInput, setCurrentPinInput] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false)
  const [pinChangeError, setPinChangeError] = useState('')

  const { isAuthenticated, login, logout, currentPin, setPin: setStorePin } = useAdminStore()
  const { concerns, todayCount, totalCount, unreadCount, pendingCount, completedCount, statusFilter, setStatusFilter, updateStatus } = useConcernStore()
  const { connect, disconnect, deleteConcern, updateConcernStatus, markAsPending, getCounts, onNewConcern } = useConcernSocket()

  // Handle image view
  const handleImageView = useCallback((url: string, name: string) => {
    setViewingImage({ url, name })
    setImageViewerOpen(true)
  }, [])

  // Handle PIN change
  const handleChangePin = () => {
    setPinChangeError('')
    
    if (currentPinInput !== currentPin) {
      setPinChangeError('Current PIN is incorrect')
      return
    }
    
    if (!newPin || newPin.length !== 6) {
      setPinChangeError('New PIN must be 6 digits')
      return
    }
    
    if (newPin !== confirmPin) {
      setPinChangeError('PINs do not match')
      return
    }
    
    setStorePin(newPin)
    setPinChangeSuccess(true)
    
    // Reset after 2 seconds
    setTimeout(() => {
      setSettingsOpen(false)
      setCurrentPinInput('')
      setNewPin('')
      setConfirmPin('')
      setPinChangeSuccess(false)
    }, 1500)
  }

  // Reset PIN change dialog
  const resetPinChange = () => {
    setCurrentPinInput('')
    setNewPin('')
    setConfirmPin('')
    setPinChangeError('')
    setPinChangeSuccess(false)
  }

  // Handle new concern notification
  const handleNewConcern = useCallback((concern: Concern) => {
    setNewConcernData(concern)
    setShowNotification(true)
    const timer = setTimeout(() => {
      setShowNotification(false)
      setNewConcernData(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
      getCounts()
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }

      // Register callback for new concerns
      const unsubscribe = onNewConcern(handleNewConcern)

      return () => {
        disconnect()
        unsubscribe()
      }
    }
  }, [isAuthenticated, connect, disconnect, getCounts, onNewConcern, handleNewConcern])

  // Handle viewing concern details - mark as pending if unread
  const handleViewDetails = useCallback((concern: Concern) => {
    setSelectedConcern(concern)
    setDetailsOpen(true)
    // If the concern is unread, mark it as pending
    if (concern.status === 'Unread') {
      markAsPending(concern.id)
      updateStatus(concern.id, 'Pending')
    }
  }, [markAsPending, updateStatus])

  // Filter concerns based on search, date, and status
  const filteredConcerns = useMemo(() => {
    return concerns.filter(concern => {
      const matchesSearch = searchQuery === '' || 
        concern.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.concernDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.concernType.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDate = selectedDate === '' || 
        concern.dateSubmitted === format(new Date(selectedDate), 'MM/dd/yyyy')

      const matchesStatus = statusFilter === 'All' || concern.status === statusFilter

      return matchesSearch && matchesDate && matchesStatus
    })
  }, [concerns, searchQuery, selectedDate, statusFilter])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    await new Promise(resolve => setTimeout(resolve, 300))

    const success = login(pin)
    if (!success) {
      setError('Invalid PIN. Please try again.')
    }
    setIsLoading(false)
  }

  const handleLogout = () => {
    logout()
    setPin('')
    setError('')
  }

  const handleDelete = (id: string) => {
    deleteConcern(id)
  }

  const handleMarkCompleted = (id: string) => {
    updateConcernStatus(id, 'Completed')
    updateStatus(id, 'Completed')
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedDate('')
    setStatusFilter('All')
  }

  // Handle card click for quick filtering
  const handleCardClick = (filter: ConcernStatus | 'Today' | 'All') => {
    if (filter === 'Today') {
      setStatusFilter('All')
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    } else if (filter === 'All') {
      setStatusFilter('All')
      setSelectedDate('')
    } else {
      setStatusFilter(filter)
      setSelectedDate('')
    }
  }

  // Check if concern is new (highlight effect)
  const isNewConcern = (concern: Concern) => {
    return newConcernData?.id === concern.id
  }

  // Login View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col safe-area-inset">
        <header className="bg-sky-700 text-white py-3 sm:py-4 px-4 shadow-lg sticky top-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
            <Image 
              src="/icon.png" 
              alt="DOST-PCIEERD Logo" 
              width={32} 
              height={32}
              className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 object-contain"
            />
            <div>
              <h1 className="text-base sm:text-xl font-bold">DOST - PCIEERD</h1>
              <p className="text-[10px] sm:text-sm text-sky-100">Admin Portal</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 pb-safe">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center px-4 sm:px-6">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-sky-100 p-3">
                  <Lock className="h-8 w-8 text-sky-700" />
                </div>
              </div>
              <CardTitle className="text-xl">Admin Login</CardTitle>
              <CardDescription className="text-sm">
                Enter your 6-digit PIN to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-sm">PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-12 text-base rounded-lg text-center text-2xl tracking-widest"
                    maxLength={6}
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base bg-sky-700 hover:bg-sky-800 rounded-lg touch-manipulation"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>

        <footer className="bg-gray-100 border-t py-3 sm:py-4 px-4 text-center text-[10px] sm:text-xs text-gray-500 pb-safe">
          <p>© {new Date().getFullYear()} DOST - PCIEERD. All rights reserved.</p>
        </footer>
      </div>
    )
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col safe-area-inset">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-16 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 sm:left-auto sm:right-4 sm:max-w-sm">
          <Card className="border-green-200 bg-green-50 shadow-lg">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <BellRing className="h-5 w-5 text-green-600 animate-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800 text-sm">New Concern Received!</p>
                <p className="text-xs text-green-600 truncate">Check the dashboard for details</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNotification(false)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="bg-sky-700 text-white py-2 sm:py-3 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image 
              src="/icon.png" 
              alt="DOST-PCIEERD Logo" 
              width={28} 
              height={28}
              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 object-contain"
            />
            <div>
              <h1 className="text-sm sm:text-lg font-bold leading-tight">DOST - PCIEERD</h1>
              <p className="text-[10px] sm:text-xs text-sky-100">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <Dialog open={settingsOpen} onOpenChange={(open) => {
              setSettingsOpen(open)
              if (!open) resetPinChange()
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-transparent border-white text-white hover:bg-white/10 h-9 touch-manipulation"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-sky-700" />
                    Change PIN
                  </DialogTitle>
                </DialogHeader>
                
                {pinChangeSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-700 mb-2">PIN Changed!</h3>
                    <p className="text-sm text-gray-500">
                      Your PIN has been successfully updated.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-pin">Current PIN</Label>
                      <Input
                        id="current-pin"
                        type="password"
                        placeholder="Enter current PIN"
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-11 text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-pin">New PIN</Label>
                      <Input
                        id="new-pin"
                        type="password"
                        placeholder="Enter new 6-digit PIN"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-11 text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pin">Confirm New PIN</Label>
                      <Input
                        id="confirm-pin"
                        type="password"
                        placeholder="Confirm new PIN"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-11 text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    
                    {pinChangeError && (
                      <p className="text-sm text-red-500">{pinChangeError}</p>
                    )}
                    
                    <Button
                      onClick={handleChangePin}
                      disabled={currentPinInput.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6}
                      className="w-full h-11 bg-sky-700 hover:bg-sky-800"
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Change PIN
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="bg-transparent border-white text-white hover:bg-white/10 h-9 touch-manipulation"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-safe">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Stats Cards - Clickable */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
            <Card 
              className="border-l-4 border-l-sky-500 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-200"
              onClick={() => handleCardClick('Today')}
            >
              <CardHeader className="p-2 sm:p-4 sm:pb-2">
                <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
                  <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                  Today
                </CardDescription>
                <CardTitle className="text-xl sm:text-3xl text-sky-700">{todayCount}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card 
              className="border-l-4 border-l-violet-500 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-200"
              onClick={() => handleCardClick('All')}
            >
              <CardHeader className="p-2 sm:p-4 sm:pb-2">
                <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  All
                </CardDescription>
                <CardTitle className="text-xl sm:text-3xl text-violet-700">{totalCount}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card 
              className="border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-200"
              onClick={() => handleCardClick('Unread')}
            >
              <CardHeader className="p-2 sm:p-4 sm:pb-2">
                <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
                  <Inbox className="h-3 w-3 sm:h-4 sm:w-4" />
                  Unread
                </CardDescription>
                <CardTitle className="text-xl sm:text-3xl text-amber-700">{unreadCount}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card 
              className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-200 hidden sm:block"
              onClick={() => handleCardClick('Pending')}
            >
              <CardHeader className="p-2 sm:p-4 sm:pb-2">
                <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  Pending
                </CardDescription>
                <CardTitle className="text-xl sm:text-3xl text-blue-700">{pendingCount}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card 
              className="border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-200 hidden sm:block"
              onClick={() => handleCardClick('Completed')}
            >
              <CardHeader className="p-2 sm:p-4 sm:pb-2">
                <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  Completed
                </CardDescription>
                <CardTitle className="text-xl sm:text-3xl text-emerald-700">{completedCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Mobile - Show Pending & Completed below */}
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            <Card 
              className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-200"
              onClick={() => handleCardClick('Pending')}
            >
              <CardHeader className="p-2 sm:p-4 sm:pb-2">
                <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  Pending
                </CardDescription>
                <CardTitle className="text-xl sm:text-3xl text-blue-700">{pendingCount}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card 
              className="border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-200"
              onClick={() => handleCardClick('Completed')}
            >
              <CardHeader className="p-2 sm:p-4 sm:pb-2">
                <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  Completed
                </CardDescription>
                <CardTitle className="text-xl sm:text-3xl text-emerald-700">{completedCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">Filter Concerns</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="flex flex-col gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search name, organization..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 text-base rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-10 h-11 text-base rounded-lg"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value: ConcernStatus | 'All') => setStatusFilter(value)}>
                    <SelectTrigger className="w-[120px] h-11 rounded-lg">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Unread">Unread</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(searchQuery || selectedDate || statusFilter !== 'All') && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="h-11 rounded-lg touch-manipulation"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Concerns List */}
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Submitted Concerns</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {filteredConcerns.length} concern{filteredConcerns.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </div>
                {statusFilter !== 'All' && (
                  <Badge variant="outline" className="text-xs">
                    {statusFilter}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {filteredConcerns.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-base sm:text-lg font-medium">No concerns found</p>
                  <p className="text-xs sm:text-sm">
                    {searchQuery || selectedDate || statusFilter !== 'All'
                      ? 'Try adjusting your filters' 
                      : 'New concerns will appear here'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="flex flex-col gap-3 lg:hidden">
                    {filteredConcerns.map((concern) => (
                      <ConcernMobileCard
                        key={concern.id}
                        concern={concern}
                        isNew={isNewConcern(concern)}
                        onViewDetails={handleViewDetails}
                        onMarkCompleted={handleMarkCompleted}
                        onDelete={handleDelete}
                        onImageView={handleImageView}
                      />
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <ScrollArea className="h-[500px] hidden lg:block">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white">
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap">Time</TableHead>
                            <TableHead className="whitespace-nowrap">Name</TableHead>
                            <TableHead className="whitespace-nowrap">Visitor Type</TableHead>
                            <TableHead className="whitespace-nowrap">Organization</TableHead>
                            <TableHead className="whitespace-nowrap">Contact</TableHead>
                            <TableHead className="whitespace-nowrap">Type</TableHead>
                            <TableHead className="whitespace-nowrap">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredConcerns.map((concern) => (
                            <TableRow 
                              key={concern.id} 
                              className={`group transition-all duration-300 ${
                                isNewConcern(concern) 
                                  ? 'bg-green-50 animate-in fade-in duration-500' 
                                  : ''
                              }`}
                            >
                              <TableCell className="whitespace-nowrap">
                                <Badge 
                                  variant="outline"
                                  className={`${statusColors[concern.status]} font-medium`}
                                >
                                  {concern.status === 'Unread' && <Clock className="h-3 w-3 mr-1" />}
                                  {concern.status === 'Pending' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                  {concern.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                  {concern.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                {concern.dateSubmitted}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                {concern.timeSubmitted}
                              </TableCell>
                              <TableCell className="font-medium whitespace-nowrap">
                                {concern.fullName}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge className={visitorTypeColors[concern.visitorType]} variant="outline">
                                  {concern.visitorType}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                {concern.organization || '-'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                <div className="flex flex-col gap-0.5">
                                  {concern.contactNumber && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {concern.contactNumber}
                                    </span>
                                  )}
                                  {concern.email && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Mail className="h-3 w-3" />
                                      {concern.email}
                                    </span>
                                  )}
                                  {!concern.contactNumber && !concern.email && '-'}
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge className={concernTypeColors[concern.concernType]}>
                                  {concern.concernType}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {/* View Details */}
                                  <Dialog open={detailsOpen && selectedConcern?.id === concern.id} onOpenChange={(open) => {
                                    setDetailsOpen(open)
                                    if (!open) setSelectedConcern(null)
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleViewDetails(concern)}
                                        title="View Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                                      <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
                                        <DialogTitle>Concern Details</DialogTitle>
                                      </DialogHeader>
                                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                        <div className="flex items-center gap-2">
                                          <Badge 
                                            variant="outline"
                                            className={`${statusColors[concern.status]} font-medium`}
                                          >
                                            {concern.status === 'Unread' && <Clock className="h-3 w-3 mr-1" />}
                                            {concern.status === 'Pending' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                            {concern.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                            {concern.status}
                                          </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide">Full Name</Label>
                                            <p className="font-medium break-words">{concern.fullName}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-1">
                                              <UserCircle className="h-3 w-3" />
                                              Visitor Type
                                            </Label>
                                            <Badge className={visitorTypeColors[concern.visitorType]} variant="outline">
                                              {concern.visitorType}
                                            </Badge>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide">Organization</Label>
                                            <p className="font-medium break-words">{concern.organization || '-'}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide">Contact Number</Label>
                                            <p className="font-medium break-words">{concern.contactNumber || '-'}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide">Email</Label>
                                            <p className="font-medium break-all">{concern.email || '-'}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide">Concern Type</Label>
                                            <Badge className={concernTypeColors[concern.concernType]}>
                                              {concern.concernType}
                                            </Badge>
                                          </div>
                                          <div className="col-span-2 space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide">Date & Time Submitted</Label>
                                            <p className="font-medium">{concern.dateSubmitted} at {concern.timeSubmitted}</p>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Concern Details
                                          </Label>
                                          <div className="p-3 bg-gray-50 rounded-md border max-h-64 overflow-y-auto space-y-3">
                                            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                              {concern.concernDetails}
                                            </p>
                                            
                                            {/* Attachments inside concern details */}
                                            {concern.attachments && concern.attachments.length > 0 && (
                                              <div className="pt-2 border-t">
                                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                                  <Paperclip className="h-3 w-3" />
                                                  Attachments ({concern.attachments.length})
                                                </p>
                                                <div className="space-y-2">
                                                  {concern.attachments.map((attachment) => (
                                                    <div
                                                      key={attachment.id}
                                                      className={`flex items-center gap-2 p-2 rounded border bg-white ${attachmentTypeColors[attachment.type]}`}
                                                    >
                                                      {attachment.type === 'image' && (
                                                        <div 
                                                          className="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0 cursor-pointer hover:ring-2 hover:ring-purple-400"
                                                          onClick={() => handleImageView(attachment.url, attachment.name)}
                                                        >
                                                          <img
                                                            src={attachment.url}
                                                            alt={attachment.name || 'Attachment image'}
                                                            className="w-full h-full object-cover"
                                                          />
                                                        </div>
                                                      )}
                                                      {attachment.type === 'file' && (
                                                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                                                          <FileText className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                      )}
                                                      {attachment.type === 'link' && (
                                                        <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center shrink-0">
                                                          <Link2 className="h-4 w-4 text-green-600" />
                                                        </div>
                                                      )}
                                                      <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate">{attachment.name}</p>
                                                        {attachment.size && (
                                                          <p className="text-[10px] opacity-70">{formatFileSize(attachment.size)}</p>
                                                        )}
                                                      </div>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 shrink-0"
                                                        onClick={() => {
                                                          if (attachment.type === 'link') {
                                                            window.open(attachment.url, '_blank')
                                                          } else if (attachment.type === 'image') {
                                                            handleImageView(attachment.url, attachment.name)
                                                          } else {
                                                            const link = document.createElement('a')
                                                            link.href = attachment.url
                                                            link.download = attachment.name
                                                            document.body.appendChild(link)
                                                            link.click()
                                                            document.body.removeChild(link)
                                                          }
                                                        }}
                                                      >
                                                        {attachment.type === 'link' ? (
                                                          <ExternalLink className="h-3 w-3" />
                                                        ) : attachment.type === 'image' ? (
                                                          <Eye className="h-3 w-3" />
                                                        ) : (
                                                          <Download className="h-3 w-3" />
                                                        )}
                                                      </Button>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {concern.additionalNotes && (
                                          <div className="space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-2">
                                              <FileText className="h-4 w-4" />
                                              Additional Notes
                                            </Label>
                                            <div className="p-3 bg-gray-50 rounded-md border max-h-48 overflow-y-auto">
                                              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                                {concern.additionalNotes}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {(concern.status === 'Unread' || concern.status === 'Pending') && (
                                        <div className="px-6 py-4 border-t bg-gray-50 shrink-0">
                                          <Button
                                            onClick={() => {
                                              handleMarkCompleted(concern.id)
                                              setDetailsOpen(false)
                                              setSelectedConcern(null)
                                            }}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                                          >
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Mark as Completed
                                          </Button>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>

                                  {/* Mark as Completed Button */}
                                  {(concern.status === 'Unread' || concern.status === 'Pending') && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                          title="Mark as Completed"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Mark as Completed</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Mark concern from <strong>{concern.fullName}</strong> as completed?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleMarkCompleted(concern.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                          >
                                            Mark Completed
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}

                                  {/* Delete Button */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        title="Delete Concern"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Concern</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Delete concern from <strong>{concern.fullName}</strong>? This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(concern.id)}
                                          className="bg-red-500 hover:bg-red-600"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-3 sm:py-4 px-4 text-center text-[10px] sm:text-xs text-gray-500 pb-safe">
        <p>© {new Date().getFullYear()} DOST - PCIEERD. All rights reserved.</p>
      </footer>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        isOpen={imageViewerOpen}
        onClose={() => {
          setImageViewerOpen(false)
          setViewingImage(null)
        }}
        imageUrl={viewingImage?.url || null}
        imageName={viewingImage?.name || ''}
      />
    </div>
  )
}
