import { NextRequest, NextResponse } from 'next/server'
import { knowledgeBase } from '@/lib/knowledge-base'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const topK = parseInt(searchParams.get('topK') || '3')

    const documents = await knowledgeBase.search(query, topK)

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        source: doc.source,
        keywords: doc.keywords,
        preview: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : '')
      }))
    })
  } catch (error: any) {
    console.error('Knowledge search error:', error)
    return NextResponse.json(
      { error: error.message || '搜索失败' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, includeContent = false } = body

    if (!query) {
      return NextResponse.json({ error: '查询不能为空' }, { status: 400 })
    }

    const documents = await knowledgeBase.search(query, 3)

    const response: any = {
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        source: doc.source,
        keywords: doc.keywords
      }))
    }

    if (includeContent) {
      response.documents = response.documents.map((doc: any, idx: number) => ({
        ...doc,
        content: documents[idx].content
      }))
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Knowledge search error:', error)
    return NextResponse.json(
      { error: error.message || '搜索失败' },
      { status: 500 }
    )
  }
}
