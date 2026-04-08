'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function InterviewPage() {
  const params = useParams()
  const interviewId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [interview, setInterview] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState<'info' | 'chat'>('info')
  const router = useRouter()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        fetchInterview(user.id)
      }
    }
    checkUser()
  }, [router, supabase, interviewId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  const fetchInterview = async (userId: string) => {
    const { data } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .eq('interviewer_id', userId)
      .single()

    if (data) {
      setInterview(data)
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages)
        setStep('chat')
      }
    }
  }

  const handleStartChat = async () => {
    setStep('chat')
    setLoading(true)
    setIsStreaming(true)
    setStreamContent('正在连接AI，请稍候...\n（如果长时间无响应，请刷新页面重试）')

    try {
      // 调用 API 让 AI 发送第一条消息
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const aiMessage = data.content

      // 先显示在界面上
      const assistantMessage: Message = { role: 'assistant', content: aiMessage }
      setMessages([assistantMessage])
      setStreamContent('')
      setIsStreaming(false)
      setLoading(false)

      // 保存到数据库
      await supabase
        .from('interviews')
        .update({
          messages: [assistantMessage],
          status: 'in_progress'
        })
        .eq('id', interviewId)

    } catch (error: any) {
      console.error('Error:', error)
      let errorMsg = 'AI启动失败'
      if (error.name === 'AbortError') {
        errorMsg = '请求超时，请检查网络后重试'
      } else {
        errorMsg = 'AI启动失败: ' + (error.message || '请重试')
      }
      setStreamContent(errorMsg)
      setIsStreaming(false)
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    const currentMessages = [...messages, userMessage]
    setMessages(currentMessages)
    setInput('')
    setLoading(true)
    setIsStreaming(true)
    setStreamContent('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const fullContent = data.content
      setStreamContent('')
      setIsStreaming(false)

      const assistantMessage: Message = { role: 'assistant', content: fullContent }
      setMessages(prev => [...prev, assistantMessage])

      await supabase
        .from('interviews')
        .update({
          messages: [...currentMessages, assistantMessage],
          status: 'in_progress'
        })
        .eq('id', interviewId)

    } catch (error: any) {
      console.error('Error:', error)
      setStreamContent('抱歉，AI响应出现问题，请重试。' + (error.message ? ': ' + error.message : ''))
      setIsStreaming(false)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    await supabase
      .from('interviews')
      .update({ status: 'completed' })
      .eq('id', interviewId)

    router.push('/interview/list')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/interview/list" className="text-gray-600 hover:text-gray-900">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              {interview.title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {messages.length > 0 && (
              <button
                onClick={handleFinish}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
              >
                完成访谈
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {step === 'info' ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">开始访谈</h2>
            <p className="text-gray-600 mb-6">
              准备好后，点击下方按钮开始AI访谈。AI将引导您完成整个流程。
            </p>
            <button
              onClick={handleStartChat}
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700"
            >
              开始访谈
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow flex flex-col h-[calc(100vh-200px)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-900">
                    <div className="whitespace-pre-wrap">{streamContent}</div>
                    <span className="animate-pulse">▊</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={loading ? 'AI思考中...' : '输入您的回答...'}
                  disabled={loading || isStreaming}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || isStreaming || !input.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
