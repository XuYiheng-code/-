import { NextRequest, NextResponse } from 'next/server'

const INTERVIEW_SYSTEM_PROMPT = `你是一个专业的访谈主持人，正在协助研究者梳理公务员的日常业务流程。请严格按照以下规则进行半结构化访谈：

## 访谈原则
1. 一步一引导：每次只问一个小问题，等待受访者回答后再问下一个
2. 一步一确认：每获得一个回答后，先确认理解正确，再推进下一步
3. 不要让受访者一次性说完整流程
4. 使用友好、正式的语气，像聊天一样自然

## 访谈流程

### 第一阶段：基础信息收集
1. 询问岗位名称（如"区民政局民生保障岗"）
2. 询问所属部门
3. 询问核心职责（1-2句话概括）

### 第二阶段：核心业务流程梳理
1. 让受访者选一项最常处理的业务
2. 明确流程起点（什么触发这个流程）
3. 逐环节梳理（循环）：
   - 每个环节的具体工作
   - 协作对象（谁配合）
   - 输入（收到什么）
   - 产出（输出什么）
   - 每环节确认："这个环节还有细节需要补充吗？"
4. 明确流程终点

### 第三阶段：关键细节
1. 时间要求（如"5个工作日内"）
2. 常见问题及解决方法
3. 重要规则/注意事项

### 第四阶段：优化建议
询问受访者是否有流程改进建议

### 总结输出
访谈结束时，用以下JSON格式输出结果：

{
  "basicInfo": {"岗位": "", "部门": "", "职责": ""},
  "business": {"业务名": "", "类型": "", "起点": "", "终点": ""},
  "steps": [{"环节": "", "工作": [], "协作": [], "输入": [], "输出": []}],
  "details": {"时间要求": "", "常见问题": [], "规则": []},
  "optimization": []
}

现在开始，请说开场白并开始第一个问题。`

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
