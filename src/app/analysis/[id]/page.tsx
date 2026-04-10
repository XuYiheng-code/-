'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Interview {
  id: string
  title: string
  created_at: string
  status: string
  messages: any[]
  analysis: any
}

export default function AnalysisDetailPage() {
  const params = useParams()
  const interviewId = params.id as string
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadInterview()
  }, [interviewId])

  const loadInterview = async () => {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single()

    if (!error && data) {
      setInterview(data)
    }
    setLoading(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getScoreLevel = (score: number) => {
    if (score >= 80) return '优秀'
    if (score >= 60) return '良好'
    return '一般'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!interview || !interview.analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">未找到分析结果</p>
          <Link href="/analysis" className="text-blue-600 hover:text-blue-900">
            返回列表
          </Link>
        </div>
      </div>
    )
  }

  const { analysis } = interview

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/analysis" className="text-gray-600 hover:text-gray-900">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              {interview.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 综合得分 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">综合评估</h2>
          <div className="flex items-center gap-8">
            <div className={`text-5xl font-bold px-6 py-4 rounded-xl ${getScoreColor(analysis.totalScore)}`}>
              {analysis.totalScore}
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {getScoreLevel(analysis.totalScore)}
              </p>
              <p className="text-gray-500">
                等级评定
              </p>
            </div>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">年龄段</p>
              <p className="font-medium">{analysis.basicInfo?.ageRange || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">职业/身份</p>
              <p className="font-medium">{analysis.basicInfo?.occupation || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">数字技术使用频率</p>
              <p className="font-medium">{analysis.basicInfo?.techUsageFrequency || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">主要使用工具</p>
              <p className="font-medium">
                {analysis.basicInfo?.mainTechTools?.join(', ') || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 三维度得分 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">三维度得分</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">数字意识</h3>
                <span className={`text-xl font-bold ${getScoreColor(analysis.dimensionScores?.digitalAwareness || 0)}`}>
                  {analysis.dimensionScores?.digitalAwareness || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(analysis.dimensionScores?.digitalAwareness || 0)}%` }}
                ></div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">数字知识与技能</h3>
                <span className={`text-xl font-bold ${getScoreColor(analysis.dimensionScores?.digitalKnowledge || 0)}`}>
                  {analysis.dimensionScores?.digitalKnowledge || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(analysis.dimensionScores?.digitalKnowledge || 0)}%` }}
                ></div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">数字应用与实践</h3>
                <span className={`text-xl font-bold ${getScoreColor(analysis.dimensionScores?.digitalApplication || 0)}`}>
                  {analysis.dimensionScores?.digitalApplication || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(analysis.dimensionScores?.digitalApplication || 0)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 优势与不足 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">优势</h2>
            <ul className="space-y-2">
              {(analysis.strengths || []).map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">不足</h2>
            <ul className="space-y-2">
              {(analysis.weaknesses || []).map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 提升建议 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">提升建议</h2>
          <ul className="space-y-2">
            {(analysis.improvementSuggestions || []).map((item: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 总结 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">综合评价</h2>
          <p className="text-gray-700">{analysis.summary}</p>
        </div>
      </main>
    </div>
  )
}
