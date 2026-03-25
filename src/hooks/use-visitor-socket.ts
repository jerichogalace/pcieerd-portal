'use client'

import { useCallback } from 'react'
import { VisitorType, ConcernType, Attachment } from '@/types/concern'

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
  const submitConcern = useCallback(async (data: ConcernSubmissionData): Promise<void> => {
    try {
      const response = await fetch('/api/concern', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit concern')
      }
      
      console.log('Concern submitted successfully:', result.concern)
    } catch (error) {
      console.error('Error submitting concern:', error)
      throw error
    }
  }, [])

  return { submitConcern }
}
