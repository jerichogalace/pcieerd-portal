import { NextResponse } from 'next/server'

// Simple API root endpoint
export async function GET() {
  return NextResponse.json({ 
    name: 'DOST-PCIEERD Concern Management System API',
    version: '1.0.0',
    endpoints: {
      concerns: '/api/concern',
      counts: '/api/concerns/counts',
      health: '/api/health'
    }
  })
}
