import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { inviteCode } = body

    if (!inviteCode || inviteCode.trim() === '') {
      return NextResponse.json({ error: '请输入访谈邀请码' }, { status: 400 })
    }

    // 创建 Supabase 客户端（使用服务角色密钥以避免 RLS 限制）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 查询匹配的访谈
    const { data: interview, error } = await supabase
      .from('interviews')
      .select('id, title, status, invite_code')
      .eq('invite_code', inviteCode.trim())
      .single()

    if (error || !interview) {
      return NextResponse.json({ error: '邀请码无效，请检查后重新输入' }, { status: 404 })
    }

    if (interview.status === 'completed') {
      return NextResponse.json({ error: '该访谈已完成，无法再次参与' }, { status: 400 })
    }

    // 返回访谈ID供前端跳转
    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      title: interview.title
    })

  } catch (error: any) {
    console.error('Validate invite code error:', error)
    return NextResponse.json({ error: '验证失败，请稍后重试' }, { status: 500 })
  }
}
