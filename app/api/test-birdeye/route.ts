import { BirdeyeAPI } from '@/lib/apis/birdeye'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing Birdeye API from server route')
    const data = await BirdeyeAPI.getHistoricalData('2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv', '1W')
    console.log('Server route got data:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Server route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}