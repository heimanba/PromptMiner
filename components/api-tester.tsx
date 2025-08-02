'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Badge } from '@/components/ui/badge'

import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Loader2, Play, Copy, Settings, X, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { type ParsedCurl, type Message } from '@/lib/prompt-extractor'

import { useToast } from '@/hooks/use-toast'
import { copyToClipboard } from '@/lib/utils'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText, generateText } from 'ai';


interface ApiTesterProps {
  parsed: ParsedCurl
  messages: Message[]
}

interface TestResult {
  success: boolean
  data?: any
  error?: string
  duration: number
  tokens?: number
}

interface ApiConfig {
  apiKey: string
  customUrl: string
  model: string
  customModel: string
  temperature: number
  maxTokens: number
  stream: boolean
  showApiKey: boolean
  showAdvanced: boolean
}

// 本地存储键名
const STORAGE_KEY = 'api-tester-config'

// 默认配置
const getDefaultConfig = (parsed: ParsedCurl): ApiConfig => ({
  apiKey: '',
  customUrl: parsed.apiConfig.url,
  model: parsed.apiConfig.model || '',
  customModel: '',
  temperature: parsed.apiConfig.temperature ?? 0.7,
  maxTokens: parsed.apiConfig.max_tokens ?? 1000,
  stream: parsed.apiConfig.stream ?? false,
  showApiKey: false,
  showAdvanced: false,
})

// 从本地存储加载配置
const loadConfig = (parsed: ParsedCurl): ApiConfig => {
  if (typeof window === 'undefined') return getDefaultConfig(parsed)

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const config = JSON.parse(saved) as ApiConfig
      // 合并默认配置，确保新字段有默认值
      return { ...getDefaultConfig(parsed), ...config }
    }
  } catch (error) {
    console.warn('Failed to load config from localStorage:', error)
  }
  return getDefaultConfig(parsed)
}

// 保存配置到本地存储
const saveConfig = (config: ApiConfig) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.warn('Failed to save config to localStorage:', error)
  }
}

export function ApiTester({ parsed, messages }: ApiTesterProps) {
  // 初始化配置
  const [config, setConfig] = useState<ApiConfig>(() => loadConfig(parsed))
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  // 新增：流式输出内容
  const [streamedText, setStreamedText] = useState('')
  // 新增：取消控制器
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const { success, error: showError } = useToast()

  // 保存配置到本地存储
  useEffect(() => {
    saveConfig(config)
  }, [config])

  // 更新配置的辅助函数
  const updateConfig = (updates: Partial<ApiConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  // 调试状态变化
  useEffect(() => {
    console.log('Result state changed:', result)
  }, [result])

  useEffect(() => {
    console.log('Loading state changed:', isLoading)
  }, [isLoading])

  useEffect(() => {
    console.log('Streamed text changed:', streamedText)
  }, [streamedText])

  // API地址与模型选项的映射
  const modelOptionsMap: Record<string, { label: string, value: string }[]> = {
    'openai': [
      { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
      { label: 'gpt-4', value: 'gpt-4' },
      { label: 'gpt-4o', value: 'gpt-4o' },
      { label: '自定义模型', value: '__custom__' },
    ],
    'deepseek': [
      { label: 'deepseek-v3', value: 'deepseek-chat' },
      { label: 'deepseek-r1', value: 'deepseek-reasoner' },
      { label: '自定义模型', value: '__custom__' },
    ],
    'dashscope': [
      { label: 'qwen-max', value: 'qwen-max-latest' },
      { label: 'qwen-plus', value: 'qwen-plus-latest' },
      { label: 'qwen-turbo', value: 'qwen-turbo-latest' },
      { label: 'qwq-plus', value: 'qwq-plus-latest' },
      { label: 'qwen3-coder', value: 'qwen3-coder-plus' },
      { label: '自定义模型', value: '__custom__' },
    ],
    'claude': [
      { label: 'claude-3-opus-20240229', value: 'claude-3-opus-20240229' },
      { label: 'claude-3-sonnet-20240229', value: 'claude-3-sonnet-20240229' },
      { label: 'claude-3-haiku-20240307', value: 'claude-3-haiku-20240307' },
      { label: '自定义模型', value: '__custom__' },
    ],
    'unknown': [
      { label: '自定义模型', value: '__custom__' },
    ]
  }

  // 根据API地址判断类型
  const getApiType = (url: string) => {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('openai.com') || lowerUrl.includes('/v1/chat/completions') && lowerUrl.includes('openai')) return 'openai'
    if (lowerUrl.includes('deepseek.com')) return 'deepseek'
    if (lowerUrl.includes('anthropic.com') || lowerUrl.includes('claude')) return 'claude'
    return 'unknown'
  }

  const currentApiType = useMemo(() => getApiType(config.customUrl), [config.customUrl])
  const modelOptions = modelOptionsMap[currentApiType] || modelOptionsMap['unknown']

  // 选择模型时，如果选择自定义模型，model设为__custom__，否则直接设为模型名
  const handleModelChange = (val: string) => {
    if (val === '__custom__') {
      updateConfig({ model: '__custom__' })
    } else {
      updateConfig({ model: val, customModel: '' })
    }
  }

  // 取消请求
  const cancelRequest = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
      setResult({
        success: false,
        error: '请求已取消',
        duration: 0
      })
      showError('请求已取消')
    }
  }

  const testApi = async () => {
    if (!config.apiKey.trim()) {
      showError('请输入 API 密钥')
      return
    }

    if (messages.length === 0) {
      showError('请至少添加一条消息')
      return
    }

    // 过滤掉 content 为空的 system message，并转换为 OpenAI 兼容格式
    const filteredMessages = messages
      .filter((msg) => !(msg.role === 'system' && (!msg.content || msg.content.trim() === '')))
      .map((msg) => {
        if (msg.role === 'system') {
          return {
            role: 'system' as const,
            content: typeof msg.content === 'string' ? msg.content : ''
          }
        }
        if (msg.role === 'user') {
          return {
            role: 'user' as const,
            content: [
              {
                type: 'text' as const,
                text: typeof msg.content === 'string' ? msg.content : ''
              }
            ]
          }
        }
        if (msg.role === 'assistant') {
          return {
            role: 'assistant' as const,
            content: [
              {
                type: 'text' as const,
                text: typeof msg.content === 'string' ? msg.content : ''
              }
            ]
          }
        }
        return null
      })
      .filter((msg): msg is Exclude<typeof msg, null> => msg !== null)

    // 创建新的 AbortController
    const controller = new AbortController()
    setAbortController(controller)
    setIsLoading(true)
    setStreamedText('') // 清空流式内容
    setResult(null) // 清空之前的结果
    const startTime = Date.now()

    try {
      // 优化 customUrl，保留 baseURL + 版本号（如 /v1），去除多余 path/query/fragment
      let baseURL = config.customUrl
      try {
        const urlObj = new URL(config.customUrl)
        // 匹配 /v1 或 /v1/xxx 这类路径，保留 /v1
        const versionMatch = urlObj.pathname.match(/\/(v\d+)(\/|$)/)
        if (versionMatch) {
          baseURL = urlObj.origin + '/' + versionMatch[1]
        } else {
          baseURL = urlObj.origin
        }
      } catch {
        // 如果 customUrl 不是合法 URL，则保持原样
      }
      const provider = createOpenAICompatible({
        baseURL,
        name: 'custom',
        apiKey: config.apiKey,
      })
      const realModel = config.model === '__custom__' ? config.customModel : config.model
      if (!realModel) throw new Error('模型名不能为空')

      // 根据配置决定是否使用流式输出
      if (config.stream) {
        const result = await streamText({
          model: provider.chatModel(realModel),
          messages: filteredMessages,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
          abortSignal: controller.signal,
          onError({ error }) {
          // 处理 AI_APICallError 类型的错误
          if (error && typeof error === 'object') {
            const apiError = error as any;

            // 检查是否是认证错误 (401)
            if (apiError.statusCode === 401) {

              // 设置认证错误状态
              const duration = Date.now() - startTime;
              let authErrorMessage = '认证失败: API 密钥无效或已过期，请检查您的 API 密钥是否正确';

              // 尝试从响应体中提取更详细的错误信息
              if (apiError.responseBody) {
                try {
                  const responseData = typeof apiError.responseBody === 'string'
                    ? JSON.parse(apiError.responseBody)
                    : apiError.responseBody;
                  if (responseData.error) {
                    if (typeof responseData.error === 'string') {
                      authErrorMessage = `认证失败: ${responseData.error}`;
                    } else if (responseData.error.message) {
                      authErrorMessage = `认证失败: ${responseData.error.message}`;
                    }
                  }
                } catch (parseError) {
                  console.warn('Failed to parse response body in onError:', parseError);
                }
              }

              setResult({
                success: false,
                error: authErrorMessage,
                duration
              });
              setIsLoading(false);
              setAbortController(null);
              showError('认证失败: 请检查您的 API 密钥是否正确');
              return;
            }

            // 处理其他 API 错误
            if (apiError.statusCode) {

              const duration = Date.now() - startTime;
              let errorMessage = `API 调用失败 (${apiError.statusCode}): ${apiError.message}`;

              // 根据状态码提供更友好的错误信息
              switch (apiError.statusCode) {
                case 400:
                  errorMessage = `请求参数错误 (400): ${apiError.message}`;
                  break;
                case 403:
                  errorMessage = `访问被拒绝 (403): ${apiError.message}`;
                  break;
                case 404:
                  errorMessage = `API 端点不存在 (404): ${apiError.message}`;
                  break;
                case 429:
                  errorMessage = `请求频率限制 (429): ${apiError.message}`;
                  break;
                case 500:
                  errorMessage = `服务器内部错误 (500): ${apiError.message}`;
                  break;
                case 502:
                  errorMessage = `网关错误 (502): ${apiError.message}`;
                  break;
                case 503:
                  errorMessage = `服务不可用 (503): ${apiError.message}`;
                  break;
                default:
                  errorMessage = `API 调用失败 (${apiError.statusCode}): ${apiError.message}`;
              }

              setResult({
                success: false,
                error: errorMessage,
                duration
              });
              setIsLoading(false);
              setAbortController(null);
              showError(`API 测试失败: ${errorMessage}`);
              return;
            }
          }

          // 处理其他类型的错误
          const duration = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : '未知错误';

          setResult({
            success: false,
            error: `流式处理错误: ${errorMessage}`,
            duration
          });
          setIsLoading(false);
          setAbortController(null);
          // error(`API 测试失败: ${errorMessage}`);
        },
        })

        console.log('API call initiated successfully')

        let fullText = ''
        for await (const chunk of result.textStream) {
          // 检查是否已被取消
          if (controller.signal.aborted) {
            break
          }
          fullText += chunk
          setStreamedText(fullText)
        }

        // 如果请求被取消，不继续处理结果
        if (controller.signal.aborted) {
          return
        }

        // 等待所有异步结果完成
        const [finalText, usage, finishReason] = await Promise.all([
          result.text,
          result.usage,
          result.finishReason
        ])
        const duration = Date.now() - startTime
        setResult({
          success: true,
          data: {
            text: finalText,
            finishReason,
            usage
          },
          duration,
          tokens: usage?.completionTokens
        })
        success('API 测试成功')
      } else {
        // 非流式输出
        const result = await generateText({
          model: provider.chatModel(realModel),
          messages: filteredMessages,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
          abortSignal: controller.signal,
        })

        // 如果请求被取消，不继续处理结果
        if (controller.signal.aborted) {
          return
        }

        const duration = Date.now() - startTime
        setResult({
          success: true,
          data: {
            text: result.text,
            finishReason: result.finishReason,
            usage: result.usage
          },
          duration,
          tokens: result.usage?.completionTokens
        })
        // 非流式模式下也设置 streamedText 以便显示
        setStreamedText(result.text)
        success('API 测试成功')
      }
    } catch (err) {
      const duration = Date.now() - startTime

      // 检查是否是取消错误
      if (err instanceof Error && (err.name === 'AbortError' || controller.signal.aborted)) {
        setResult({
          success: false,
          error: '请求已取消',
          duration
        })
        return // 不显示错误 toast，因为是用户主动取消
      }

      // 检查是否已经在 onError 回调中处理过错误
      // 如果 result 已经被设置为失败状态，说明 onError 已经处理过了
      if (result && !result.success) {
        console.log('Error already handled in onError callback, skipping catch block processing')
        return
      }

      // 处理其他错误（主要是非 API 调用错误，如网络错误、解析错误等）
      let errorMessage = err instanceof Error ? err.message : '未知错误'
      let isAuthError = false

      if (err instanceof Error) {

        // 检查是否是AI SDK的APICallError（备用处理，主要在 onError 中处理）
        if (err.constructor.name === 'APICallError' || err.name === 'AI_APICallError') {
          const apiError = err as any

          if (apiError.statusCode === 401) {
            isAuthError = true
            errorMessage = '认证失败: API 密钥无效或已过期，请检查您的 API 密钥是否正确'

            // 尝试从响应体中提取更详细的错误信息
            if (apiError.responseBody) {
              try {
                const responseData = typeof apiError.responseBody === 'string'
                  ? JSON.parse(apiError.responseBody)
                  : apiError.responseBody
                if (responseData.error) {
                  if (typeof responseData.error === 'string') {
                    errorMessage = `认证失败: ${responseData.error}`
                  } else if (responseData.error.message) {
                    errorMessage = `认证失败: ${responseData.error.message}`
                  }
                }
              } catch (parseError) {
                console.warn('Catch block - Failed to parse response body:', parseError)
              }
            }
          } else {
            // 根据状态码提供更友好的错误信息
            switch (apiError.statusCode) {
              case 400:
                errorMessage = `请求参数错误 (400): ${apiError.message}`
                break
              case 403:
                errorMessage = `访问被拒绝 (403): ${apiError.message}`
                break
              case 404:
                errorMessage = `API 端点不存在 (404): ${apiError.message}`
                break
              case 429:
                errorMessage = `请求频率限制 (429): ${apiError.message}`
                break
              case 500:
                errorMessage = `服务器内部错误 (500): ${apiError.message}`
                break
              case 502:
                errorMessage = `网关错误 (502): ${apiError.message}`
                break
              case 503:
                errorMessage = `服务不可用 (503): ${apiError.message}`
                break
              default:
                errorMessage = `API 调用失败 (${apiError.statusCode}): ${apiError.message}`
            }
          }
        } else {
          // 处理非 API 错误（如网络错误、解析错误等）
          const errorStr = err.message.toLowerCase()
          if (errorStr.includes('401') ||
              errorStr.includes('unauthorized') ||
              errorStr.includes('authentication') ||
              errorStr.includes('invalid api key') ||
              errorStr.includes('api key') ||
              errorStr.includes('bearer token')) {
            isAuthError = true
            errorMessage = '认证失败: API 密钥无效或已过期，请检查您的 API 密钥是否正确'
          } else if (errorStr.includes('fetch') || errorStr.includes('network')) {
            errorMessage = `网络请求失败: ${err.message}`
          } else if (errorStr.includes('timeout')) {
            errorMessage = `请求超时: ${err.message}`
          } else if (errorStr.includes('cors')) {
            errorMessage = `跨域请求失败: ${err.message}`
          } else if (errorStr.includes('parse') || errorStr.includes('json')) {
            errorMessage = `响应解析失败: ${err.message}`
          } else {
            errorMessage = `请求失败: ${err.message}`
          }
        }
      }

      setResult({
        success: false,
        error: errorMessage,
        duration
      })

      // 根据错误类型显示不同的toast消息
      if (isAuthError) {
        showError('认证失败: 请检查您的 API 密钥是否正确')
      } else {
        showError(`API 测试失败: ${errorMessage}`)
      }

      // 强制更新UI状态以确保错误信息显示
      setTimeout(() => {
        console.log('Catch block - Current result state:', result)
      }, 100)
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }

  const copyResult = async () => {
    if (!result) return
    
    try {
      const text = result.success 
        ? JSON.stringify(result.data, null, 2)
        : result.error
      await copyToClipboard(text || '')
      success('结果已复制')
    } catch (err) {
      showError('复制失败')
    }
  }



  return (
    <div className="space-y-6">
        {/* API & 模型配置 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h4 className="font-medium">API 配置</h4>
            <Badge variant="secondary">{parsed.provider}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            
            {/* API 地址和模型同一行 */}
            <div className="flex flex-col md:flex-row gap-4 md:col-span-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="model">模型</Label>
                <Select value={config.model} onValueChange={handleModelChange}>
                  <SelectTrigger className="w-full" id="model">
                    <SelectValue placeholder="选择或输入模型名" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {config.model === '__custom__' && (
                  <Input
                    className="mt-2"
                    placeholder="自定义模型名..."
                    value={config.customModel}
                    onChange={e => updateConfig({ customModel: e.target.value })}
                  />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="url">API 地址</Label>
                <Input
                  id="url"
                  value={config.customUrl}
                  onChange={(e) => updateConfig({ customUrl: e.target.value })}
                />
              </div>
            </div>
            {/* API 密钥单独一行 */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="apiKey">API 密钥</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={config.showApiKey ? 'password' : 'text'}
                  placeholder="输入你的 API 密钥"
                  value={config.apiKey}
                  onChange={(e) => updateConfig({ apiKey: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={config.showApiKey ? '隐藏密钥' : '显示密钥'}
                  onClick={() => updateConfig({ showApiKey: !config.showApiKey })}
                >
                  {config.showApiKey ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* 高级参数配置（可展开） */}
        <div>
          <Button
            variant="outline"
            className="mb-2"
            size="sm"
            onClick={() => updateConfig({ showAdvanced: !config.showAdvanced })}
            aria-expanded={config.showAdvanced}
          >
            {config.showAdvanced ? '隐藏高级选项' : '显示高级选项'}
          </Button>
          {config.showAdvanced && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium">高级参数</h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Temperature</Label>
                    <span className="text-sm text-muted-foreground">{config.temperature}</span>
                  </div>
                  <Slider
                    value={[config.temperature]}
                    onValueChange={(value) => updateConfig({ temperature: value[0] })}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Max Tokens</Label>
                    <span className="text-sm text-muted-foreground">{config.maxTokens}</span>
                  </div>
                  <Slider
                    value={[config.maxTokens]}
                    onValueChange={(value) => updateConfig({ maxTokens: value[0] })}
                    max={4000}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="stream">流式输出</Label>
                  <Switch
                    id="stream"
                    checked={config.stream}
                    onCheckedChange={(checked) => updateConfig({ stream: checked })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* 测试按钮 */}
        <div className="flex gap-2">
          <Button
            onClick={testApi}
            disabled={isLoading || !config.apiKey.trim()}
            className="flex-1"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isLoading ? '测试中...' : '测试 API'}
          </Button>
          {isLoading && (
            <Button
              onClick={cancelRequest}
              variant="outline"
              size="lg"
              className="px-4"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

        </div>

        {/* 测试结果 */}
        {(result || streamedText || isLoading) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">测试结果</h4>
              {result && (
                <div className="flex items-center gap-2">
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? '成功' : '失败'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {result.duration}ms
                  </span>
                  {result.tokens && (
                    <span className="text-sm text-muted-foreground">
                      {result.tokens} tokens
                    </span>
                  )}
                  <Button variant="ghost" size="sm" onClick={copyResult}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {isLoading && !result && (
                <Badge variant="secondary">
                  正在生成...
                </Badge>
              )}
            </div>
            <div className="border rounded-lg p-4 bg-muted/50">
              {/* 流式输出内容显示 */}
              {(streamedText || isLoading) && !result && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">回复内容:</Label>
                  <div className="mt-1 p-3 bg-background border rounded text-sm whitespace-pre-wrap min-h-[2em]">
                    {streamedText || (isLoading ? "正在生成回复..." : "")}
                    {isLoading && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                    )}
                  </div>
                </div>
              )}

              {/* 最终结果显示 */}
              {result?.success ? (
                <div className="space-y-2">
                  {/* 显示回复内容 */}
                  {(streamedText || result?.data?.text) && (
                    <div>
                      <Label className="text-sm font-medium">回复内容:</Label>
                      <div className="mt-1 p-3 bg-background border rounded text-sm whitespace-pre-wrap min-h-[2em]">
                        {streamedText || result?.data?.text}
                      </div>
                    </div>
                  )}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      查看完整响应
                    </summary>
                    <pre className="mt-2 p-3 bg-background border rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : result && (
                <div className="text-destructive text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <Label className="font-medium">错误信息:</Label>
                  </div>
                  <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded">
                    <div className="whitespace-pre-wrap break-words">
                      {result.error}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  )
}
