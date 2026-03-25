import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transformConcernFromDB } from '@/lib/concern-store'

// GET - Fetch a single concern by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Concern ID is required' },
        { status: 400 }
      )
    }

    const concern = await db.concern.findUnique({
      where: { id },
    })

    if (!concern) {
      return NextResponse.json(
        { success: false, error: 'Concern not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      concern: transformConcernFromDB(concern as any),
    })
  } catch (error) {
    console.error('[DB] Error fetching concern:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch concern' },
      { status: 500 }
    )
  }
}

// DELETE - Permanently delete a concern from the database
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Concern ID is required' },
        { status: 400 }
      )
    }

    // Check if concern exists first
    const existingConcern = await db.concern.findUnique({
      where: { id },
      select: { id: true, fullName: true },
    })

    if (!existingConcern) {
      return NextResponse.json(
        { success: false, error: 'Concern not found' },
        { status: 404 }
      )
    }

    // Permanently delete from database (no soft delete)
    await db.concern.delete({
      where: { id },
    })

    console.log(`[DB] Concern deleted permanently: ${id} (${existingConcern.fullName})`)

    return NextResponse.json({
      success: true,
      message: 'Concern permanently deleted from database',
      deletedId: id,
    })
  } catch (error) {
    console.error('[DB] Error deleting concern:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete concern' },
      { status: 500 }
    )
  }
}
