# 公务员智能访谈系统 - 部署指南

## 一、Supabase 数据库设置

### 1. 创建 Supabase 项目
1. 访问 [supabase.com](https://supabase.com)
2. 点击 "New project"
3. 填写项目信息：
   - Organization: 选择或创建
   - Name: `interview-robot`
   - Database Password: 设置密码
   - Region: 选择亚洲区域（如 Tokyo）
4. 点击 "Create new project"

### 2. 创建数据表
进入 Supabase 控制台，点击左侧 **SQL Editor**，运行以下 SQL：

```sql
-- 创建访谈表
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  interviewer_id UUID REFERENCES auth.users(id),
  respondent_name TEXT,
  respondent_position TEXT,
  messages JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- 允许所有认证用户读取自己的访谈
CREATE POLICY "Allow authenticated users to read own interviews"
  ON interviews FOR SELECT
  TO authenticated
  USING (interviewer_id = auth.uid());

-- 允许所有认证用户创建访谈
CREATE POLICY "Allow authenticated users to create interviews"
  ON interviews FOR INSERT
  TO authenticated
  WITH CHECK (interviewer_id = auth.uid());

-- 允许所有认证用户更新自己的访谈
CREATE POLICY "Allow authenticated users to update own interviews"
  ON interviews FOR UPDATE
  TO authenticated
  USING (interviewer_id = auth.uid());

-- 允许所有人读取（用于公开访谈功能，如需要）
-- CREATE POLICY "Allow public to read interviews"
--   ON interviews FOR SELECT
--   TO anon
--   USING (true);
```

### 3. 获取 API 配置
1. 点击左侧 **Project Settings** (齿轮图标)
2. 点击 **API**
3. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJxxxxx...`

---

## 二、本地运行配置

### 1. 复制环境变量模板
```bash
cp .env.local.example .env.local
```

### 2. 编辑 .env.local
填写从 Supabase 获取的配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
OPENAI_API_KEY=sk-xxxxx...
```

### 3. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

---

## 三、OpenAI API 配置

### 获取 API Key
1. 访问 [OpenAI Platform](https://platform.openai.com)
2. 登录后点击右侧头像 → **API keys**
3. 点击 **Create new secret key**
4. 复制生成的 key

> 注意：如果无法访问 OpenAI，可以替换为国内大模型 API（如智谱、阿里云等）

---

## 四、Vercel 部署

### 1. 部署
```bash
npm i -g vercel
vercel
```

或直接在 GitHub 上导入项目：
1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com)
3. 点击 "New Project" → 导入 GitHub 仓库

### 2. 配置环境变量
在 Vercel 项目设置中添加：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

### 3. 部署完成
获取部署后的 URL 即可访问

---

## 五、使用流程

1. **注册/登录** - 访谈人员注册账号
2. **创建访谈** - 点击"创建新访谈"
3. **开始访谈** - 进入访谈页面，点击"开始访谈"
4. **AI对话** - AI 会引导完成整个访谈流程
5. **完成访谈** - 点击"完成访谈"保存记录
6. **数据导出** - 管理员可在后台导出数据

---

## 六、常见问题

**Q: 无法注册/登录？**
A: 检查 Supabase 的 Auth 设置，确保 Email 登录已启用

**Q: AI 不响应？**
A: 检查 OpenAI API Key 是否正确，是否有余额

**Q: 数据库无法访问？**
A: 检查 Supabase 的 Row Level Security 策略是否正确配置
