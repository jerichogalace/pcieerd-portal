import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  formatDatePH, 
  formatTimePH, 
  transformConcernFromDB,
  serializeAttachments,
  isValidConcernType,
  isValidVisitorType,
} from '@/lib/concern-store'

// POST - Create a new concern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.fullName || typeof body.fullName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Full name is required' },
        { status: 400 }
      )
    }

    if (!body.concernDetails || typeof body.concernDetails !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Concern details are required' },
        { status: 400 }
      )
    }

    // Validate concern type
    if (!body.concernType || !isValidConcernType(body.concernType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid concern type' },
        { status: 400 }
      )
    }

    // Validate visitor type
    if (!body.visitorType || !isValidVisitorType(body.visitorType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visitor type' },
        { status: 400 }
      )
    }

    const now = new Date()
    const dateSubmitted = formatDatePH(now)
    const timeSubmitted = formatTimePH(now)

    // Serialize attachments to JSON string (works for both SQLite and PostgreSQL)
    const attachmentsJson = serializeAttachments(body.attachments || [])

    // Create concern in database
    const newConcern = await db.concern.create({
      data: {
        fullName: body.fullName.trim(),
        visitorType: body.visitorType,
        organization: body.organization?.trim() || '',
        contactNumber: body.contactNumber?.trim() || '',
        email: body.email?.trim() || '',
        concernType: body.concernType,
        concernDetails: body.concernDetails.trim(),
        additionalNotes: body.additionalNotes?.trim() || '',
        attachments: attachmentsJson,
        dateSubmitted,
        timeSubmitted,
        status: 'Unread',
      },
    })

    console.log(`[DB] New concern created: ${newConcern.id} by ${newConcern.fullName}`)

    return NextResponse.json({ 
      success: true, 
      concern: transformConcernFromDB(newConcern as any) 
    })
  } catch (error) {
    console.error('[DB] Error creating concern:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit concern' },
      { status: 500 }
    )
  }
}

// GET - Fetch all concerns sorted by creation date (newest first)
export async function GET() {
  try {
    const concerns = await db.concern.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    const transformedConcerns = concerns.map((c: any) => transformConcernFromDB(c))

    return NextResponse.json({ 
      success: true, 
      concerns: transformedConcerns 
    })
  } catch (error) {
    console.error('[DB] Error fetching concerns:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch concerns' },
      { status: 500 }
    )
  }
}
