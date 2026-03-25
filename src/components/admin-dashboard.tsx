'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LogOut, 
  Search, 
  Calendar,
  Trash2,
  Eye,
  Bell,
  BellRing,
  X,
  Phone,
  Mail,
  MessageSquare,
  FileText
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { useConcernStore } from '@/store/concern-store'
import { useConcernSocket } from '@/hooks/use-concern-socket'
import { Concern, ConcernType } from '@/types/concern'
import { format } from 'date-fns'

const concernTypeColors: Record<ConcernType, string> = {
  'Inquiry': 'bg-blue-100 text-blue-800',
  'Complaint': 'bg-red-100 text-red-800',
  'Request': 'bg-green-100 text-green-800',
  'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Other': 'bg-gray-100 text-gray-800',
}

interface AdminDashboardProps {
  onBack: () => void
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null)
  const [showNotification, setShowNotification] = useState(false)

  const { logout } = useAdminStore()
  const { concerns, todayCount } = useConcernStore()
  const { connect, disconnect, deleteConcern, getCounts, onNewConcern } = useConcernSocket()

  // Handle new concern notification
  const handleNewConcern = useCallback(() => {
    setShowNotification(true)
    const timer = setTimeout(() => {
      setShowNotification(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
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
  }, [connect, disconnect, getCounts, onNewConcern, handleNewConcern])

  // Filter concerns based on search and date
  const filteredConcerns = useMemo(() => {
    return concerns.filter(concern => {
      const matchesSearch = searchQuery === '' || 
        concern.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.concernDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.concernType.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDate = selectedDate === '' || 
        concern.dateSubmitted === format(new Date(selectedDate), 'MM/dd/yyyy')

      return matchesSearch && matchesDate
    })
  }, [concerns, searchQuery, selectedDate])

  const handleLogout = () => {
    logout()
    onBack()
  }

  const handleDelete = (id: string) => {
    deleteConcern(id)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedDate('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <Card className="border-green-200 bg-green-50 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <BellRing className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">New Concern Received!</p>
                <p className="text-sm text-green-600">Check the dashboard for details</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNotification(false)}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="bg-sky-700 text-white py-3 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/icon.png" 
              alt="DOST-PCIEERD Logo" 
              width={32} 
              height={32}
              className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 object-contain"
            />
            <div>
              <h1 className="text-base sm:text-lg font-bold">DOST - PCIEERD</h1>
              <p className="text-xs text-sky-100">Admin Dashboard</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="bg-transparent border-white text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-sky-500">
              <CardHeader className="pb-2">
                <CardDescription>Today's Concerns</CardDescription>
                <CardTitle className="text-3xl text-sky-700">{todayCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardDescription>Total Concerns</CardDescription>
                <CardTitle className="text-3xl text-green-700">{concerns.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardDescription>Real-time Status</CardDescription>
                <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  Live Updates Active
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Filter Concerns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, organization, or concern..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 h-11 w-full sm:w-auto"
                  />
                </div>
                {(searchQuery || selectedDate) && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="h-11"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Concerns Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submitted Concerns</CardTitle>
              <CardDescription>
                {filteredConcerns.length} concern{filteredConcerns.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredConcerns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No concerns found</p>
                  <p className="text-sm">
                    {searchQuery || selectedDate 
                      ? 'Try adjusting your filters' 
                      : 'New concerns will appear here in real-time'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Time</TableHead>
                          <TableHead className="whitespace-nowrap">Name</TableHead>
                          <TableHead className="whitespace-nowrap hidden md:table-cell">Organization</TableHead>
                          <TableHead className="whitespace-nowrap hidden lg:table-cell">Contact</TableHead>
                          <TableHead className="whitespace-nowrap">Type</TableHead>
                          <TableHead className="whitespace-nowrap hidden xl:table-cell">Details</TableHead>
                          <TableHead className="whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredConcerns.map((concern) => (
                          <TableRow key={concern.id} className="group">
                            <TableCell className="whitespace-nowrap text-sm">
                              {concern.dateSubmitted}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {concern.timeSubmitted}
                            </TableCell>
                            <TableCell className="font-medium whitespace-nowrap">
                              {concern.fullName}
                            </TableCell>
                            <TableCell className="whitespace-nowrap hidden md:table-cell text-sm">
                              {concern.organization || '-'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap hidden lg:table-cell text-sm">
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
                            <TableCell className="hidden xl:table-cell">
                              <p className="text-sm truncate max-w-[200px]" title={concern.concernDetails}>
                                {concern.concernDetails}
                              </p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => setSelectedConcern(concern)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Concern Details</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-gray-500 text-sm">Full Name</Label>
                                          <p className="font-medium">{concern.fullName}</p>
                                        </div>
                                        <div>
                                          <Label className="text-gray-500 text-sm">Organization</Label>
                                          <p className="font-medium">{concern.organization || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-gray-500 text-sm">Contact Number</Label>
                                          <p className="font-medium">{concern.contactNumber || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-gray-500 text-sm">Email</Label>
                                          <p className="font-medium">{concern.email || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-gray-500 text-sm">Concern Type</Label>
                                          <p>
                                            <Badge className={concernTypeColors[concern.concernType]}>
                                              {concern.concernType}
                                            </Badge>
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-gray-500 text-sm">Submitted</Label>
                                          <p className="font-medium">{concern.dateSubmitted} at {concern.timeSubmitted}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-gray-500 text-sm flex items-center gap-2">
                                          <MessageSquare className="h-4 w-4" />
                                          Concern Details
                                        </Label>
                                        <p className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full">
                                          {concern.concernDetails}
                                        </p>
                                      </div>
                                      {concern.additionalNotes && (
                                        <div>
                                          <Label className="text-gray-500 text-sm flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Additional Notes
                                          </Label>
                                          <p className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full">
                                            {concern.additionalNotes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Concern</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this concern from <strong>{concern.fullName}</strong>? 
                                        This action cannot be undone.
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
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-4 px-4 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} DOST - PCIEERD. All rights reserved.</p>
      </footer>
    </div>
  )
}
