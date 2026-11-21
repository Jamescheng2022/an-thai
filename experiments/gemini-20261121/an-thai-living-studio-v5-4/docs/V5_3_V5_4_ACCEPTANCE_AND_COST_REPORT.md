# AN-THAI｜V5.3 & V5.4 验收清单、成本估算与复用边界报告（2026-11-21）

## 一、工具与环境可用性如实声明（绝不虚构审计通过）
- **已完成（本云端沙箱实测）**：V5.3 全部 14 页静态代码增量整改与 390/768/1024/1440px Chromium 自动化回归；V5.4 数据库 RLS Schema、确定性引擎、移动端优先员工聊天+Lite CRM+AI Content Studio 前端应用与 Chromium 端到端角色门禁测试。
- **当前不可用 / 标记为 BLOCKED**：
  - **AGY 本地 GitHub 仓库与 Vercel Staging 部署**：本云端环境无 GitHub 写权限、无线上 `an-thai.com` 生产分支读取/推送权限（`git commit/PR` 与真实预览域名需由本地 AGY 执行）。
  - **真实 SourceRating / Supabase 后端联调与真实邮箱收件**：本沙箱无外网连接，无法对真实 `info@an-thai.com` 邮箱、Resend API 或 Supabase RLS 执行跨实例实网压测。
  - **Claude 独立体验复核 & Codex 独立代码/权限审计**：外部独立评审工具未接入本会话，**不虚构其审计结论**，需在 PR 创建后交由对应工具执行。

## 二、验收场景矩阵（PASS / FAIL / BLOCKED）

| 场景 | 验收项 | 状态 | 实测依据与剩余动作 |
| :--- | :--- | :--- | :--- |
| **A. V5.3 网站回归** | 6 项主导航（Services 桌面下拉 + 移动手风琴）、Cases 模块、4 篇 Insights 独立页、多标签筛选、清除公开开发态文案、390/768/1024/1440px 零溢出 | **PASS（本地静态）** | `an-thai-site-v5-3/tests/verify_site.py` 全 14 页四视口通过，0 JS 报错。 |
| **A2. 线上旧文章原文核对 & 真实询盘收信** | 核对生产仓 4 篇 Insights 原文、配置 `inquiryEndpoint` + `RESEND_API_KEY` 验证实收邮件 | **BLOCKED（待 AGY Staging）** | 需 AGY 在 GitHub 生产仓 diff 原文并在 Vercel Staging 配置环境变量实测。 |
| **B. V5.4 员工投稿** | 手机端发送文字+3 张照片+语音转写，Agent 生成 Lite CRM 候选与模板化草稿（追问 ≤3 个） | **PASS（本地沙箱）** | `tests/verify_v54_studio.py` 实测通过；实机拍照/真实语音转写 API 待 Staging 接入。 |
| **C. 审核发布与回滚** | Contributor 不能直接发布；Editor/Publisher 核验公开授权后批准发布并可撤稿回滚 | **PASS（状态机与 UI）** | 角色门禁、未授权拦截、发布与撤稿回滚均在 `verify_v54_studio.py` 实测通过；真实静态构建触发待 Staging 接通。 |
| **D. 轻量 CRM（6 对象）** | 提取候选、未知字段标 `Unknown`、重名提示不自动合并、一键确认、来源消息可追溯 | **PASS（本地引擎）** | 已通过单元测试与浏览器用例；Supabase 持久化待执行 `001_living_website_schema.sql`。 |
| **E. 每日管理简报** | 仅基于已确认授权记录生成摘要，不虚构营业额/完成量 | **PASS（确定性聚合）** | 实测未确认数据不计入，营业额显式标注 `Not tracked (zero fabrication)`。 |
| **F. 安全与租户隔离** | 匿名访问拒绝、跨企业 RLS 403、服务端密钥隔离、EXIF 清除 | **BLOCKED（待 Supabase Staging）** | SQL RLS 策略已编写于 `db/001_living_website_schema.sql`，需在真实 Supabase 实例用双租户 Token 验收。 |
| **G. 体验测试** | 390/768/1024/1440px 零溢出；员工从打开到提交内容步骤数=3步，Agent 追问 ≤3 个 | **PASS（视口与交互）** | 弱网上传断点重试需在真实对象存储签名上传接口联调阶段补充压测。 |

## 三、月度模型与存储成本估算（An-Thai 10–30 人工程企业试点）
- **LLM 推理（Gemini Flash / 同级轻量模型）**：按日均 80 条工作群消息提取 + 5 篇周度内容草稿/三语辅助 + 1 次每日简报，月均 ~1.5M–3M tokens，预估 **$3 – $12 / 月**（配置单企业月度配额上限与降级开关）。
- **语音转写（Whisper / Gemini Audio）**：按月均 120 分钟现场语音，预估 **$1 – $3 / 月**。
- **数据库与文件存储（Supabase + Vercel Static）**：图片 WebP 压缩（~150KB/张），首年 <5GB，落在 **Free / Pro 共享底座（$0 – $25 / 月摊销）**。
- **合计边际运营成本**：单家试点企业约 **$10 – $40 / 月**，远低于专职网站运营或商业 CRM/OA 订阅费。

## 四、可复用组件与 An-Thai 专属配置边界
- **可复用核心（80% 跨企业共享）**：`assets/css/styles.css`、`assets/js/site.js`、`sourcerating-embed-adapter.js`、`db/001_living_website_schema.sql`、`api/studio-engine.js`、`app/` 员工原生聊天与审核工作台。
- **An-Thai 专属配置（20% 按企业替换）**：`workspaces.config_json`（四条业务路线、品牌标语 `Substructure to Superstructure.`、联系方式、独立钢构买方代理与中材合肥合作边界文案）、`content/cases.json`、`content/updates.json` 及 `assets/img/`。
