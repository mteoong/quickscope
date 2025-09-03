export interface DebugContext {
  module: string
  operation: string
  identifier?: string
  startTime?: number
}

export interface DebugError {
  error: unknown
  context: DebugContext
  duration?: number
}

export interface DebugResponse {
  status?: number
  statusText?: string
  data?: any
  headers?: Record<string, string>
  size?: number
}

export class DebugLogger {
  private static activeGroups = new Set<string>()

  static startOperation(context: DebugContext): DebugContext {
    const groupName = `🔍 [${context.module.toUpperCase()}] ${context.operation}`
    const fullGroupName = context.identifier ? `${groupName} for ${context.identifier}` : groupName
    
    console.group(fullGroupName)
    this.activeGroups.add(fullGroupName)
    
    return {
      ...context,
      startTime: performance.now()
    }
  }

  static logParameters(params: Record<string, any>): void {
    console.log('📋 Request Parameters:')
    Object.entries(params).forEach(([key, value]) => {
      console.log(`  • ${key}: ${this.formatValue(value)}`)
    })
  }

  static logRequest(url: string, options: RequestInit, payload?: any): void {
    console.log('📤 Request Details:')
    console.log(`  • URL: ${url}`)
    console.log(`  • Method: ${options.method || 'GET'}`)
    console.log(`  • Headers:`, options.headers)
    
    if (payload) {
      console.log(`  • Payload:`, JSON.stringify(payload, null, 2))
    }
  }

  static logResponse(response: DebugResponse, context: DebugContext): void {
    const duration = context.startTime ? performance.now() - context.startTime : 0
    
    console.log(`📊 Response Details:`)
    if (response.status) {
      console.log(`  • Status: ${response.status} ${response.statusText || ''}`)
    }
    console.log(`  • Duration: ${duration.toFixed(2)}ms`)
    
    if (response.size) {
      console.log(`  • Size: ${this.formatBytes(response.size)}`)
    }
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        console.log(`  • Data Type: Array (${response.data.length} items)`)
        if (response.data.length > 0) {
          console.log(`  • Sample Item:`, JSON.stringify(response.data[0], null, 2))
        }
      } else if (typeof response.data === 'object') {
        console.log(`  • Data Keys:`, Object.keys(response.data))
        console.log(`  • Full Data:`, JSON.stringify(response.data, null, 2))
      } else {
        console.log(`  • Data:`, response.data)
      }
    }
  }

  static logSuccess(message: string, details?: any): void {
    console.log(`✅ ${message}`)
    if (details) {
      console.log(`📊 Details:`, details)
    }
  }

  static logWarning(message: string, details?: any): void {
    console.warn(`⚠️ ${message}`)
    if (details) {
      console.warn(`📋 Details:`, details)
    }
  }

  static logError(debugError: DebugError): void {
    const { error, context, duration } = debugError
    
    console.error(`💥 Error in ${context.module}.${context.operation}${duration ? ` after ${duration.toFixed(2)}ms` : ''}:`)
    
    if (error instanceof Error) {
      console.error(`  • Error Type: ${error.constructor.name}`)
      console.error(`  • Error Message: ${error.message}`)
      if (error.stack) {
        console.error(`  • Stack Trace:`, error.stack)
      }
    } else if (typeof error === 'object' && error !== null) {
      console.error(`  • Error Object:`, JSON.stringify(error, null, 2))
    } else {
      console.error(`  • Error Value:`, error)
    }

    // Specific error type detection
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`🌐 Network Error - Check connectivity and CORS`)
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(`⏰ Request Timeout - Consider increasing timeout duration`)
    } else if (error instanceof SyntaxError) {
      console.error(`📝 JSON Parsing Error - Invalid response format`)
    }
  }

  static logHttpError(status: number, statusText: string, body?: string, url?: string): void {
    console.error(`❌ HTTP Error:`)
    console.error(`  • Status: ${status} ${statusText}`)
    if (url) {
      console.error(`  • URL: ${url}`)
    }
    if (body) {
      console.error(`  • Response Body: ${body}`)
    }

    // Specific HTTP status code guidance
    switch (status) {
      case 400:
        console.error(`🔧 Bad Request - Check request parameters and format`)
        break
      case 401:
        console.error(`🔐 Unauthorized - Check API key and authentication`)
        break
      case 403:
        console.error(`🚫 Forbidden - Check permissions and access rights`)
        break
      case 404:
        console.error(`❓ Not Found - Check URL and endpoint availability`)
        break
      case 429:
        console.error(`🚦 Rate Limited - Implement caching and respect rate limits`)
        break
      case 500:
        console.error(`🔥 Server Error - API service is experiencing issues`)
        break
      case 503:
        console.error(`🚧 Service Unavailable - API service is temporarily down`)
        break
      default:
        if (status >= 500) {
          console.error(`🔥 Server Error - API service issue`)
        } else if (status >= 400) {
          console.error(`🔧 Client Error - Check request format`)
        }
    }
  }

  static logCacheHit(key: string, data: any): void {
    console.log(`💾 Cache Hit for key: ${key}`)
    if (Array.isArray(data)) {
      console.log(`  • Cached ${data.length} items`)
    } else {
      console.log(`  • Cached data type: ${typeof data}`)
    }
  }

  static logCacheMiss(key: string): void {
    console.log(`🔍 Cache Miss for key: ${key}`)
  }

  static logFallback(reason: string, fallbackType: string): void {
    console.log(`🔄 Fallback triggered: ${reason}`)
    console.log(`  • Using: ${fallbackType}`)
  }

  static endOperation(context: DebugContext): void {
    const groupName = `🔍 [${context.module.toUpperCase()}] ${context.operation}`
    const fullGroupName = context.identifier ? `${groupName} for ${context.identifier}` : groupName
    
    if (context.startTime) {
      const duration = performance.now() - context.startTime
      console.log(`⏱️ Total operation time: ${duration.toFixed(2)}ms`)
    }
    
    if (this.activeGroups.has(fullGroupName)) {
      console.groupEnd()
      this.activeGroups.delete(fullGroupName)
    }
  }

  private static formatValue(value: any): string {
    if (typeof value === 'string') {
      return value.length > 50 ? `${value.substring(0, 50)}...` : value
    }
    if (Array.isArray(value)) {
      return `Array(${value.length})`
    }
    if (typeof value === 'object' && value !== null) {
      return `Object{${Object.keys(value).join(', ')}}`
    }
    return String(value)
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export const debug = DebugLogger