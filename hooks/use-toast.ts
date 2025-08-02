import { toast } from 'sonner'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  title?: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  const showToast = (type: ToastType, message: string, options?: ToastOptions) => {
    const { title, description, duration = 4000, action } = options || {}
    
    const toastOptions = {
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined
    }

    switch (type) {
      case 'success':
        return toast.success(title || message, {
          description: title ? message : description,
          ...toastOptions
        })
      case 'error':
        return toast.error(title || message, {
          description: title ? message : description,
          ...toastOptions
        })
      case 'warning':
        return toast.warning(title || message, {
          description: title ? message : description,
          ...toastOptions
        })
      case 'info':
        return toast.info(title || message, {
          description: title ? message : description,
          ...toastOptions
        })
      default:
        return toast(title || message, {
          description: title ? message : description,
          ...toastOptions
        })
    }
  }

  return {
    toast: showToast,
    success: (message: string, options?: ToastOptions) => showToast('success', message, options),
    error: (message: string, options?: ToastOptions) => showToast('error', message, options),
    warning: (message: string, options?: ToastOptions) => showToast('warning', message, options),
    info: (message: string, options?: ToastOptions) => showToast('info', message, options),
    dismiss: toast.dismiss,
    promise: toast.promise
  }
}
