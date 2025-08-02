import { useState, useCallback } from 'react'
import { parseCurlCommand, type ParsedCurl, type Message } from '@/lib/prompt-extractor'

interface UseCurlParserState {
  parsed: ParsedCurl | null
  isLoading: boolean
  error: string | null
}

interface UseCurlParserReturn extends UseCurlParserState {
  parseCurl: (curlCommand: string) => Promise<ParsedCurl | null>
  updateMessages: (messages: Message[]) => void
  reset: () => void
}

export function useCurlParser(): UseCurlParserReturn {
  const [state, setState] = useState<UseCurlParserState>({
    parsed: null,
    isLoading: false,
    error: null
  })

  const parseCurl = useCallback(async (curlCommand: string): Promise<ParsedCurl | null> => {
    if (!curlCommand.trim()) {
      setState(prev => ({ ...prev, error: '请输入 curl 命令' }))
      return null
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // 添加小延迟以显示加载状态
      await new Promise(resolve => setTimeout(resolve, 100))

      const parsed = parseCurlCommand(curlCommand)
      setState({
        parsed,
        isLoading: false,
        error: null
      })
      return parsed
    } catch (error) {
      setState({
        parsed: null,
        isLoading: false,
        error: error instanceof Error ? error.message : '解析失败'
      })
      return null
    }
  }, [])

  const updateMessages = useCallback((messages: Message[]) => {
    setState(prev => {
      if (!prev.parsed) return prev
      
      return {
        ...prev,
        parsed: {
          ...prev.parsed,
          messages
        }
      }
    })
  }, [])

  const reset = useCallback(() => {
    setState({
      parsed: null,
      isLoading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    parseCurl,
    updateMessages,
    reset
  }
}
