import { NextRequest, NextResponse } from 'next/server'

const DIGITAL_LITERACY_ANALYZE_PROMPT = `你是一个专业的数字素养数据分析专家。请对以下数字素养访谈数据进行全面分析。

## 数字素养三维度指标体系

### 一、数字意识（15分）
- 二级指标1.1 数字技术认知：对人工智能、大数据、云计算等技术的了解程度
- 二级指标1.2 数字化态度：对数字化转型的态度是积极还是保守
- 二级指标1.3 数字信息意识：日常生活中获取、评估数字信息的习惯

### 二、数字知识与技能（15分）
- 二级指标2.1 设备使用能力：常用数字设备的熟练程度
- 二级指标2.2 软件应用能力：各类软件和应用的使用能力
- 二级指标2.3 网络安全知识：对网络安全防护、数据保护的理解
- 二级指标2.4 信息检索能力：信息检索和筛选的能力

### 三、数字应用与实践（20分）
- 二级指标3.1 工作应用：在工作中应用数字技术的能力和场景
- 二级指标3.2 生活应用：在日常生活中应用数字技术的场景
- 二级指标3.3 问题解决：遇到数字技术问题时的解决方式
- 二级指标3.4 创新应用：利用数字技术进行创新的能力

## 评分标准
- 90-100分：回答非常具体、深入，有明确的案例、数据、细节，体现高度专业性
- 75-89分：回答较具体，有一定的专业性，但缺乏深度或案例支撑
- 60-74分：回答较为笼统，概念较多但缺乏具体细节
- 40-59分：回答简单，仅有基本概念，缺乏流程和细节
- 0-39分：回答不完整或与数字素养关联度低

## 分析要求

### 0. 基本情况摘要（首先提取）
从访谈内容中提取并精炼以下基本信息：
- 年龄段：如"25-35岁"
- 职业/身份：如"企业员工"、"大学生"、"退休人员"
- 数字技术使用频率：高/中/低
- 主要使用的数字技术/工具

### 1. 语言分析
- 回答完整性：回答是否详细、具体
- 逻辑性：回答是否条理清晰
- 专业性：是否使用数字技术术语

### 2. 关键词提取
从访谈内容中提取：
- 数字技术关键词（如：AI、微信、支付宝、办公软件等）
- 数字应用场景关键词
- 能力描述关键词

### 3. 数字素养评分（满分50分）
请根据上述三维度九指标体系进行评分。

### 4. 评分依据
对每个指标的评分，必须给出具体的评分依据，包括：
- 受访者在访谈中提到了什么具体内容
- 这个内容如何体现该指标的评价
- 评分理由的简要说明

### 5. 综合评价
给出对受访者数字素养水平的综合评价，并提供针对性的提升建议。

## 输出格式（JSON）

请返回以下JSON格式的分析结果：

{
  "basicInfo": {
    "ageRange": "年龄段",
    "occupation": "职业/身份",
    "techUsageFrequency": "高/中/低",
    "mainTechTools": ["工具1", "工具2"]
  },
  "languageAnalysis": {
    "completeness": "高/中/低",
    "logic": "高/中/低",
    "professional": "高/中/低",
    "summary": "语言分析总结（80字以内）"
  },
  "keywords": {
    "techKeywords": ["关键词1", "关键词2"],
    "applicationKeywords": ["关键词1", "关键词2"],
    "capabilityKeywords": ["关键词1", "关键词2"]
  },
  "capabilityScores": {
    "digitalTechCognition": {"score": 0, "evidence": "", "reasoning": ""},
    "digitalAttitude": {"score": 0, "evidence": "", "reasoning": ""},
    "digitalInfoAwareness": {"score": 0, "evidence": "", "reasoning": ""},
    "deviceUsage": {"score": 0, "evidence": "", "reasoning": ""},
    "softwareUsage": {"score": 0, "evidence": "", "reasoning": ""},
    "networkSecurity": {"score": 0, "evidence": "", "reasoning": ""},
    "infoRetrieval": {"score": 0, "evidence": "", "reasoning": ""},
    "workApplication": {"score": 0, "evidence": "", "reasoning": ""},
    "lifeApplication": {"score": 0, "evidence": "", "reasoning": ""},
    "problemSolving": {"score": 0, "evidence": "", "reasoning": ""},
    "innovativeApplication": {"score": 0, "evidence": "", "reasoning": ""}
  },
  "dimensionScores": {
    "digitalAwareness": 0,
    "digitalKnowledge": 0,
    "digitalApplication": 0
  },
  "totalScore": 0,
  "level": "优秀/良好/一般/较差",
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "improvementSuggestions": ["建议1", "建议2"],
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
            { role: 'system', content: DIGITAL_LITERACY_ANALYZE_PROMPT },
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
