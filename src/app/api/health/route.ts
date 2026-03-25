import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'

// Health check endpoint for monitoring and Render deployment
export async function GET() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection()
    
    if (!dbConnected) {
      return NextResponse.json(
        { 
          status: 'unhealthy',
          message: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json({
      status: 'healthy',
      message: 'System operational',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Health] Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
