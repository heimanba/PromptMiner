'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, Trash2, FileText } from 'lucide-react'
import { useCurlParser } from '@/hooks/use-curl-parser'
import { useToast } from '@/hooks/use-toast'
import { copyToClipboard } from '@/lib/utils'

interface CurlInputProps {
  onParsed?: (parsed: any) => void
}

export function CurlInput({ onParsed }: CurlInputProps) {
  const [curlCommand, setCurlCommand] = useState('')
  const [lastParsedCommand, setLastParsedCommand] = useState('')
  const { parsed, isLoading, error, parseCurl, reset } = useCurlParser()
  const { success, error: showError } = useToast()

  // 自动解析 curl 命令
  useEffect(() => {
    const trimmedCommand = curlCommand.trim()

    // 避免重复解析同一个命令
    if (trimmedCommand &&
        trimmedCommand !== lastParsedCommand &&
        isCurlCommand(trimmedCommand) &&
        !isLoading) {

      const timeoutId = setTimeout(() => {
        setLastParsedCommand(trimmedCommand)
        parseCurl(trimmedCommand).then(result => {
          if (result && onParsed) {
            onParsed(result)
          }
        })
      }, 500) // 500ms 防抖，避免频繁解析

      return () => clearTimeout(timeoutId)
    }
  }, [curlCommand, lastParsedCommand, isLoading, parseCurl, onParsed])

  const handleParse = async () => {
    const result = await parseCurl(curlCommand)
    if (result && onParsed) {
      onParsed(result)
    }
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(curlCommand)
      success('已复制到剪贴板')
    } catch (err) {
      showError('复制失败')
    }
  }

  const handleClear = () => {
    setCurlCommand('')
    setLastParsedCommand('')
    reset()
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setCurlCommand(text)
      // 自动检测并解析 curl 命令
      if (isCurlCommand(text)) {
        setTimeout(() => {
          parseCurl(text).then(result => {
            if (result && onParsed) {
              onParsed(result)
            }
          })
        }, 100) // 短暂延迟确保状态更新
      }
    } catch {
      showError('粘贴失败，请手动粘贴')
    }
  }

  // 检测是否为 curl 命令
  const isCurlCommand = (text: string): boolean => {
    const trimmed = text.trim()
    return trimmed.startsWith('curl ') || trimmed.startsWith('curl\t') || trimmed.startsWith('curl\n')
  }

  // 处理 textarea 的粘贴事件
  const handleTextareaPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text')
    if (isCurlCommand(pastedText)) {
      // 延迟执行解析，确保 textarea 的值已更新
      setTimeout(() => {
        parseCurl(pastedText).then(result => {
          if (result && onParsed) {
            onParsed(result)
          }
        })
      }, 100)
    }
  }

  const exampleCurl = `curl 'https://api.deepseek.com/v1/chat/completions' \\
  -H 'content-type: application/json' \\
  -H 'authorization: Bearer YOUR_API_KEY' \\
  --data-raw $'{"model":"deepseek-reasoner","messages":[{"role":"system","content":"你是一个专业的 AI 助手"},{"role":"user","content":"请解释什么是机器学习？"}],"temperature":0.7}'`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          curl 命令输入
        </CardTitle>
        <CardDescription>
          从浏览器开发者工具复制 curl 命令，或手动输入 API 调用命令。粘贴后将自动解析。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePaste}
              className="text-xs"
            >
              粘贴
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurlCommand(exampleCurl)}
              className="text-xs"
            >
              示例
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!curlCommand}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              复制
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!curlCommand}
              className="text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              清空
            </Button>
          </div>
          
          <Textarea
            placeholder="粘贴 curl 命令到这里，将自动解析..."
            value={curlCommand}
            onChange={(e) => setCurlCommand(e.target.value)}
            onPaste={handleTextareaPaste}
            className="min-h-[120px] font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleParse}
            disabled={!curlCommand.trim() || isLoading}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? '正在解析...' : '解析 curl 命令'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {parsed && (
          <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h4 className="font-medium text-green-800">解析成功</h4>
                <Badge variant="secondary">{parsed.provider}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">模型:</span>
                <p className="text-green-600">{parsed.apiConfig.model || '未指定'}</p>
              </div>
              <div>
                <span className="font-medium text-green-700">消息数:</span>
                <p className="text-green-600">{parsed.messages.length} 条</p>
              </div>
              <div>
                <span className="font-medium text-green-700">温度:</span>
                <p className="text-green-600">{parsed.apiConfig.temperature ?? '未设置'}</p>
              </div>
            </div>

            <p className="text-sm text-green-600">
              ✨ 使用下方按钮来编辑 Prompt 或测试 API
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
