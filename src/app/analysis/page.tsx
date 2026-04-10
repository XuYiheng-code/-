'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Interview {
  id: string
  title: string
  created_at: string
  status: string
  analysis?: any
}

export default function AnalysisPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadInterviews()
  }, [])

  const loadInterviews = async () => {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setInterviews(data)
    }
    setLoading(false)
  }

  const handleAnalyze = async (interviewId: string) => {
    setAnalyzing(interviewId)

    try {
      // 获取访谈记录
      const { data: interview, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .single()

      if (error || !interview) {
        alert('获取访谈失败')
        setAnalyzing(null)
        return
      }

      const messages = interview.messages || []

      // 调用分析API
      const response = await fetch('/api/analyze/digital-literacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          interviewTitle: interview.title
        })
      })

      const result = await response.json()

      if (result.error) {
        alert('分析失败: ' + result.error)
        setAnalyzing(null)
        return
      }

      // 保存分析结果
      await supabase
        .from('interviews')
        .update({ analysis: result.analysis })
        .eq('id', interviewId)

      // 刷新列表
      loadInterviews()
      setAnalyzing(null)

    } catch (error: any) {
      alert('分析失败: ' + error.message)
      setAnalyzing(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← 返回
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              数字素养访谈分析
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {interviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">暂无访谈记录</p>
            <Link
              href="/interview/create"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              创建访谈
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    访谈标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    综合得分
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{interview.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(interview.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        interview.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : interview.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {interview.status === 'completed' ? '已完成' : interview.status === 'in_progress' ? '进行中' : '待开始'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {interview.analysis?.totalScore ? (
                        <span className={`text-lg font-bold ${getScoreColor(interview.analysis.totalScore)}`}>
                          {interview.analysis.totalScore}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {analyzing === interview.id ? (
                        <span className="text-blue-600">分析中...</span>
                      ) : interview.analysis?.totalScore ? (
                        <Link
                          href={`/analysis/${interview.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          查看详情
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAnalyze(interview.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          开始分析
                        </button>
                      )}
                      <Link
                        href={`/respondent/chat/${interview.id}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        继续访谈
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
