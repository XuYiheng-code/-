'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InterviewList() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        fetchInterviews(user.id)
      }
    }
    checkUser()
  }, [router, supabase])

  const fetchInterviews = async (userId: string) => {
    const { data } = await supabase
      .from('interviews')
      .select('*')
      .eq('interviewer_id', userId)
      .order('created_at', { ascending: false })

    setInterviews(data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: '待开始' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: '进行中' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '已完成' },
    }
    const s = statusMap[status] || statusMap.pending
    return <span className={`px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>{s.label}</span>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              访谈记录
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {interviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">暂无访谈记录</p>
              <Link href="/interview/create" className="text-blue-600 hover:underline mt-2 inline-block">
                创建第一个访谈
              </Link>
            </div>
          ) : (
            interviews.map((interview) => (
              <div key={interview.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{interview.title}</h3>
                  <p className="text-sm text-gray-500">{interview.description || '无描述'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(interview.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(interview.status)}
                  <Link
                    href={`/interview/${interview.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {interview.status === 'completed' ? '查看' : '继续'}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
