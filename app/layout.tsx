import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toast } from "@/components/toast";
import "./globals.css";


export const metadata: Metadata = {
  title: "Prompt Miner",
  description: "快速提取和测试别人分享的 AI Prompt，支持 Qwen、OpenAI、DeepSeek、Claude 等多种 API 格式",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className='antialiased'
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toast />
        </ThemeProvider>
      </body>
    </html>
  );
}
