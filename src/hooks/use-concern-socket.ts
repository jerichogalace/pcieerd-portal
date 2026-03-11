'use client'

import { useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useConcernStore } from '@/store/concern-store'
import { Concern, ConcernStatus } from '@/types/concern'

let socket: Socket | null = null
const newConcernCallbacks = new Set<(concern: Concern) => void>()

export function useConcernSocket() {
  const { setConcerns, addConcern, removeConcern, updateStatus, setCounts } = useConcernStore()
  const callbacksRef = useRef(newConcernCallbacks)

  const connect = useCallback(() => {
    if (!socket) {
      // In development, use XTransformPort for gateway routing
      // In production, connect directly
      const isDev = process.env.NODE_ENV === 'development'
      
      const socketOptions: Record<string, unknown> = {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      }
      
      if (isDev) {
        socketOptions.query = { XTransformPort: '3003' }
      }

      socket = io('/', socketOptions)

      socket.on('connect', () => {
        console.log('Connected to concern service')
        socket?.emit('get-counts')
      })

      socket.on('initial-concerns', (data: { concerns: Concern[] }) => {
        console.log('Received initial concerns:', data.concerns.length)
        const concerns = data.concerns.map(c => ({
          ...c,
          createdAt: new Date(c.createdAt)
        }))
        setConcerns(concerns)
      })

      socket.on('counts', (data: { todayCount: number; totalCount: number; unreadCount: number; pendingCount: number; completedCount: number }) => {
        console.log('Received counts:', data)
        setCounts(data)
      })

      socket.on('new-concern', (data: { concern: Concern }) => {
        console.log('Received new concern:', data.concern.fullName)
        const concern = {
          ...data.concern,
          createdAt: new Date(data.concern.createdAt)
        }
        addConcern(concern)
        callbacksRef.current.forEach(callback => callback(concern))
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Concern Submitted', {
            body: `${data.concern.fullName}: ${data.concern.concernType}`,
          })
        }
      })

      socket.on('concern-deleted', (data: { id: string }) => {
        removeConcern(data.id)
      })

      socket.on('status-updated', (data: { id: string; status: ConcernStatus }) => {
        updateStatus(data.id, data.status)
      })

      socket.on('disconnect', () => {
        console.log('Disconnected from concern service')
      })
    }
    return socket
  }, [setConcerns, addConcern, removeConcern, updateStatus, setCounts])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }, [])

  const deleteConcern = useCallback((id: string) => {
    if (socket) {
      socket.emit('delete-concern', { id })
    }
  }, [])

  const updateConcernStatus = useCallback((id: string, status: ConcernStatus) => {
    if (socket) {
      socket.emit('update-status', { id, status })
    }
  }, [])

  const markAsPending = useCallback((id: string) => {
    if (socket) {
      socket.emit('mark-pending', { id })
    }
  }, [])

  const getCounts = useCallback(() => {
    if (socket) {
      socket.emit('get-counts')
    }
  }, [])

  const onNewConcern = useCallback((callback: (concern: Concern) => void) => {
    callbacksRef.current.add(callback)
    return () => {
      callbacksRef.current.delete(callback)
    }
  }, [])

  return { connect, disconnect, deleteConcern, updateConcernStatus, markAsPending, getCounts, onNewConcern }
}
