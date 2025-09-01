import { useState, useCallback } from "react"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

interface ToastFunction {
  (props: Omit<Toast, "id">): void
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast: ToastFunction = useCallback((props) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...props, id }
    
    setToasts((prevToasts) => [...prevToasts, newToast])
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = useCallback((toastId: string) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId))
  }, [])

  return {
    toast,
    toasts,
    dismiss,
  }
}