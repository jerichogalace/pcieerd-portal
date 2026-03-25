import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transformConcernFromDB, isValidConcernStatus } from '@/lib/concern-store'

// PATCH - Update concern status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Concern ID is required' },
        { status: 400 }
      )
    }

    // Validate status
    if (!status || !isValidConcernStatus(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be Unread, Pending, or Completed' },
        { status: 400 }
      )
    }

    // Check if concern exists
    const existingConcern = await db.concern.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingConcern) {
      return NextResponse.json(
        { success: false, error: 'Concern not found' },
        { status: 404 }
      )
    }

    // Update status in database
    const updatedConcern = await db.concern.update({
      where: { id },
      data: { status },
    })

    console.log(`[DB] Concern ${id} status updated to ${status}`)

    return NextResponse.json({
      success: true,
      concern: transformConcernFromDB(updatedConcern),
    })
  } catch (error) {
    console.error('[DB] Error updating concern status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    )
  }
}

// POST - Also support POST for status updates (backward compatibility)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params })
}
