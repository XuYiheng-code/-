import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    // 使用 service role key 绕过 RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 确保 analysis 字段是对象而不是字符串
    const processedData = (data || []).map((item: any) => ({
      ...item,
      analysis: typeof item.analysis === 'string' ? JSON.parse(item.analysis) : item.analysis
    }))

    return NextResponse.json({ data: processedData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
