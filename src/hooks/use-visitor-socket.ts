'use client'

import { useCallback, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { VisitorType, ConcernType, Attachment } from '@/types/concern'

let socket: Socket | null = null

interface ConcernSubmissionData {
  fullName: string
  visitorType: VisitorType
  organization: string
  contactNumber: string
  email: string
  concernType: ConcernType
  concernDetails: string
  additionalNotes: string
  attachments: Attachment[]
}

export function useVisitorSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!socketRef.current) {
      // In development, use XTransformPort for gateway routing
      // In production, connect directly
      const isDev = process.env.NODE_ENV === 'development'
      
      const socketOptions: Record<string, unknown> = {
        path: '/',
        transports: ['websocket', 'polling'],
      }
      
      if (isDev) {
        socketOptions.query = { XTransformPort: '3003' }
      }

      socketRef.current = io('/', socketOptions)
      socket = socketRef.current
    }

    return () => {
      // Keep connection alive
    }
  }, [])

  const submitConcern = useCallback(async (data: ConcernSubmissionData): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        const isDev = process.env.NODE_ENV === 'development'
        
        const socketOptions: Record<string, unknown> = {
          path: '/',
          transports: ['websocket', 'polling'],
        }
        
        if (isDev) {
          socketOptions.query = { XTransformPort: '3003' }
        }

        socketRef.current = io('/', socketOptions)
        socket = socketRef.current
      }

      const currentSocket = socketRef.current

      if (!currentSocket.connected) {
        currentSocket.once('connect', () => {
          currentSocket.emit('submit-concern', data)
          resolve()
        })
        currentSocket.once('connect_error', (error) => {
          reject(error)
        })
      } else {
        currentSocket.emit('submit-concern', data)
        resolve()
      }
    })
  }, [])

  return { submitConcern }
}
