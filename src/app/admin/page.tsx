'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [batchAnalyzing, setBatchAnalyzing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [viewingInterview, setViewingInterview] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        fetchAllInterviews()
      }
    }
    checkUser()
  }, [router, supabase])

  const fetchAllInterviews = async () => {
    setLoading(true)
    try {
      // 使用 API 获取所有数据（绕过 RLS）
      const response = await fetch('/api/interviews-all')
      const result = await response.json()
      // 确保 analysis 是对象
      const processed = (result.data || []).map((item: any) => ({
        ...item,
        analysis: typeof item.analysis === 'string' ? JSON.parse(item.analysis) : item.analysis
      }))
      setInterviews(processed)
    } catch (error) {
      console.error('Failed to fetch interviews:', error)
      // 如果 API 失败，尝试直接使用 supabase
      const { data } = await supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false })
      setInterviews(data || [])
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleStatusChange = async (interviewId: string, newStatus: string) => {
    try {
      await supabase
        .from('interviews')
        .update({ status: newStatus })
        .eq('id', interviewId)

      fetchAllInterviews()
    } catch (error) {
      alert('状态更新失败')
    }
  }

  const handleAnalyze = async (interview: any) => {
    if (!interview.messages || interview.messages.length === 0) {
      alert('没有可分析的访谈数据')
      return
    }

    setAnalyzingId(interview.id)
    setShowAnalysis(false)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: interview.messages,
          interviewTitle: interview.title
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      await supabase
        .from('interviews')
        .update({ analysis: data.analysis })
        .eq('id', interview.id)

      setAnalysisResult(data.analysis)
      setShowAnalysis(true)

      fetchAllInterviews()

    } catch (error: any) {
      alert('分析失败: ' + error.message)
    } finally {
      setAnalyzingId(null)
    }
  }

  // 批量分析所有已完成但未分析的访谈
  const handleBatchAnalyze = async () => {
    const toAnalyze = interviews.filter(i => i.status === 'completed' && !i.analysis && i.messages?.length > 0)

    if (toAnalyze.length === 0) {
      alert('没有需要分析的访谈')
      return
    }

    setBatchAnalyzing(true)

    for (const interview of toAnalyze) {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: interview.messages,
            interviewTitle: interview.title
          })
        })

        const data = await response.json()

        if (!data.error) {
          await supabase
            .from('interviews')
            .update({ analysis: data.analysis })
            .eq('id', interview.id)
        }
      } catch (error) {
        console.error('分析失败:', interview.id, error)
      }
    }

    setBatchAnalyzing(false)
    fetchAllInterviews()
    alert(`批量分析完成！共分析 ${toAnalyze.length} 个访谈`)
  }

  // 选择/取消选择单个
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === interviews.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(interviews.map(i => i.id)))
    }
  }

  // 选择待分析的记录
  const selectPending = () => {
    const pendingIds = interviews
      .filter(i => i.status === 'completed' && !i.analysis && i.messages?.length > 0)
      .map(i => i.id)
    setSelectedIds(new Set(pendingIds))
  }

  // 选择性批量分析
  const handleSelectiveBatchAnalyze = async () => {
    const toAnalyze = interviews.filter(i =>
      selectedIds.has(i.id) &&
      i.status === 'completed' &&
      !i.analysis &&
      i.messages?.length > 0
    )

    if (toAnalyze.length === 0) {
      alert('所选记录中没有需要分析的访谈')
      return
    }

    setBatchAnalyzing(true)

    for (const interview of toAnalyze) {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: interview.messages,
            interviewTitle: interview.title
          })
        })

        const data = await response.json()

        if (!data.error) {
          await supabase
            .from('interviews')
            .update({ analysis: data.analysis })
            .eq('id', interview.id)
        }
      } catch (error) {
        console.error('分析失败:', interview.id, error)
      }
    }

    setBatchAnalyzing(false)
    setSelectedIds(new Set())
    fetchAllInterviews()
    alert(`批量分析完成！共分析 ${toAnalyze.length} 个访谈`)
  }

  const exportToJSON = () => {
    const dataStr = JSON.stringify(interviews, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interviews_${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const exportToCSV = () => {
    if (interviews.length === 0) return

    const headers = ['ID', '标题', '描述', '状态', '创建时间']
    const rows = interviews.map(i => [
      i.id,
      i.title,
      i.description || '',
      i.status,
      new Date(i.created_at).toLocaleString('zh-CN')
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interviews_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreLevel = (score: number) => {
    if (score >= 80) return '优秀'
    if (score >= 60) return '良好'
    return '待提升'
  }

  // 计算统计数据
  const getStats = () => {
    const analyzed = interviews.filter(i => i.analysis)
    if (analyzed.length === 0) return null

    const scores = analyzed.map(i => i.analysis.capabilityScores || {})
    const dimensions = analyzed.map(i => i.analysis.dimensionScores || {})

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0

    return {
      count: analyzed.length,
      dimensionAvg: {
        businessCognitive: avg(dimensions.map(d => d.businessCognitive || 0)),
        businessContextual: avg(dimensions.map(d => d.businessContextual || 0)),
        performanceImprovement: avg(dimensions.map(d => d.performanceImprovement || 0)),
      },
      indicatorAvg: {
        knowledgeIntegration: avg(scores.map(s => s.knowledgeIntegration || 0)),
        roleAwareness: avg(scores.map(s => s.roleAwareness || 0)),
        identityOrientation: avg(scores.map(s => s.identityOrientation || 0)),
        scenarioDescription: avg(scores.map(s => s.scenarioDescription || 0)),
        adaptability: avg(scores.map(s => s.adaptability || 0)),
        uncertaintyCoping: avg(scores.map(s => s.uncertaintyCoping || 0)),
        goalAwareness: avg(scores.map(s => s.goalAwareness || 0)),
        goalDecomposition: avg(scores.map(s => s.goalDecomposition || 0)),
        efficiencyImprovement: avg(scores.map(s => s.efficiencyImprovement || 0)),
      }
    }
  }

  const stats = getStats()

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
            <h1 className="text-xl font-bold text-gray-900">
              管理后台
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-4 py-2 rounded-md text-sm ${showStats ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'}`}
            >
              {showStats ? '返回列表' : '统计分析'}
            </button>
            <button
              onClick={fetchAllInterviews}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              刷新数据
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计分析视图 */}
        {showStats && stats ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">已分析访谈数</p>
                <p className="text-3xl font-bold text-purple-600">{stats.count}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">业务认知能力平均</p>
                <p className="text-3xl font-bold text-blue-600">{stats.dimensionAvg.businessCognitive}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">业务情境化平均</p>
                <p className="text-3xl font-bold text-green-600">{stats.dimensionAvg.businessContextual}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">绩效改进平均</p>
                <p className="text-3xl font-bold text-purple-600">{stats.dimensionAvg.performanceImprovement}</p>
              </div>
            </div>

            {/* 三大维度柱状图 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">三维度平均得分</h3>
              <div className="space-y-4">
                {[
                  { label: '业务认知能力', value: stats.dimensionAvg.businessCognitive, color: 'bg-blue-500' },
                  { label: '业务情境化能力', value: stats.dimensionAvg.businessContextual, color: 'bg-green-500' },
                  { label: '绩效改进能力', value: stats.dimensionAvg.performanceImprovement, color: 'bg-purple-500' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="w-40 text-sm">{item.label}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 mr-3">
                      <div className={`${item.color} h-6 rounded-full flex items-center justify-end pr-2`} style={{ width: `${item.value}%` }}>
                        <span className="text-white text-sm font-bold">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 九指标雷达图效果 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">九项指标得分分布</h3>
              <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                {[
                  { label: '知识整合', value: stats.indicatorAvg.knowledgeIntegration },
                  { label: '角色认知', value: stats.indicatorAvg.roleAwareness },
                  { label: '身份导向', value: stats.indicatorAvg.identityOrientation },
                  { label: '场景描述', value: stats.indicatorAvg.scenarioDescription },
                  { label: '调适能力', value: stats.indicatorAvg.adaptability },
                  { label: '不确定性应对', value: stats.indicatorAvg.uncertaintyCoping },
                  { label: '目标认知', value: stats.indicatorAvg.goalAwareness },
                  { label: '目标分解', value: stats.indicatorAvg.goalDecomposition },
                  { label: '效率提升', value: stats.indicatorAvg.efficiencyImprovement },
                ].map((item, idx) => (
                  <div key={idx} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke={item.value >= 80 ? '#22c55e' : item.value >= 60 ? '#eab308' : '#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${item.value} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                        {item.value}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 详细指标表 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">指标</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均分</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">等级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">进度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { cat: '业务认知能力', items: [
                      { name: '知识整合', val: stats.indicatorAvg.knowledgeIntegration },
                      { name: '角色认知', val: stats.indicatorAvg.roleAwareness },
                      { name: '身份导向', val: stats.indicatorAvg.identityOrientation },
                    ]},
                    { cat: '业务情境化能力', items: [
                      { name: '场景描述', val: stats.indicatorAvg.scenarioDescription },
                      { name: '调适能力', val: stats.indicatorAvg.adaptability },
                      { name: '不确定性应对', val: stats.indicatorAvg.uncertaintyCoping },
                    ]},
                    { cat: '绩效改进能力', items: [
                      { name: '目标认知', val: stats.indicatorAvg.goalAwareness },
                      { name: '目标分解', val: stats.indicatorAvg.goalDecomposition },
                      { name: '效率提升', val: stats.indicatorAvg.efficiencyImprovement },
                    ]},
                  ].map((cat, ci) => (
                    cat.items.map((item, ii) => (
                      <tr key={`${ci}-${ii}`}>
                        <td className="px-6 py-3 text-sm text-gray-900">{ci === 0 && ii === 0 ? cat.cat : ii === 0 && ci > 0 ? cat.cat : ''} {item.name}</td>
                        <td className="px-6 py-3 text-sm font-bold">{item.val}</td>
                        <td className="px-6 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs ${item.val >= 80 ? 'bg-green-100 text-green-800' : item.val >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{getScoreLevel(item.val)}</span></td>
                        <td className="px-6 py-3 w-32">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${getScoreColor(item.val)}`} style={{ width: `${item.val}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 列表视图 */
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">总访谈数</p>
                <p className="text-3xl font-bold text-gray-900">{interviews.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-3xl font-bold text-green-600">{interviews.filter(i => i.status === 'completed').length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">已分析</p>
                <p className="text-3xl font-bold text-purple-600">{interviews.filter(i => i.analysis).length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">待分析</p>
                <p className="text-3xl font-bold text-blue-600">
                  {interviews.filter(i => i.status === 'completed' && !i.analysis).length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">数据导出与分析</h2>
                <span className="text-sm text-gray-500">已选 {selectedIds.size} 项</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={selectPending}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  选中待分析
                </button>
                <button
                  onClick={handleSelectiveBatchAnalyze}
                  disabled={batchAnalyzing || selectedIds.size === 0}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm disabled:opacity-50"
                >
                  {batchAnalyzing ? '分析中...' : `分析选中 (${selectedIds.size})`}
                </button>
                <button
                  onClick={handleBatchAnalyze}
                  disabled={batchAnalyzing || interviews.filter(i => i.status === 'completed' && !i.analysis).length === 0}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm disabled:opacity-50"
                >
                  {batchAnalyzing ? '批量分析中...' : '批量分析全部'}
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm"
                >
                  查看分析历史
                </button>
                <button
                  onClick={exportToJSON}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  导出 JSON
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  导出 CSV
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === interviews.length && interviews.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">访谈标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">分析</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interviews.map((interview) => (
                    <tr key={interview.id} className={selectedIds.has(interview.id) ? 'bg-indigo-50' : ''}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(interview.id)}
                          onChange={() => toggleSelect(interview.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{interview.title}</div>
                        <div className="text-sm text-gray-500">{interview.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={interview.status}
                          onChange={(e) => handleStatusChange(interview.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${
                            interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                            interview.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="pending">待开始</option>
                          <option value="in_progress">进行中</option>
                          <option value="completed">已完成</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {interview.analysis ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">已分析</span>
                        ) : interview.status === 'completed' ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">待分析</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(interview.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button onClick={() => setViewingInterview(interview)} className="text-blue-600 hover:text-blue-900">查看</button>
                        {interview.status === 'completed' && (
                          <button onClick={() => handleAnalyze(interview)} disabled={analyzingId === interview.id} className="text-purple-600 hover:text-purple-900 disabled:opacity-50">
                            {analyzingId === interview.id ? '分析中...' : (interview.analysis ? '重新分析' : '分析')}
                          </button>
                        )}
                        {interview.analysis && (
                          <button onClick={() => { setAnalysisResult(interview.analysis); setShowAnalysis(true); }} className="text-green-600 hover:text-green-900">查看分析</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* 分析结果弹窗 */}
      {showAnalysis && analysisResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">访谈分析结果</h2>
              <button onClick={() => setShowAnalysis(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            {/* 基本情况 */}
            {analysisResult.basicInfo && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">受访者基本情况</h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">岗位名称</p>
                      <p className="text-sm font-medium text-gray-900">{analysisResult.basicInfo.position || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">所属部门</p>
                      <p className="text-sm font-medium text-gray-900">{analysisResult.basicInfo.department || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">工作年限</p>
                      <p className="text-sm font-medium text-gray-900">{analysisResult.basicInfo.workYears || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">业务类型</p>
                      <p className="text-sm font-medium text-gray-900">{analysisResult.basicInfo.businessType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">综合评分</p>
                      {analysisResult.dimensionScores && (
                        <p className="text-lg font-bold text-blue-600">
                          {Math.round(((analysisResult.dimensionScores.businessCognitive || 0) + (analysisResult.dimensionScores.businessContextual || 0) + (analysisResult.dimensionScores.performanceImprovement || 0)) / 3)}
                        </p>
                      )}
                    </div>
                  </div>
                  {analysisResult.basicInfo.responsibility && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-500">核心职责</p>
                      <p className="text-sm text-gray-700">{analysisResult.basicInfo.responsibility}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 语言分析 */}
            {analysisResult.languageAnalysis && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">语言分析</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>回答完整性：</strong>{analysisResult.languageAnalysis.completeness}</p>
                  <p><strong>逻辑性：</strong>{analysisResult.languageAnalysis.logic}</p>
                  <p><strong>专业性：</strong>{analysisResult.languageAnalysis.professional}</p>
                  <p className="mt-2">{analysisResult.languageAnalysis.summary}</p>
                </div>
              </div>
            )}

            {/* 三维度综合评分 */}
            {analysisResult.dimensionScores && (() => {
              const dims = analysisResult.dimensionScores
              const avgScore = Math.round(((dims.businessCognitive || 0) + (dims.businessContextual || 0) + (dims.performanceImprovement || 0)) / 3)
              return (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">综合评分</h3>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 mb-4 text-white text-center">
                    <p className="text-sm opacity-90">综合能力评分</p>
                    <p className="text-4xl font-bold">{avgScore}</p>
                    <p className="text-sm opacity-90">{getScoreLevel(avgScore)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded text-center"><p className="text-sm text-blue-600">业务认知</p><p className="text-2xl font-bold">{dims.businessCognitive}</p></div>
                    <div className="bg-green-50 p-4 rounded text-center"><p className="text-sm text-green-600">业务情境化</p><p className="text-2xl font-bold">{dims.businessContextual}</p></div>
                    <div className="bg-purple-50 p-4 rounded text-center"><p className="text-sm text-purple-600">绩效改进</p><p className="text-2xl font-bold">{dims.performanceImprovement}</p></div>
                  </div>
                </div>
              )
            })()}

            {/* 九指标及评分依据 */}
            {analysisResult.capabilityScores && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">九项指标及评分依据</h3>
                {[
                  { cat: '业务认知能力', color: 'blue', items: [
                    { k: 'knowledgeIntegration', n: '知识整合' },
                    { k: 'roleAwareness', n: '角色认知' },
                    { k: 'identityOrientation', n: '身份导向' },
                  ]},
                  { cat: '业务情境化能力', color: 'green', items: [
                    { k: 'scenarioDescription', n: '场景描述' },
                    { k: 'adaptability', n: '调适能力' },
                    { k: 'uncertaintyCoping', n: '不确定性应对' },
                  ]},
                  { cat: '绩效改进能力', color: 'purple', items: [
                    { k: 'goalAwareness', n: '目标认知' },
                    { k: 'goalDecomposition', n: '目标分解' },
                    { k: 'efficiencyImprovement', n: '效率提升' },
                  ]},
                ].map((cat, ci) => (
                  <div key={ci} className="mb-6">
                    <h4 className={`font-medium text-${cat.color}-600 mb-3`}>{cat.cat}</h4>
                    <div className="space-y-4">
                      {cat.items.map(item => {
                        const indicatorData = analysisResult.indicatorAnalysis?.[item.k] || {}
                        return (
                          <div key={item.k} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <span className="w-28 text-sm font-medium">{item.n}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-4 mr-2">
                                <div className={`${getScoreColor(analysisResult.capabilityScores[item.k])} h-4 rounded-full flex items-center justify-end pr-2`} style={{ width: `${analysisResult.capabilityScores[item.k]}%` }}>
                                  <span className="text-white text-xs font-bold">{analysisResult.capabilityScores[item.k]}</span>
                                </div>
                              </div>
                            </div>
                            {/* 评分依据 */}
                            <div className="text-sm">
                              {indicatorData.evidence && (
                                <p className="text-gray-600 mb-1"><span className="font-medium">依据：</span>{indicatorData.evidence}</p>
                              )}
                              {indicatorData.reasoning && (
                                <p className="text-gray-500"><span className="font-medium">理由：</span>{indicatorData.reasoning}</p>
                              )}
                              {!indicatorData.evidence && !indicatorData.reasoning && (
                                <p className="text-gray-400 italic">暂无评分依据</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {analysisResult.summary && (
              <div>
                <h3 className="text-lg font-semibold mb-2">总结</h3>
                <div className="bg-blue-50 p-4 rounded"><p>{analysisResult.summary}</p></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 查看访谈内容弹窗 */}
      {viewingInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">访谈内容详情</h2>
              <button onClick={() => setViewingInterview(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            {/* 基本信息 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">基本信息</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">标题：</span>{viewingInterview.title}</div>
                <div><span className="text-gray-500">描述：</span>{viewingInterview.description || '-'}</div>
                <div><span className="text-gray-500">状态：</span>{viewingInterview.status}</div>
                <div><span className="text-gray-500">创建时间：</span>{new Date(viewingInterview.created_at).toLocaleString('zh-CN')}</div>
              </div>
            </div>

            {/* 对话内容 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">对话内容</h3>
              <div className="space-y-4">
                {viewingInterview.messages && viewingInterview.messages.length > 0 ? (
                  viewingInterview.messages.map((msg: any, idx: number) => (
                    <div key={idx} className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                      <div className="text-xs text-gray-500 mb-1">
                        {msg.role === 'user' ? '访谈者' : '受访者'}
                      </div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">暂无对话内容</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 分析历史记录弹窗 */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">分析历史记录</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            {/* 统计概览 */}
            {(() => {
              const analyzedList = interviews.filter(i => i.analysis && i.analysis.dimensionScores)
              const dims = analyzedList.map(i => i.analysis.dimensionScores)
              const avgCognitive = dims.length ? Math.round(dims.reduce((s, d) => s + (d.businessCognitive || 0), 0) / dims.length) : 0
              const avgContextual = dims.length ? Math.round(dims.reduce((s, d) => s + (d.businessContextual || 0), 0) / dims.length) : 0
              const avgPerformance = dims.length ? Math.round(dims.reduce((s, d) => s + (d.performanceImprovement || 0), 0) / dims.length) : 0
              const avgOverall = dims.length ? Math.round((avgCognitive + avgContextual + avgPerformance) / 3) : 0
              const excellent = dims.filter(d => (d.businessCognitive + d.businessContextual + d.performanceImprovement) / 3 >= 80).length
              const good = dims.filter(d => {
                const avg = (d.businessCognitive + d.businessContextual + d.performanceImprovement) / 3
                return avg >= 60 && avg < 80
              }).length
              const poor = dims.filter(d => (d.businessCognitive + d.businessContextual + d.performanceImprovement) / 3 < 60).length

              return (
                <div className="space-y-4 mb-6">
                  {/* 总体统计 */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">{analyzedList.length}</p>
                      <p className="text-sm text-gray-600">已分析总数</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{avgOverall}</p>
                      <p className="text-sm text-gray-600">平均综合得分</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{excellent}</p>
                      <p className="text-sm text-gray-600">优秀 (≥80分)</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{poor}</p>
                      <p className="text-sm text-gray-600">待提升 (&lt;60分)</p>
                    </div>
                  </div>

                  {/* 三个维度得分分布 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">各维度平均得分</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-sm text-blue-600 mb-1">业务认知能力</p>
                        <p className="text-2xl font-bold text-blue-700">{avgCognitive}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: avgCognitive + '%' }}></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-sm text-green-600 mb-1">业务情境化能力</p>
                        <p className="text-2xl font-bold text-green-700">{avgContextual}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: avgContextual + '%' }}></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-sm text-purple-600 mb-1">绩效改进能力</p>
                        <p className="text-2xl font-bold text-purple-700">{avgPerformance}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: avgPerformance + '%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 分数段分布 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">得分分布</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-green-100 p-2 rounded text-center">
                        <p className="text-lg font-bold text-green-700">{excellent}</p>
                        <p className="text-xs text-green-600">优秀</p>
                      </div>
                      <div className="flex-1 bg-yellow-100 p-2 rounded text-center">
                        <p className="text-lg font-bold text-yellow-700">{good}</p>
                        <p className="text-xs text-yellow-600">良好</p>
                      </div>
                      <div className="flex-1 bg-red-100 p-2 rounded text-center">
                        <p className="text-lg font-bold text-red-700">{poor}</p>
                        <p className="text-xs text-red-600">待提升</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 历史记录列表 */}
            <div className="space-y-3">
              {interviews.filter(i => i.analysis).length === 0 ? (
                <p className="text-center text-gray-500 py-8">暂无分析记录</p>
              ) : (
                interviews.filter(i => i.analysis).map((interview) => {
                  const dims = interview.analysis?.dimensionScores
                  const avgScore = dims
                    ? Math.round(((dims.businessCognitive || 0) + (dims.businessContextual || 0) + (dims.performanceImprovement || 0)) / 3)
                    : 0
                  return (
                    <div key={interview.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{interview.title}</h3>
                          <p className="text-sm text-gray-500">{interview.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {avgScore}
                          </span>
                          <button
                            onClick={() => { setAnalysisResult(interview.analysis); setShowAnalysis(true); }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            查看详情
                          </button>
                        </div>
                      </div>
                      {/* 三个维度得分 */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="bg-blue-50 p-2 rounded text-center">
                          <p className="text-xs text-blue-600">业务认知</p>
                          <p className="font-bold text-blue-700">{dims?.businessCognitive || '-'}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded text-center">
                          <p className="text-xs text-green-600">业务情境化</p>
                          <p className="font-bold text-green-700">{dims?.businessContextual || '-'}</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded text-center">
                          <p className="text-xs text-purple-600">绩效改进</p>
                          <p className="font-bold text-purple-700">{dims?.performanceImprovement || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
