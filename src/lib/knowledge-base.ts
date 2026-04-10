import fs from 'fs'
import path from 'path'

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  source: string
  keywords: string[]
}

class KnowledgeBase {
  private documents: KnowledgeDocument[] = []
  private initialized = false

  async initialize() {
    if (this.initialized) return

    const knowledgeDir = path.join(process.cwd(), 'src', 'data', 'knowledge')

    try {
      const files = fs.readdirSync(knowledgeDir)

      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.txt')) {
          const filePath = path.join(knowledgeDir, file)
          const content = fs.readFileSync(filePath, 'utf-8')
          const title = file.replace(/\.(md|txt)$/, '')

          this.documents.push({
            id: file,
            title: this.formatTitle(title),
            content: content,
            source: file,
            keywords: this.extractKeywords(content)
          })
        }
      }

      this.initialized = true
      console.log(`知识库已加载 ${this.documents.length} 个文档`)
    } catch (error) {
      console.error('加载知识库失败:', error)
    }
  }

  private formatTitle(filename: string): string {
    return filename
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/^\d+/, '')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^a-zA-Z\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)

    const wordCount = new Map<string, number>()
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word)
  }

  async search(query: string, topK: number = 3): Promise<KnowledgeDocument[]> {
    await this.initialize()

    if (!query.trim()) {
      return this.documents.slice(0, topK)
    }

    const queryWords = query.toLowerCase().split(/\s+/)

    const scoredDocs = this.documents.map(doc => {
      let score = 0
      const contentLower = doc.content.toLowerCase()
      const titleLower = doc.title.toLowerCase()

      // 标题匹配权重更高
      queryWords.forEach(word => {
        if (titleLower.includes(word)) {
          score += 10
        }
        if (contentLower.includes(word)) {
          score += 1
        }
      })

      // 关键词匹配
      doc.keywords.forEach(keyword => {
        queryWords.forEach(word => {
          if (keyword.includes(word) || word.includes(keyword)) {
            score += 5
          }
        })
      })

      return { doc, score }
    })

    return scoredDocs
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.doc)
  }

  getContext(query: string, maxLength: number = 2000): Promise<string> {
    return new Promise(async (resolve) => {
      const docs = await this.search(query, 3)

      if (docs.length === 0) {
        resolve('')
        return
      }

      let context = '【参考知识】\n\n'

      for (const doc of docs) {
        context += `--- ${doc.title} ---\n`
        // 截取内容的前部分
        const truncated = doc.content.length > maxLength / docs.length
          ? doc.content.substring(0, maxLength / docs.length) + '...'
          : doc.content
        context += truncated + '\n\n'
      }

      resolve(context)
    })
  }

  getAllDocuments(): KnowledgeDocument[] {
    return this.documents
  }
}

export const knowledgeBase = new KnowledgeBase()
