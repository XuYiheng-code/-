'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function RespondentChatPage() {
  const params = useParams()
  const interviewId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [interview, setInterview] = useState<any>(null)
  const [step, setStep] = useState<'info' | 'chat'>('info')
  const router = useRouter()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [error, setError] = useState('')
  const [isLocalMode] = useState(true) // 本地模式，不保存到数据库
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  const handleStartChat = async () => {
    setStep('chat')
    setLoading(true)
    setIsStreaming(true)
    setStreamContent('正在连接AI访谈助手，请稍候...\n（如果长时间无响应，请刷新页面重试）')

    try {
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
      const assistantMessage: Message = { role: 'assistant', content: aiMessage }
      setMessages([assistantMessage])
      setStreamContent('')
      setIsStreaming(false)
      setLoading(false)

      // 保存到数据库（非本地模式）
      if (!isLocalMode && interview?.id) {
        await supabase
          .from('interviews')
          .update({
            messages: [assistantMessage],
            status: 'in_progress'
          })
          .eq('id', interview.id)
      }

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

  // 语音识别功能
  const handleVoiceInput = () => {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别功能。\n\n请使用 Chrome 或 Edge 浏览器，并确保网址为 https:// 开头。')
      return
    }

    if (isRecording) {
      // 停止录音
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
      return
    }

    // 开始录音
    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.lang = 'zh-CN' // 设置为中文
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsRecording(true)
      }

      // 实时识别结果显示
      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        console.log('语音识别结果:', transcript)
        // 直接设置识别结果，不管是否final都显示
        setInput(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error)
        setIsRecording(false)

        if (event.error === 'not-allowed') {
          alert('请在浏览器地址栏左侧点击"锁定"或"设置"按钮，允许使用麦克风。')
        } else if (event.error === 'no-speech') {
          alert('未检测到语音，请再说一次。')
        } else if (event.error === 'network') {
          alert('网络错误，请检查网络连接。')
        } else {
          alert('语音识别出错: ' + event.error + '\n请确保使用 Chrome 或 Edge 浏览器。')
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    } catch (err) {
      alert('无法启动语音识别，请确保：\n1. 使用 Chrome 或 Edge 浏览器\n2. 已允许麦克风权限\n3. 网络连接正常')
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

      // 保存到数据库（非本地模式）
      if (!isLocalMode && interview?.id) {
        await supabase
          .from('interviews')
          .update({
            messages: [...currentMessages, assistantMessage],
            status: 'in_progress'
          })
          .eq('id', interview.id)
      }

    } catch (error: any) {
      console.error('Error:', error)
      setStreamContent('抱歉，AI响应出现问题，请重试。' + (error.message ? ': ' + error.message : ''))
      setIsStreaming(false)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    if (!isLocalMode && interview?.id) {
      await supabase
        .from('interviews')
        .update({ status: 'completed' })
        .eq('id', interview.id)
    }

    router.push('/respondent/complete')
  }

  const handleExit = () => {
    router.push('/respondent')
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }

  if (!interview && !isLocalMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  // 本地模式或已有访谈
  const displayInterview = interview || {
    id: 'local',
    title: '公务员业务能力访谈'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={handleExit} className="text-gray-600 hover:text-gray-900">
              ← 退出
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {displayInterview.title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {messages.length > 3 && (
              <button
                onClick={handleFinish}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
              >
                完成访谈
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {step === 'info' ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.153-.592 9.864 9.864 0 00-3.852-1.275 9.829 9.829 0 01-3.917-2.417C6.5 13.086 4.5 10.5 4.5 7.5 4.5 4.5 6.5 4.5 7.5c0 1.5.5 3 1.5 4.5 0 1.5-.5 3-1 4 1 1 2 3 2 3s2-1.5 3-3c.5-.5 1-1.5 1-2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">访谈即将开始</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              感谢您的参与。AI访谈助手将引导您完成整个访谈流程，请根据自己的实际工作经验如实回答即可。
            </p>
            <button
              onClick={handleStartChat}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-full hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300"
            >
              开始访谈
            </button>
            <p className="mt-4 text-sm text-gray-500">
              预计用时约 20 分钟
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl flex flex-col h-[calc(100vh-200px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-2xl bg-gray-100 text-gray-900">
                    <div className="whitespace-pre-wrap">{streamContent}</div>
                    <span className="animate-pulse">▊</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={loading ? 'AI思考中...' : '请输入您的回答...'}
                  disabled={loading || isStreaming}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleVoiceInput}
                  disabled={loading || isStreaming}
                  className={`p-3 rounded-lg transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={isRecording ? '点击停止录音' : '点击开始语音输入'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || isStreaming || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
