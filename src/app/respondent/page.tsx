'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RespondentPage() {
  const router = useRouter()

  const handleStart = () => {
    // 直接跳转到访谈页面
    router.push('/respondent/chat/test-interview')
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">公</span>
            </div>
            <span className="text-xl font-semibold text-gray-800">公务员业务能力评估</span>
          </div>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            管理员入口
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            学术研究项目
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            基层公务员业务能力
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              评估访谈
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            通过一对一访谈，深入了解您在日常工作中的实践与思考，助力公务员队伍能力建设与职业发展。
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-white">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">约20分钟</h3>
            <p className="text-sm text-gray-500">轻松的对话式访谈</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-white">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">匿名保护</h3>
            <p className="text-sm text-gray-500">您的信息完全保密</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-white">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">双向交流</h3>
            <p className="text-sm text-gray-500">分享您的真实经验</p>
          </div>
        </div>

        {/* About */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-10 border border-white mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">关于本次访谈</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              本次访谈是<span className="text-blue-600 font-medium">学术研究项目</span>的一部分，旨在了解基层公务员在日常工作中如何理解、优化和改进业务流程。
            </p>
            <p>
              访谈内容将围绕您的工作职责、业务流程、场景应对和绩效改进等方面展开。您只需根据实际情况分享工作经验即可，没有"标准答案"。
            </p>
            <p>
              您的分享对于理解公务员队伍的能力建设需求具有重要价值，有助于为未来培训与政策制定提供参考。
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleStart}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg px-12 py-4 rounded-full hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
          >
            开始参与访谈
          </button>
          <p className="mt-4 text-sm text-gray-500">
            预计用时约 20 分钟
          </p>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center text-sm text-gray-400">
          <p>本项目仅用于学术研究，不会用于任何商业用途</p>
          <p className="mt-1">如有疑问，请联系项目研究人员</p>
        </div>
      </main>
    </div>
  )
}
