// curl 命令解析和 prompt 提取工具

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ApiConfig {
  url: string
  method: string
  headers: Record<string, string>
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface ParsedCurl {
  apiConfig: ApiConfig
  messages: Message[]
  rawData: any
  provider: 'openai' | 'deepseek' | 'dashscope' | 'claude' | 'unknown'
}

// 检测 API 提供商
export function detectProvider(url: string): ParsedCurl['provider'] {
  if (url.includes('api.openai.com')) return 'openai'
  if (url.includes('api.deepseek.com')) return 'deepseek'
  if (url.includes('dashscope.aliyuncs.com')) return 'dashscope'
  if (url.includes('api.anthropic.com')) return 'claude'
  return 'unknown'
}

// 解析 curl 命令
export function parseCurlCommand(curlCommand: string): ParsedCurl {
  try {
    // 清理命令，移除换行符和多余空格
    const cleanCommand = curlCommand
      .replace(/\\\s*\n\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // 提取 URL
    const urlMatch = cleanCommand.match(/curl\s+['"]?([^'"\s]+)['"]?/)
    if (!urlMatch) {
      throw new Error('无法找到 URL')
    }
    const url = urlMatch[1]

    // 提取 headers
    const headers: Record<string, string> = {}
    const headerMatches = cleanCommand.matchAll(/-H\s+['"]([^'"]+)['"]/g)
    for (const match of headerMatches) {
      const headerLine = match[1]
      const colonIndex = headerLine.indexOf(':')
      if (colonIndex > 0) {
        const key = headerLine.substring(0, colonIndex).trim().toLowerCase()
        const value = headerLine.substring(colonIndex + 1).trim()
        headers[key] = value
      }
    }

    // 提取请求体数据 - 支持 $'...' 格式
    const dataMatch = cleanCommand.match(/(--data-raw|--data|-d)\s+(\$?['"])(.+)['"]$/)

    let rawData: any = {}
    let messages: Message[] = []

    if (dataMatch) {
      let dataStr = dataMatch[3]
      // 检查是否为 $'...' 格式，若是则做 Bash ANSI-C 解码
      if (dataMatch[2].startsWith("$")) {
        dataStr = dataStr
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\')
          .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        // 关键：将实际的换行符等再转回 JSON 合法的转义
        dataStr = dataStr
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t')
      }
      try {
        rawData = JSON.parse(dataStr)
        if (rawData.messages && Array.isArray(rawData.messages)) {
          messages = rawData.messages
        }
      } catch (e) {
        console.warn('无法解析请求体 JSON:', e)
      }
    }

    // 构建 API 配置
    const apiConfig: ApiConfig = {
      url,
      method: 'POST',
      headers,
      model: rawData.model,
      temperature: rawData.temperature,
      max_tokens: rawData.max_tokens,
      stream: rawData.stream,
      top_p: rawData.top_p,
      frequency_penalty: rawData.frequency_penalty,
      presence_penalty: rawData.presence_penalty,
    }

    const provider = detectProvider(url)

    return {
      apiConfig,
      messages,
      rawData,
      provider
    }
  } catch (error) {
    throw new Error(`解析 curl 命令失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 生成新的 curl 命令
export function generateCurlCommand(parsed: ParsedCurl): string {
  const { apiConfig, messages, rawData } = parsed
  
  // 构建请求体
  const requestBody = {
    ...rawData,
    messages
  }

  // 构建 headers 字符串
  const headerStrings = Object.entries(apiConfig.headers).map(
    ([key, value]) => `-H '${key}: ${value}'`
  )

  // 构建完整的 curl 命令
  const curlCommand = [
    `curl '${apiConfig.url}'`,
    ...headerStrings,
    `--data-raw '${JSON.stringify(requestBody)}'`
  ].join(' \\\n  ')

  return curlCommand
}

// 验证消息格式
export function validateMessages(messages: Message[]): string[] {
  const errors: string[] = []
  
  if (!Array.isArray(messages)) {
    errors.push('消息必须是数组格式')
    return errors
  }

  if (messages.length === 0) {
    errors.push('至少需要一条消息')
    return errors
  }

  messages.forEach((message, index) => {
    if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
      errors.push(`消息 ${index + 1}: 角色必须是 system、user 或 assistant`)
    }
    
    if (!message.content || typeof message.content !== 'string') {
      errors.push(`消息 ${index + 1}: 内容不能为空且必须是字符串`)
    }
  })

  return errors
}

// 计算 token 数量（简单估算）
export function estimateTokenCount(text: string): number {
  // 简单的 token 估算：英文按单词计算，中文按字符计算
  const englishWords = text.match(/[a-zA-Z]+/g)?.length || 0
  const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length || 0
  const otherChars = text.replace(/[a-zA-Z\u4e00-\u9fff\s]/g, '').length
  
  return englishWords + chineseChars + Math.ceil(otherChars / 4)
}

// 获取消息统计信息
export function getMessageStats(messages: Message[]) {
  const stats = {
    total: messages.length,
    system: 0,
    user: 0,
    assistant: 0,
    totalTokens: 0,
    totalChars: 0
  }

  messages.forEach(message => {
    stats[message.role]++
    stats.totalTokens += estimateTokenCount(message.content)
    stats.totalChars += message.content.length
  })

  return stats
}
