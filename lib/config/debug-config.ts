export interface DebugConfig {
  enabled: boolean
  modules: {
    api: boolean
    react: boolean
    caching: boolean
    errors: boolean
  }
  levels: {
    verbose: boolean
    warnings: boolean
    errors: boolean
  }
  performance: {
    trackRenderTimes: boolean
    trackApiTimes: boolean
    logSlowOperations: boolean
    slowThreshold: number // milliseconds
  }
}

// Development debug configuration
export const DEBUG_CONFIG: DebugConfig = {
  enabled: process.env.NODE_ENV === 'development',
  modules: {
    api: true,
    react: true,
    caching: true,
    errors: true
  },
  levels: {
    verbose: true,
    warnings: true,
    errors: true
  },
  performance: {
    trackRenderTimes: true,
    trackApiTimes: true,
    logSlowOperations: true,
    slowThreshold: 1000 // Log operations taking longer than 1 second
  }
}

// Utility functions to check debug settings
export const shouldDebugAPI = () => DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules.api
export const shouldDebugReact = () => DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules.react
export const shouldDebugCaching = () => DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules.caching
export const shouldDebugErrors = () => DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules.errors

export const shouldLogVerbose = () => DEBUG_CONFIG.enabled && DEBUG_CONFIG.levels.verbose
export const shouldLogWarnings = () => DEBUG_CONFIG.enabled && DEBUG_CONFIG.levels.warnings
export const shouldLogErrors = () => DEBUG_CONFIG.enabled && DEBUG_CONFIG.levels.errors

export const shouldTrackPerformance = () => DEBUG_CONFIG.enabled && DEBUG_CONFIG.performance.trackApiTimes
export const getSlowThreshold = () => DEBUG_CONFIG.performance.slowThreshold

// Helper to conditionally execute debug code
export const withDebug = <T>(condition: boolean, debugFn: () => T, fallback?: T): T | undefined => {
  return condition ? debugFn() : fallback
}

// Conditional logging functions
export const debugLog = (condition: boolean, ...args: any[]) => {
  if (condition) console.log(...args)
}

export const debugWarn = (condition: boolean, ...args: any[]) => {
  if (condition) console.warn(...args)
}

export const debugError = (condition: boolean, ...args: any[]) => {
  if (condition) console.error(...args)
}

export const debugGroup = (condition: boolean, label: string) => {
  if (condition) console.group(label)
}

export const debugGroupEnd = (condition: boolean) => {
  if (condition) console.groupEnd()
}

// Environment-specific debug settings
export const isProduction = () => process.env.NODE_ENV === 'production'
export const isDevelopment = () => process.env.NODE_ENV === 'development'
export const isTest = () => process.env.NODE_ENV === 'test'