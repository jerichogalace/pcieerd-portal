import { create } from 'zustand'
import { Concern, ConcernStatus } from '@/types/concern'

interface ConcernState {
  concerns: Concern[]
  todayCount: number
  totalCount: number
  unreadCount: number
  pendingCount: number
  completedCount: number
  statusFilter: ConcernStatus | 'All'
  setConcerns: (concerns: Concern[]) => void
  addConcern: (concern: Concern) => void
  removeConcern: (id: string) => void
  updateStatus: (id: string, status: ConcernStatus) => void
  setStatusFilter: (filter: ConcernStatus | 'All') => void
  setCounts: (counts: { todayCount: number; totalCount: number; unreadCount: number; pendingCount: number; completedCount: number }) => void
}

export const useConcernStore = create<ConcernState>((set, get) => ({
  concerns: [],
  todayCount: 0,
  totalCount: 0,
  unreadCount: 0,
  pendingCount: 0,
  completedCount: 0,
  statusFilter: 'All',
  
  setConcerns: (concerns) => set({ 
    concerns,
    totalCount: concerns.length,
    unreadCount: concerns.filter(c => c.status === 'Unread').length,
    pendingCount: concerns.filter(c => c.status === 'Pending').length,
    completedCount: concerns.filter(c => c.status === 'Completed').length,
  }),
  
  addConcern: (concern) => {
    const current = get()
    const todayStr = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
    
    set({ 
      concerns: [concern, ...current.concerns],
      totalCount: current.totalCount + 1,
      unreadCount: current.unreadCount + 1,
      todayCount: current.concerns.filter(c => c.dateSubmitted === todayStr).length + 1,
    })
  },
  
  removeConcern: (id) => {
    const current = get()
    const concern = current.concerns.find(c => c.id === id)
    if (!concern) return
    
    set({ 
      concerns: current.concerns.filter(c => c.id !== id),
      totalCount: current.totalCount - 1,
      unreadCount: concern.status === 'Unread' ? current.unreadCount - 1 : current.unreadCount,
      pendingCount: concern.status === 'Pending' ? current.pendingCount - 1 : current.pendingCount,
      completedCount: concern.status === 'Completed' ? current.completedCount - 1 : current.completedCount,
    })
  },
  
  updateStatus: (id, newStatus) => {
    const current = get()
    const concern = current.concerns.find(c => c.id === id)
    if (!concern) return
    
    const oldStatus = concern.status
    const updatedConcerns = current.concerns.map(c => 
      c.id === id ? { ...c, status: newStatus } : c
    )
    
    let unreadCount = current.unreadCount
    let pendingCount = current.pendingCount
    let completedCount = current.completedCount
    
    if (oldStatus === 'Unread') unreadCount--
    if (oldStatus === 'Pending') pendingCount--
    if (oldStatus === 'Completed') completedCount--
    
    if (newStatus === 'Unread') unreadCount++
    if (newStatus === 'Pending') pendingCount++
    if (newStatus === 'Completed') completedCount++
    
    set({
      concerns: updatedConcerns,
      unreadCount,
      pendingCount,
      completedCount,
    })
  },
  
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  
  setCounts: (counts) => set({ 
    todayCount: counts.todayCount,
    totalCount: counts.totalCount,
    unreadCount: counts.unreadCount,
    pendingCount: counts.pendingCount,
    completedCount: counts.completedCount,
  }),
}))
