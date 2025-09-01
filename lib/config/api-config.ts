// API Update Configuration
export const API_CONFIG = {
  // Update rate in milliseconds (5 seconds = 5000ms)
  UPDATE_RATE: 5 * 1000,
  
  // Trending tokens update rate (same as update rate for now)
  TRENDING_UPDATE_RATE: 5 * 1000,
  
  // Cache durations (keep existing)
  BIRDEYE_CACHE_DURATION: 60 * 60 * 1000, // 1 hour
  TOKEN_DATA_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const

// Helper to get update rates
export const getUpdateRate = () => API_CONFIG.UPDATE_RATE
export const getTrendingUpdateRate = () => API_CONFIG.TRENDING_UPDATE_RATE