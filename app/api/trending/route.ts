import { NextResponse } from 'next/server'
import { TrendingAPI } from '@/lib/apis/trending'

// Force dynamic rendering - disable static optimization and caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const trendingTokens = await TrendingAPI.getTrendingTokens()
    
    return NextResponse.json({
      success: true,
      data: trendingTokens
    })
    
  } catch (error) {
    console.error('Trending API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trending tokens'
    }, { status: 500 })
  }
}