'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RespondentPage() {
  const router = useRouter()

  const handleStart = () => {
    router.push('/respondent/chat/test-interview')
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Apple-style Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-semibold text-sm">公</span>
            </div>
            <span className="text-sm font-medium text-gray-700">公务员业务能力访谈</span>
          </div>
          <Link
            href="/login"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            管理员
          </Link>
        </div>
      </header>

      {/* Hero Section - Apple Style */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-500 mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            学术研究项目
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 tracking-tight">
            基层公务员业务能力
            <br />
            <span className="text-gray-400">访谈系统</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-500 mb-12 leading-relaxed max-w-xl mx-auto">
            通过一对一对话，深入了解您的工作实践与思考，助力公务员队伍能力建设。
          </p>

          {/* CTA Button - Apple Style */}
          <button
            type="button"
            onClick={handleStart}
            className="group bg-black text-white text-base px-8 py-3.5 rounded-full hover:bg-gray-800 transition-all duration-300 inline-flex items-center gap-2"
          >
            <span>开始访谈</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <p className="mt-4 text-sm text-gray-400">
            预计用时 20 分钟
          </p>
        </div>

        {/* Features - Apple Grid */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">约20分钟</h3>
              <p className="text-sm text-gray-400">轻松的对话式访谈</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">隐私保护</h3>
              <p className="text-sm text-gray-400">信息完全保密</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.153-.592 9.864 9.864 0 00-3.852-1.275 9.829 9.829 0 01-3.917-2.417C6.5 13.086 4.5 10.5 4.5 7.5 4.5 4.5 6.5 4.5 7.5c0 1.5.5 3 1.5 4.5 0 1.5-.5 3-1 4 1 1 2 3 2 3s2-1.5 3-3c.5-.5 1-1.5 1-2.5z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">双向交流</h3>
              <p className="text-sm text-gray-400">分享真实工作经验</p>
            </div>
          </div>
        </div>

        {/* About Section - Apple Style */}
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">关于访谈</h2>
            <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
              <p>
                本访谈是<span className="text-gray-700">学术研究项目</span>的一部分，旨在了解基层公务员的业务理解与实践。
              </p>
              <p>
                您只需根据实际情况分享工作经验，没有"标准答案"。您的分享对公务员能力建设具有重要参考价值。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-xs text-gray-300">仅用于学术研究，不会用于商业用途</p>
        </div>
      </main>
    </div>
  )
}
