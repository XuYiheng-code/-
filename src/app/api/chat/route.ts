import { NextRequest, NextResponse } from 'next/server'

const INTERVIEW_SYSTEM_PROMPT = `你是一个专业的访谈主持人，正在协助研究者梳理公务员的日常业务流程。请高效地进行半结构化访谈：

## 访谈原则
1. 每次可以问1-2个相关问题，鼓励受访者一次性多说说
2. 保持对话流畅自然，不要频繁确认
3. 使用友好、正式的语气，像聊天一样

## 访谈流程（可以灵活调整顺序）

### 第一阶段：基础信息
快速收集：
- 岗位名称
- 所属部门
- 工作年限

### 第二阶段：核心业务流程（重点）
让受访者详细介绍：
- 最常处理的1-2项核心业务
- 业务的完整流程（从开始到结束）
- 主要协作对象
- 常见的业务场景和应对方式

### 第三阶段：优化建议
询问受访者对现有流程的看法和改进建议

### 总结输出
访谈结束时，简要总结要点并用以下JSON格式输出：

{
  "basicInfo": {"岗位": "", "部门": "", "职责": ""},
  "business": {"业务名": "", "类型": "", "起点": "", "终点": ""},
  "steps": [{"环节": "", "工作": [], "协作": [], "输入": [], "输出": []}],
  "details": {"时间要求": "", "常见问题": [], "规则": []},
  "optimization": []
}

现在开始，请说开场白并开始访谈，鼓励受访者多分享。`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = body.messages || []

    console.log('API called with messages:', messages.length)

    // 转换消息格式
    const qwenMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))

    // 如果是第一条消息（空数组），添加一个初始用户消息
    if (qwenMessages.length === 0) {
      qwenMessages.push({ role: 'user', content: '请开始访谈' })
    }

    // 直接调用阿里云 API
    const apiKey = process.env.DASHSCOPE_API_KEY
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
            ...qwenMessages
          ]
        },
        parameters: {
          result_format: 'message'
        }
      })
    })

    const data = await response.json()

    if (data.code) {
      throw new Error(data.message || data.code)
    }

    const content = data.output?.choices?.[0]?.message?.content || ''

    console.log('Qwen response received, length:', content.length)

    if (!content) {
      return NextResponse.json({ error: 'AI响应为空' }, { status: 500 })
    }

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('DashScope API Error:', error)
    return NextResponse.json(
      { error: error.message || 'AI调用失败', type: error.type },
      { status: 500 }
    )
  }
}
