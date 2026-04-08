import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 访谈系统提示词
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

export async function sendMessageToAI(messages: { role: 'user' | 'assistant'; content: string }[]) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
      ...messages,
    ],
    stream: false,
  })

  return response.choices[0]?.message?.content || ''
}

export async function* streamMessageToAI(messages: { role: 'user' | 'assistant'; content: string }[]) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
      ...messages,
    ],
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) {
      yield content
    }
  }
}
