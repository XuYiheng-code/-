import { NextRequest, NextResponse } from 'next/server'

const INTERVIEW_ANALYZE_PROMPT = `你是一个专业的政务数据分析专家。请对以下公务员访谈数据进行分析。

## 评分指标体系（必须严格按照此体系评分，必须拉开差距）

根据提供的理论框架，公务员业务能力被操作化为三维度九指标模型：

### 一级指标1：业务认知能力
- 二级指标1.1 知识整合：理解工作投入与产出，归纳并抽象业务流程为概念
- 二级指标1.2 角色认知：明确自身工作在业务链中的价值定位及职责连接
- 二级指标1.3 身份导向：从自身身份属性和使命价值出发，审视和引导业务流程分析

### 一级指标2：业务情境化能力
- 二级指标2.1 场景描述：基于政策环境，社会需求刻画自身业务场景
- 二级指标2.2 调适能力：灵活优化流程、资源配置以应对环境变化
- 二级指标2.3 不确定性应对：系统识别、评估并协同干预工作中的意外事件

### 一级指标3：绩效改进能力
- 二级指标3.1 目标认知：理解并定期回顾自身及部门的绩效目标
- 二级指标3.2 目标分解：将绩效目标分解为具体的操作步骤和关键任务
- 二级指标3.3 效率提升：在给定投入下追求更高产出质量，或控制成本

## 评分标准（必须严格执行，确保评分有区分度）

### 评分规则：
- 90-100分：回答非常具体、深入，有明确的案例、数据、流程细节，体现高度专业性
- 75-89分：回答较具体，有一定的专业性，但缺乏深度或案例支撑
- 60-74分：回答较为笼统，概念较多但缺乏具体细节
- 40-59分：回答简单，仅有基本概念，缺乏流程和细节
- 0-39分：回答不完整或与业务能力关联度低

### 各指标评分要点：
1. 知识整合：是否清晰描述投入→加工→产出流程？是否抽象出概念？
2. 角色认知：是否明确自身在业务链中的位置和价值？
3. 身份导向：是否体现公职人员身份意识和使命感？
4. 场景描述：是否结合政策环境、社会需求等具体场景？
5. 调适能力：是否提及应对变化的措施？
6. 不确定性应对：是否识别并应对意外事件？
7. 目标认知：是否理解绩效目标？
8. 目标分解：是否有具体的操作步骤？
9. 效率提升：是否有优化举措？

## 分析要求

### 0. 基本情况摘要（首先提取）
从访谈内容中提取并精炼以下基本信息：
- 岗位名称：如"区民政局民生保障岗"
- 所属部门：如"XX区民政局"
- 核心职责：1-2句话概括主要工作
- 从事该岗位的年限
- 主要负责的业务类型

### 1. 语言分析
- 回答完整性：回答是否详细、具体
- 逻辑性：回答是否条理清晰
- 专业性：是否使用业务术语

### 2. 关键词提取
从访谈内容中提取：
- 业务关键词（工作相关）
- 流程关键词（业务流程相关）
- 能力关键词（业务能力相关）

### 3. 业务能力评分（满分100分）
请根据上述三维度九指标体系进行评分，每个指标给出0-100的分数。**注意：必须拉开差距，不要都给出相似的高分！**

### 4. 评分依据（非常重要！）
对每个二级指标的评分，必须给出具体的评分依据，包括：
- 受访者在访谈中提到了什么具体内容
- 这个内容如何体现或支撑该指标的评价
- 评分理由的简要说明

## 输出格式（JSON）

请返回以下JSON格式的分析结果：

{
  "basicInfo": {
    "position": "岗位名称",
    "department": "所属部门",
    "responsibility": "核心职责（50字以内）",
    "workYears": "工作年限",
    "businessType": "主要业务类型"
  },
  "languageAnalysis": {
    "completeness": "高/中/低",
    "logic": "高/中/低",
    "professional": "高/中/低",
    "summary": "语言分析总结（80字以内）"
  },
  "keywords": {
    "business": ["关键词1", "关键词2"],
    "process": ["关键词1", "关键词2"],
    "capability": ["关键词1", "关键词2"]
  },
  "capabilityScores": {
    "knowledgeIntegration": 85,
    "roleAwareness": 80,
    "identityOrientation": 75,
    "scenarioDescription": 80,
    "adaptability": 70,
    "uncertaintyCoping": 65,
    "goalAwareness": 80,
    "goalDecomposition": 75,
    "efficiencyImprovement": 70
  },
  "dimensionScores": {
    "businessCognitive": 80,
    "businessContextual": 72,
    "performanceImprovement": 75
  },
  "dimensionAnalysis": {
    "businessCognitive": "业务认知能力分析（60字以内）",
    "businessContextual": "业务情境化能力分析（60字以内）",
    "performanceImprovement": "绩效改进能力分析（60字以内）"
  },
  "indicatorAnalysis": {
    "knowledgeIntegration": {
      "score": 85,
      "evidence": "受访者提到的具体原话或内容（20字以内）",
      "reasoning": "评分理由（40字以内）"
    },
    "roleAwareness": {
      "score": 80,
      "evidence": "受访者提到的具体原话或内容",
      "reasoning": "评分理由"
    },
    "identityOrientation": {
      "score": 75,
      "evidence": "受访者提到的具体原话或内容",
      "reasoning": "评分理由"
    },
    "scenarioDescription": {
      "score": 80,
      "evidence": "受访者提到的具体原话或内容",
      "reasoning": "评分理由"
    },
    "adaptability": {
      "score": 70,
      "evidence": "受访者提到的具体原话或内容",
      "reasoning": "评分理由"
    },
    "uncertaintyCoping": {
      "score": 65,
      "evidence": "受访者提到的具体原话或内容",
      "reasoning": "评分理由"
    },
    "goalAwareness": {
      "score": 80,
      "evidence": "受访者提到的具体原话或内容",
      "reasoning": "评分理由"
    },
    "goalDecomposition": {
      "score": 75,
      "evidence": "受访者提到的具体原话或内容",
      "reasoning": "评分理由"
    },
    "efficiencyImprovement": {
      "score": 70,
      "evidence": "受访者提到的具体原话或内容",
      "reasoning": "评分理由"
    }
  },
  "summary": "整体分析总结（100字以内）"
}

现在开始分析以下访谈数据：
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, interviewTitle } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: '没有可分析的访谈数据' }, { status: 400 })
    }

    // 提取访谈对话内容
    const interviewContent = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? '访谈者' : '受访者'}: ${m.content}`)
      .join('\n\n')

    // 调用阿里云 API进行分析
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
            { role: 'system', content: INTERVIEW_ANALYZE_PROMPT },
            { role: 'user', content: `访谈标题：${interviewTitle}\n\n访谈内容：\n${interviewContent}` }
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

    const aiResponse = data.output?.choices?.[0]?.message?.content || ''

    // 尝试解析JSON
    let analysisResult
    try {
      // 提取JSON部分
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        analysisResult = {
          rawAnalysis: aiResponse,
          summary: '分析完成'
        }
      }
    } catch (parseError) {
      analysisResult = {
        rawAnalysis: aiResponse,
        summary: '分析完成'
      }
    }

    return NextResponse.json({ analysis: analysisResult })

  } catch (error: any) {
    console.error('Analysis API Error:', error)
    return NextResponse.json(
      { error: error.message || '分析失败' },
      { status: 500 }
    )
  }
}
