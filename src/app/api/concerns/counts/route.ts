import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formatDatePH } from '@/lib/concern-store'

// GET - Fetch concern counts (today, total, unread, pending, completed)
export async function GET() {
  try {
    // Get today's date in Philippine timezone
    const todayDate = formatDatePH(new Date())

    // Run all count queries in parallel for better performance
    const [
      todayCount,
      totalCount,
      unreadCount,
      pendingCount,
      completedCount,
    ] = await Promise.all([
      // Today's concerns count
      db.concern.count({
        where: { dateSubmitted: todayDate },
      }),
      // Total concerns count
      db.concern.count(),
      // Unread count
      db.concern.count({
        where: { status: 'Unread' },
      }),
      // Pending count
      db.concern.count({
        where: { status: 'Pending' },
      }),
      // Completed count
      db.concern.count({
        where: { status: 'Completed' },
      }),
    ])

    return NextResponse.json({
      success: true,
      counts: {
        todayCount,
        totalCount,
        unreadCount,
        pendingCount,
        completedCount,
      },
    })
  } catch (error) {
    console.error('[DB] Error fetching counts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch counts' },
      { status: 500 }
    )
  }
}
