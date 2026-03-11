'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  Building2, CheckCircle2, Phone, Mail, FileText, MessageSquare, 
  ClipboardList, UserCircle, ImageIcon, Paperclip, Link2, X, 
  Upload, File
} from 'lucide-react'
import { useVisitorSocket } from '@/hooks/use-visitor-socket'
import { ConcernType, VisitorType, Attachment, AttachmentType } from '@/types/concern'

const concernTypes: ConcernType[] = ['Inquiry', 'Complaint', 'Request', 'Follow-up', 'Other']
const visitorTypes: VisitorType[] = [
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

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_TOTAL_SIZE = 30 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']

const formSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  visitorType: z.enum([
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
  ] as const),
  organization: z.string().optional(),
  contactNumber: z.string()
    .refine((val) => val === '' || /^\d+$/.test(val), 'Contact number must contain only numbers')
    .optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  concernType: z.enum(['Inquiry', 'Complaint', 'Request', 'Follow-up', 'Other'] as const),
  concernDetails: z.string().min(1, 'Concern details are required'),
  additionalNotes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const generateId = () => Math.random().toString(36).substr(2, 9)

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function VisitorFormPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { submitConcern } = useVisitorSocket()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      visitorType: 'Visitor / Walk-in Client',
      organization: '',
      contactNumber: '',
      email: '',
      concernType: 'Inquiry',
      concernDetails: '',
      additionalNotes: '',
    },
  })

  const concernType = watch('concernType')
  const visitorType = watch('visitorType')

  const handleContactNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setValue('contactNumber', value)
  }

  const getTotalSize = () => attachments.reduce((sum, a) => sum + (a.size || 0), 0)

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAddLink = () => {
    setLinkError('')
    const trimmedLink = linkInput.trim()
    
    if (!trimmedLink) {
      setLinkError('Please enter a URL')
      return
    }
    
    let url = trimmedLink
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    if (!isValidUrl(url)) {
      setLinkError('Please enter a valid URL')
      return
    }
    
    if (attachments.some(a => a.type === 'link' && a.url === url)) {
      setLinkError('This link has already been added')
      return
    }
    
    const newLink: Attachment = {
      id: generateId(),
      type: 'link',
      name: trimmedLink.length > 50 ? trimmedLink.substring(0, 50) + '...' : trimmedLink,
      url: url
    }
    
    setAttachments([...attachments, newLink])
    setLinkInput('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    setUploadError('')
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File "${file.name}" exceeds 10MB limit`)
        continue
      }
      
      if (getTotalSize() + file.size > MAX_TOTAL_SIZE) {
        setUploadError('Total attachment size exceeds 30MB limit')
        break
      }
      
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`File type "${file.type}" is not allowed`)
        continue
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        const newAttachment: Attachment = {
          id: generateId(),
          type: type,
          name: file.name,
          url: base64,
          mimeType: file.type,
          size: file.size
        }
        setAttachments(prev => [...prev, newAttachment])
      }
      reader.readAsDataURL(file)
    }
    
    e.target.value = ''
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id))
  }

  const getAttachmentIcon = (type: AttachmentType) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-3.5 w-3.5" />
      case 'file': return <File className="h-3.5 w-3.5" />
      case 'link': return <Link2 className="h-3.5 w-3.5" />
    }
  }

  const getAttachmentColor = (type: AttachmentType) => {
    switch (type) {
      case 'image': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'file': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'link': return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await submitConcern({
        fullName: data.fullName,
        visitorType: data.visitorType,
        organization: data.organization || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        concernType: data.concernType,
        concernDetails: data.concernDetails,
        additionalNotes: data.additionalNotes || '',
        attachments: attachments,
      })
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting concern:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = () => {
    reset()
    setAttachments([])
    setLinkInput('')
    setLinkError('')
    setUploadError('')
  }

  const handleNewSubmission = () => {
    setIsSubmitted(false)
    reset()
    setAttachments([])
    setLinkInput('')
    setLinkError('')
    setUploadError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      <header className="bg-sky-700 text-white py-3 sm:py-4 px-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/logo.png" 
              alt="PCIEERD Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 object-contain"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-base sm:text-xl font-bold leading-tight">DOST - PCIEERD (EUSTDD)</h1>
              <p className="text-[10px] sm:text-sm text-sky-100">Visitor Concern Form</p>
            </div>
          </div>
        </div>
      </header>

      {isSubmitted ? (
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-green-200 shadow-lg">
            <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-green-700 mb-2">Success!</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 px-2">
                Your concern has been successfully submitted. Thank you.
              </p>
              <Button onClick={handleNewSubmission} className="bg-sky-700 hover:bg-sky-800 h-12 text-base w-full sm:w-auto px-8">
                Submit Another Concern
              </Button>
            </CardContent>
          </Card>
        </main>
      ) : (
        <main className="flex-1 p-3 sm:p-4 py-4 sm:py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg border-sky-100">
              <CardHeader className="bg-sky-50 border-b border-sky-100 px-4 py-4 sm:px-6 sm:py-6">
                <CardTitle className="text-sky-800 flex items-center gap-2 text-lg sm:text-xl">
                  <ClipboardList className="h-5 w-5" />
                  Submit Your Concern
                </CardTitle>
                <CardDescription className="text-sm">
                  Please fill out the form below to submit your concern or inquiry.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700 font-medium text-sm sm:text-base">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="fullName" placeholder="Enter your full name" className="h-11 sm:h-12 text-base rounded-lg" {...register('fullName')} />
                    {errors.fullName && <p className="text-xs sm:text-sm text-red-500">{errors.fullName.message}</p>}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="visitorType" className="text-gray-700 font-medium flex items-center gap-2 text-sm sm:text-base">
                      <UserCircle className="h-4 w-4" />
                      Visitor Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={visitorType} onValueChange={(value: VisitorType) => setValue('visitorType', value)}>
                      <SelectTrigger className="h-11 sm:h-12 text-base rounded-lg">
                        <SelectValue placeholder="Select visitor type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {visitorTypes.map((type) => (
                          <SelectItem key={type} value={type} className="text-base py-3">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="organization" className="text-gray-700 font-medium flex items-center gap-2 text-sm sm:text-base">
                      <Building2 className="h-4 w-4" />
                      Organization / Company
                    </Label>
                    <Input id="organization" placeholder="Enter your organization or company" className="h-11 sm:h-12 text-base rounded-lg" {...register('organization')} />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="contactNumber" className="text-gray-700 font-medium flex items-center gap-2 text-sm sm:text-base">
                      <Phone className="h-4 w-4" />
                      Contact Number
                    </Label>
                    <Input id="contactNumber" placeholder="Enter contact number" type="text" inputMode="numeric" pattern="[0-9]*" className="h-11 sm:h-12 text-base rounded-lg" value={watch('contactNumber') || ''} onChange={handleContactNumberChange} />
                    <p className="text-[10px] sm:text-xs text-gray-500">Numbers only</p>
                    {errors.contactNumber && <p className="text-xs sm:text-sm text-red-500">{errors.contactNumber.message}</p>}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2 text-sm sm:text-base">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input id="email" placeholder="Enter your email address" type="email" className="h-11 sm:h-12 text-base rounded-lg" {...register('email')} />
                    {errors.email && <p className="text-xs sm:text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="concernType" className="text-gray-700 font-medium text-sm sm:text-base">
                      Type of Concern <span className="text-red-500">*</span>
                    </Label>
                    <Select value={concernType} onValueChange={(value: ConcernType) => setValue('concernType', value)}>
                      <SelectTrigger className="h-11 sm:h-12 text-base rounded-lg">
                        <SelectValue placeholder="Select type of concern" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {concernTypes.map((type) => (
                          <SelectItem key={type} value={type} className="text-base py-3">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="concernDetails" className="text-gray-700 font-medium flex items-center gap-2 text-sm sm:text-base">
                      <MessageSquare className="h-4 w-4" />
                      Concern Details <span className="text-red-500">*</span>
                    </Label>
                    
                    <div className="border rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500">
                      <Textarea id="concernDetails" placeholder="Please describe your concern in detail..." className="min-h-[100px] sm:min-h-[120px] text-base resize-none border-0 focus-visible:ring-0 rounded-none" {...register('concernDetails')} />
                      
                      <div className="border-t bg-gray-50/50">
                        <div className="p-2 border-b bg-white">
                          <div className="flex flex-wrap items-center gap-2">
                            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
                            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs px-2 text-purple-700 hover:bg-purple-50" onClick={() => imageInputRef.current?.click()}>
                              <ImageIcon className="h-3.5 w-3.5 mr-1" />Photo
                            </Button>
                            
                            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'file')} />
                            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs px-2 text-blue-700 hover:bg-blue-50" onClick={() => fileInputRef.current?.click()}>
                              <Upload className="h-3.5 w-3.5 mr-1" />File
                            </Button>
                            
                            <div className="flex items-center gap-1 flex-1 min-w-[150px]">
                              <Input placeholder="Paste link..." value={linkInput} onChange={(e) => setLinkInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())} className="h-8 text-xs rounded border-gray-200" />
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-700 hover:bg-green-50" onClick={handleAddLink}>
                                <Link2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          
                          {(linkError || uploadError) && <p className="text-[10px] text-red-500 mt-1">{linkError || uploadError}</p>}
                          <p className="text-[9px] text-gray-400 mt-1">Max 10MB/file, 30MB total • Images, PDF, DOC, XLS, TXT</p>
                        </div>
                        
                        {attachments.length > 0 && (
                          <div className="p-2 space-y-1.5">
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Paperclip className="h-3 w-3" />
                              {attachments.length} attachment{attachments.length !== 1 ? 's' : ''} ({formatFileSize(getTotalSize())})
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {attachments.map((attachment) => (
                                <div key={attachment.id} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${getAttachmentColor(attachment.type)}`}>
                                  {getAttachmentIcon(attachment.type)}
                                  <span className="max-w-[120px] truncate text-[11px]">{attachment.name}</span>
                                  {attachment.size && <span className="text-[9px] opacity-60">{formatFileSize(attachment.size)}</span>}
                                  <button type="button" onClick={() => handleRemoveAttachment(attachment.id)} className="hover:bg-black/10 rounded p-0.5 ml-0.5">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {errors.concernDetails && <p className="text-xs sm:text-sm text-red-500">{errors.concernDetails.message}</p>}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="additionalNotes" className="text-gray-700 font-medium flex items-center gap-2 text-sm sm:text-base">
                      <FileText className="h-4 w-4" />
                      Additional Notes
                    </Label>
                    <Textarea id="additionalNotes" placeholder="Any additional information..." className="min-h-[70px] sm:min-h-[80px] text-base resize-none rounded-lg" {...register('additionalNotes')} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button type="submit" className="flex-1 h-12 text-base bg-sky-700 hover:bg-sky-800 rounded-lg" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Concern'}
                    </Button>
                    <Button type="button" variant="outline" className="flex-1 h-12 text-base rounded-lg" onClick={handleClear}>
                      Clear Form
                    </Button>
                  </div>
                  
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      )}

      <footer className="bg-gray-100 border-t py-3 sm:py-4 px-4 text-center text-[10px] sm:text-xs text-gray-500 mt-auto">
        <p>© {new Date().getFullYear()} DOST - PCIEERD (EUSTDD). All rights reserved.</p>
      </footer>
    </div>
  )
}
