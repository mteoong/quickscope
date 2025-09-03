// Export all debugging utilities from a central location
export { DebugLogger, debug, type DebugContext, type DebugError, type DebugResponse } from '../utils/debug'
export { 
  ReactDebugLogger, 
  reactDebug, 
  useDebugRender, 
  useDebugState, 
  useDebugEffect,
  type ComponentDebugInfo 
} from '../utils/react-debug'
export { 
  DEBUG_CONFIG,
  shouldDebugAPI,
  shouldDebugReact,
  shouldDebugCaching,
  shouldDebugErrors,
  shouldLogVerbose,
  shouldLogWarnings,
  shouldLogErrors,
  shouldTrackPerformance,
  getSlowThreshold,
  withDebug,
  debugLog,
  debugWarn,
  debugError,
  debugGroup,
  debugGroupEnd,
  isProduction,
  isDevelopment,
  isTest,
  type DebugConfig
} from '../config/debug-config'

// Main debugging facade
export class QuickScopeDebugger {
  static api = DebugLogger
  static react = ReactDebugLogger
  
  static startAPIOperation(module: string, operation: string, identifier?: string) {
    if (!shouldDebugAPI()) return { module, operation }
    return DebugLogger.startOperation({ module, operation, identifier })
  }
  
  static logAPISuccess(message: string, data?: any) {
    if (!shouldDebugAPI()) return
    DebugLogger.logSuccess(message, data)
  }
  
  static logAPIError(module: string, operation: string, error: unknown, duration?: number) {
    if (!shouldDebugErrors()) return
    DebugLogger.logError({ error, context: { module, operation }, duration })
  }
  
  static endAPIOperation(context: { module: string; operation: string; startTime?: number }) {
    if (!shouldDebugAPI()) return
    DebugLogger.endOperation(context)
  }
  
  static logComponentRender(componentName: string, props?: any) {
    if (!shouldDebugReact()) return
    ReactDebugLogger.logRender(componentName, props)
  }
  
  static logKeyGeneration(keyType: string, key: string, data: any) {
    if (!shouldDebugReact()) return
    ReactDebugLogger.logKeyGeneration(keyType, key, data)
  }
  
  // Utility method to create debug-aware cache keys
  static createCacheKey(prefix: string, ...parts: (string | number)[]): string {
    const key = `${prefix}_${parts.join('_')}`
    if (shouldDebugCaching()) {
      console.log(`🔑 [CACHE KEY] Generated: ${key}`)
    }
    return key
  }
  
  // Utility method for performance tracking
  static measurePerformance<T>(operation: string, fn: () => T): T {
    if (!shouldTrackPerformance()) return fn()
    
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    if (duration > getSlowThreshold()) {
      console.warn(`⚠️ [PERFORMANCE] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`)
    } else if (shouldLogVerbose()) {
      console.log(`⏱️ [PERFORMANCE] ${operation} completed in ${duration.toFixed(2)}ms`)
    }
    
    return result
  }
  
  // Utility method for async performance tracking
  static async measureAsyncPerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    if (!shouldTrackPerformance()) return fn()
    
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    if (duration > getSlowThreshold()) {
      console.warn(`⚠️ [PERFORMANCE] Slow async operation detected: ${operation} took ${duration.toFixed(2)}ms`)
    } else if (shouldLogVerbose()) {
      console.log(`⏱️ [PERFORMANCE] ${operation} completed in ${duration.toFixed(2)}ms`)
    }
    
    return result
  }
}

// Global debug instance
export const qsDebug = QuickScopeDebugger

// Quick access functions
export const startDebugOperation = qsDebug.startAPIOperation.bind(qsDebug)
export const logDebugSuccess = qsDebug.logAPISuccess.bind(qsDebug) 
export const logDebugError = qsDebug.logAPIError.bind(qsDebug)
export const endDebugOperation = qsDebug.endAPIOperation.bind(qsDebug)
export const logRender = qsDebug.logComponentRender.bind(qsDebug)
export const logKeyGen = qsDebug.logKeyGeneration.bind(qsDebug)
export const createCacheKey = qsDebug.createCacheKey.bind(qsDebug)
export const measurePerf = qsDebug.measurePerformance.bind(qsDebug)
export const measureAsyncPerf = qsDebug.measureAsyncPerformance.bind(qsDebug)

// Console styling utilities for better visual debugging
export const debugStyles = {
  success: 'color: #22c55e; font-weight: bold;',
  error: 'color: #ef4444; font-weight: bold;',
  warning: 'color: #f59e0b; font-weight: bold;',
  info: 'color: #3b82f6; font-weight: bold;',
  performance: 'color: #8b5cf6; font-weight: bold;',
  cache: 'color: #06b6d4; font-weight: bold;'
}

export default QuickScopeDebugger