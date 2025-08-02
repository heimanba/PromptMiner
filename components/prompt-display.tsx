'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Copy, MessageSquare, BarChart3, Edit3, Play } from 'lucide-react'
import { type Message, type ParsedCurl, getMessageStats, estimateTokenCount } from '@/lib/prompt-extractor'
import { useToast } from '@/hooks/use-toast'
import { copyToClipboard } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface PromptDisplayProps {
  messages: Message[]
  onMessagesChange: (messages: Message[]) => void
  parsed: ParsedCurl | null
  onTestApi?: () => void
}

// 处理转义字符的函数
const unescapeContent = (content: string): string => {
  return content
    // 先处理双重转义的情况（如果存在）
    .replace(/\\\\n/g, '\\n')
    .replace(/\\\\t/g, '\\t')
    .replace(/\\\\r/g, '\\r')
    // 然后处理单个转义字符
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
}

export function PromptDisplay({ messages, onMessagesChange, parsed, onTestApi }: PromptDisplayProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const { success, error } = useToast()

  const stats = getMessageStats(messages)

  const addMessage = () => {
    const newMessage: Message = {
      role: 'user',
      content: ''
    }
    onMessagesChange([...messages, newMessage])
    setEditingIndex(messages.length)
  }

  const updateMessage = (index: number, field: keyof Message, value: string) => {
    const updatedMessages = messages.map((msg, i) => 
      i === index ? { ...msg, [field]: value } : msg
    )
    onMessagesChange(updatedMessages)
  }

  const deleteMessage = (index: number) => {
    const updatedMessages = messages.filter((_, i) => i !== index)
    onMessagesChange(updatedMessages)
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  const copyMessage = async (message: Message) => {
    try {
      await copyToClipboard(unescapeContent(message.content))
      success('消息内容已复制')
    } catch {
      error('复制失败')
    }
  }

  const copyAllMessages = async () => {
    try {
      const text = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
      await copyToClipboard(text)
      success('所有消息已复制')
    } catch {
      error('复制失败')
    }
  }



  const getRoleColor = (role: Message['role']) => {
    switch (role) {
      case 'system': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'user': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'assistant': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (messages.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Prompt 内容
          </CardTitle>
          <CardDescription>
            {parsed
              ? "查看和编辑从 curl 命令中提取的 Prompt 内容"
              : "解析 curl 命令后，这里将显示提取的 Prompt 内容"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">暂无 Prompt 内容</p>
            <p className="text-sm mb-4">
              请先在左侧输入 curl 命令进行解析，或手动添加消息
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={addMessage}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加消息
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>添加新的消息</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Prompt 内容
            </CardTitle>
            <CardDescription>
              {parsed
                ? "查看和编辑从 curl 命令中提取的 Prompt 内容"
                : "解析 curl 命令后，这里将显示提取的 Prompt 内容"
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={copyAllMessages}>
                  <Copy className="h-4 w-4 mr-1" />
                  复制全部
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>复制所有消息内容</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={addMessage}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加消息
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>添加新的消息</p>
              </TooltipContent>
            </Tooltip>
            {parsed && onTestApi && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="sm" onClick={onTestApi}>
                    <Play className="h-4 w-4 mr-1" />
                    测试 API
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>使用当前配置测试 API 调用</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">总消息数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.system}</div>
            <div className="text-xs text-muted-foreground">系统消息</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.user}</div>
            <div className="text-xs text-muted-foreground">用户消息</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.assistant}</div>
            <div className="text-xs text-muted-foreground">助手消息</div>
          </div>
        </div>

        <Separator />

        {/* 消息列表 */}
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(message.role)}>
                    {message.role}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {estimateTokenCount(message.content)} tokens
                  </span>
                </div>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>复制消息内容</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{editingIndex === index ? "完成编辑" : "编辑消息"}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMessage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>删除消息</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="space-y-2">
                {editingIndex === index && (
                  <Select
                    value={message.role}
                    onValueChange={(value) => updateMessage(index, 'role', value as Message['role'])}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">system</SelectItem>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="assistant">assistant</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {editingIndex === index ? (
                  <Textarea
                    value={message.content}
                    onChange={(e) => updateMessage(index, 'content', e.target.value)}
                    placeholder="输入消息内容..."
                    className="min-h-[100px] font-mono"
                  />
                ) : (
                  <div className="p-3 bg-muted/30 rounded-md border min-h-[100px] whitespace-pre-wrap break-words font-mono text-sm">
                    {message.content ?
                      unescapeContent(message.content) :
                      <span className="text-muted-foreground italic">内容为空</span>
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 总体统计 */}
        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg text-sm">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span>总计:</span>
          </div>
          <span>{stats.totalTokens} tokens</span>
          <span>{stats.totalChars} 字符</span>
        </div>
      </CardContent>
    </Card>
  )
}
