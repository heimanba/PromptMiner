'use client'

import { useState } from 'react'
import { CurlInput } from '@/components/curl-input'
import { PromptDisplay } from '@/components/prompt-display'
import { ApiTester } from '@/components/api-tester'
import { type ParsedCurl, type Message } from '@/lib/prompt-extractor'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Search, ExternalLink, Play } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const [parsed, setParsed] = useState<ParsedCurl | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [showApiTester, setShowApiTester] = useState(false)

  const handleParsed = (newParsed: ParsedCurl) => {
    setParsed(newParsed)
    setMessages(newParsed.messages)
    // 解析成功后，自动显示快捷操作按钮
  }

  const handleMessagesChange = (newMessages: Message[]) => {
    setMessages(newMessages)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Image src="/logo.jpg" alt="Prompt Miner Logo" width={32} height={32} className="h-8 w-8" />
                <span className="text-2xl font-bold">Prompt Miner</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                v1.0.0
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/heimanba/PromptMiner"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            快速提取和测试别人分享的 AI Prompt，支持 Qwen、OpenAI、DeepSeek、Claude 等多种 API 格式
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 左右两屏布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
            {/* 左侧：curl 命令输入 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">curl 命令输入</h2>
                <Badge variant="outline" className="text-xs">
                  步骤 1
                </Badge>
              </div>
              <CurlInput onParsed={handleParsed} />
            </div>

            {/* 右侧：编辑 Prompt */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">编辑 Prompt</h2>
                <Badge variant="outline" className="text-xs">
                  步骤 2
                </Badge>
                {parsed && (
                  <Badge variant="secondary" className="text-xs">
                    已解析
                  </Badge>
                )}
              </div>

              {/* Prompt 编辑区域 */}
              <PromptDisplay
                messages={messages}
                onMessagesChange={handleMessagesChange}
                parsed={parsed}
                onTestApi={() => setShowApiTester(true)}
              />
            </div>
          </div>

          {/* API 测试器弹窗 */}
          {parsed && (
            <Sheet open={showApiTester} onOpenChange={setShowApiTester}>
              <SheetContent side="right" className="w-[600px] sm:w-[800px] overflow-y-auto">
                <SheetHeader className="pb-2">
                  <SheetTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    API 测试
                  </SheetTitle>
                  <SheetDescription>
                    配置 API 参数并测试 prompt 效果
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-2 px-6">
                  <ApiTester
                    parsed={parsed}
                    messages={messages}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Prompt Miner. 基于 Next.js + Tailwind CSS 构建
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                使用指南
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                API 文档
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                反馈建议
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
