'use client'

import Link from 'next/link'

export default function RespondentCompletePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">访谈已完成</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            感谢您的宝贵时间和分享。您的回答对于理解基层公务员业务能力建设需求具有重要价值。
          </p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              如有其他问题，请联系项目研究人员
            </p>
            <Link
              href="/respondent"
              className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
