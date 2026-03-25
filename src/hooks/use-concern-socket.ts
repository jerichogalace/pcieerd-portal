'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useConcernStore } from '@/store/concern-store'
import { Concern, ConcernStatus } from '@/types/concern'

// Callback set for new concern notifications
const newConcernCallbacks = new Set<(concern: Concern) => void>()

export function useConcernSocket() {
  const { setConcerns, removeConcern, updateStatus, updateCounts } = useConcernStore()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchTimeRef = useRef<string>('')

  // Fetch initial data from API
  const fetchConcerns = useCallback(async () => {
    try {
      const response = await fetch('/api/concern')
      const data = await response.json()
      
      if (data.success && data.concerns) {
        // Convert date strings back to Date objects
        const concerns: Concern[] = data.concerns.map((c: Concern) => ({
          ...c,
          createdAt: new Date(c.createdAt)
        }))
        
        // Check for new concerns (for notification)
        const lastFetchTime = lastFetchTimeRef.current
        if (lastFetchTime) {
          const newConcern = concerns.find(c => 
            c.createdAt.toISOString() > lastFetchTime
          )
          if (newConcern) {
            // Notify all registered callbacks
            newConcernCallbacks.forEach(callback => callback(newConcern))
          }
        }
        
        // Update last fetch time
        if (concerns.length > 0) {
          lastFetchTimeRef.current = concerns[0].createdAt.toISOString()
        }
        
        setConcerns(concerns)
      }
    } catch (error) {
      console.error('[API] Error fetching concerns:', error)
    }
  }, [setConcerns])

  // Fetch counts from API
  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/concerns/counts')
      const data = await response.json()
      
      if (data.success && data.counts) {
        updateCounts(data.counts)
      }
    } catch (error) {
      console.error('[API] Error fetching counts:', error)
    }
  }, [updateCounts])

  // Connect: fetch initial data and start polling
  const connect = useCallback(() => {
    // Initial fetch
    fetchConcerns()
    fetchCounts()
    
    // Start polling every 5 seconds for updates
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        fetchConcerns()
        fetchCounts()
      }, 5000)
    }
  }, [fetchConcerns, fetchCounts])

  // Disconnect: stop polling
  const disconnect = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    lastFetchTimeRef.current = ''
  }, [])

  // Delete concern via API (permanent delete from database)
  const deleteConcern = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/concern/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      if (data.success) {
        // Remove from local store
        removeConcern(id)
        // Refresh counts
        fetchCounts()
        console.log(`[API] Concern deleted: ${id}`)
        return true
      } else {
        console.error('[API] Delete failed:', data.error)
        return false
      }
    } catch (error) {
      console.error('[API] Error deleting concern:', error)
      return false
    }
  }, [removeConcern, fetchCounts])

  // Update concern status via API
  const updateConcernStatus = useCallback(async (id: string, status: ConcernStatus): Promise<boolean> => {
    try {
      const response = await fetch(`/api/concern/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()
      
      if (data.success) {
        // Update local store
        updateStatus(id, status)
        // Refresh counts
        fetchCounts()
        console.log(`[API] Status updated: ${id} -> ${status}`)
        return true
      } else {
        console.error('[API] Status update failed:', data.error)
        return false
      }
    } catch (error) {
      console.error('[API] Error updating status:', error)
      return false
    }
  }, [updateStatus, fetchCounts])

  // Mark as pending (same as update status)
  const markAsPending = useCallback((id: string) => {
    return updateConcernStatus(id, 'Pending')
  }, [updateConcernStatus])

  // Get counts (alias for fetchCounts)
  const getCounts = useCallback(() => {
    fetchCounts()
  }, [fetchCounts])

  // Register callback for new concerns
  const onNewConcern = useCallback((callback: (concern: Concern) => void) => {
    newConcernCallbacks.add(callback)
    return () => {
      newConcernCallbacks.delete(callback)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { 
    connect, 
    disconnect, 
    deleteConcern, 
    updateConcernStatus, 
    markAsPending, 
    getCounts, 
    onNewConcern,
    fetchConcerns,
    fetchCounts,
  }
}
