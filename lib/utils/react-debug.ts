import React, { useEffect, useRef } from 'react'

export interface ComponentDebugInfo {
  componentName: string
  props?: Record<string, any>
  state?: Record<string, any>
  renderCount?: number
}

export class ReactDebugLogger {
  private static renderCounts = new Map<string, number>()
  
  static logRender(componentName: string, props?: Record<string, any>, additionalInfo?: any): void {
    const count = (this.renderCounts.get(componentName) || 0) + 1
    this.renderCounts.set(componentName, count)
    
    console.group(`🔄 [RENDER] ${componentName} (render #${count})`)
    
    if (props) {
      console.log(`📋 Props:`)
      Object.entries(props).forEach(([key, value]) => {
        if (key === 'children' && React.isValidElement(value)) {
          console.log(`  • ${key}: <${value.type.name || value.type} />`)
        } else if (typeof value === 'function') {
          console.log(`  • ${key}: [Function]`)
        } else if (Array.isArray(value)) {
          console.log(`  • ${key}: Array(${value.length})`)
        } else if (typeof value === 'object' && value !== null) {
          console.log(`  • ${key}:`, value)
        } else {
          console.log(`  • ${key}: ${value}`)
        }
      })
    }
    
    if (additionalInfo) {
      console.log(`📊 Additional Info:`, additionalInfo)
    }
    
    console.groupEnd()
  }

  static logKeyGeneration(keyType: string, key: string, data: any): void {
    console.log(`🔑 [KEY GEN] Generated ${keyType} key: ${key}`)
    console.log(`  • Data:`, {
      type: typeof data,
      value: Array.isArray(data) ? `Array(${data.length})` : data
    })
  }

  static logStateChange(componentName: string, stateName: string, oldValue: any, newValue: any): void {
    console.group(`🔄 [STATE] ${componentName}.${stateName}`)
    console.log(`  • Old Value:`, oldValue)
    console.log(`  • New Value:`, newValue)
    console.log(`  • Changed:`, oldValue !== newValue)
    console.groupEnd()
  }

  static logEffect(componentName: string, effectName: string, dependencies?: any[]): void {
    console.log(`⚡ [EFFECT] ${componentName}.${effectName}`)
    if (dependencies) {
      console.log(`  • Dependencies:`, dependencies)
    }
  }

  static logDataFetch(componentName: string, operation: string, params?: any): void {
    console.group(`📡 [DATA FETCH] ${componentName}.${operation}`)
    if (params) {
      console.log(`  • Parameters:`, params)
    }
  }

  static logDataReceived(componentName: string, operation: string, data: any, duration?: number): void {
    console.log(`✅ [DATA RECEIVED] ${componentName}.${operation}`)
    if (Array.isArray(data)) {
      console.log(`  • Received ${data.length} items`)
      if (data.length > 0) {
        console.log(`  • Sample item:`, data[0])
      }
    } else {
      console.log(`  • Data type: ${typeof data}`)
      console.log(`  • Data:`, data)
    }
    
    if (duration) {
      console.log(`  • Duration: ${duration.toFixed(2)}ms`)
    }
    
    console.groupEnd()
  }

  static logError(componentName: string, operation: string, error: unknown): void {
    console.group(`💥 [ERROR] ${componentName}.${operation}`)
    
    if (error instanceof Error) {
      console.error(`  • Error Type: ${error.constructor.name}`)
      console.error(`  • Message: ${error.message}`)
      console.error(`  • Stack:`, error.stack)
    } else {
      console.error(`  • Error:`, error)
    }
    
    console.groupEnd()
  }

  static getRenderCount(componentName: string): number {
    return this.renderCounts.get(componentName) || 0
  }

  static resetRenderCount(componentName: string): void {
    this.renderCounts.delete(componentName)
  }

  static getAllRenderCounts(): Record<string, number> {
    return Object.fromEntries(this.renderCounts.entries())
  }
}

// Hook for automatic render counting and debugging
export function useDebugRender(componentName: string, props?: Record<string, any>) {
  const renderCount = useRef(0)
  
  useEffect(() => {
    renderCount.current++
    ReactDebugLogger.logRender(componentName, props, {
      renderCount: renderCount.current,
      timestamp: new Date().toISOString()
    })
  })
  
  return renderCount.current
}

// Hook for debugging state changes
export function useDebugState<T>(
  componentName: string,
  stateName: string,
  value: T,
  setValue: (value: T) => void
): [T, (value: T) => void] {
  const prevValue = useRef<T>(value)
  
  const debugSetValue = (newValue: T) => {
    ReactDebugLogger.logStateChange(componentName, stateName, prevValue.current, newValue)
    prevValue.current = newValue
    setValue(newValue)
  }
  
  return [value, debugSetValue]
}

// Hook for debugging effects
export function useDebugEffect(
  componentName: string,
  effectName: string,
  effect: () => void | (() => void),
  deps?: React.DependencyList
) {
  useEffect(() => {
    ReactDebugLogger.logEffect(componentName, effectName, deps)
    return effect()
  }, deps)
}

export const reactDebug = ReactDebugLogger