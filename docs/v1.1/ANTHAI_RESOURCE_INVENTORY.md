# An-Thai V1.1 企业样板资源盘点清单（G3 第一步）

- **文档版本 / 日期**：`2026-11-26 +07:00` · 分支：`v1.1/resource-inventory-g3`
- **仓库基线**：`Jamescheng2022/an-thai` · `origin/main` `19bfe290e0b2825bd444089560bbbfe43e3c2e39`（V1.0 生产部署 `dpl_DUC9PFDmBS1V7RhqHgazrYhm7xgc`，对应域名 `https://an-thai.com`）
- **依据文件**：
  - `D:\AgentWorkspaces\command-center\INTEGRATION_BASELINE.md`
  - `Jamescheng2022/global-product-infrastructure@ba851c2` · `docs/integration/ENGINEERING_NETWORK_INTEGRATION_HANDOFF_20261126.md`（第 5、6 节）
  - `D:\AgentWorkspaces\command-center\OWNER_GATES.md`（Gate #5、Gate #7 等）
- **范围与红线**：本轮仅盘点已有资产与能力、编写本清单，**不修改 V1.0 生产代码与发布状态，不新建通用框架，不做接口联调（等待 SR-00 的 I-4 契约），不触发任何真实外联，PACO/ROGE 与 Resend 门禁继续保持开启（HARD HOLD）**。

---

## 一、真实工程业绩与案例档案

### 1.1 总览：An-Thai 直签公开业绩数 = `0`
依据仓库现存的 [content/cases.json](../../content/cases.json)（Schema 2.0）与 [content/cases-ai-index.json](../../content/cases-ai-index.json)：
- `anThaiDirectPublishedCount`: **`0`**（状态：`nda_clearance_pending`）。
- 官网政策明确声明：**AN-THAI 直签客户合同受双边保密协议（NDA）约束**，必须待客户书面披露授权及合格现场摄影审批完成后才可公开发布。
- 目前线上 `/cases/`（及 `/zh/cases/`、`/th/cases/`）由 [scripts/build-cases.py](../../scripts/build-cases.py) 编译为工程能力范围与交付标准页（`Engineering Scope & Field Delivery Standards`），展示 4 个服务单元能力卡片；**全部 `cases.json`、`cases-ai-index.json`、`project-references-review.json`、`image_evidence.json`、`cases/case-template.html` 与 `assets/images/cases/*` 均被 [scripts/build-static.cjs](../../scripts/build-static.cjs) 排除在 `dist/` 发布包外**（V1.0 生产访问返回 `404`）。

### 1.2 已结构化的关联历史参考记录（共 4 条 · 全部维持隐藏 · 受 Owner Gate #7 约束）

| ID | 项目名 / 档案名 | 年份 | 服务类型 / 领域 | 归属主体 | 证据来源 | 能否公开 |
|---|---|---|---|---|---|---|
| `REF-PACO-EMBASSY-SPUN-PILE` | Royal Thai Embassy (Singapore) — Spun Pile Export Reference | `2005` | Precast Spun Piles（基准参考 TIS 398-2563） | Pathumthani Concrete Co., Ltd. (PACO) | `paco-group.com` (Corporate History) | **否（`hold_pending_disclosure`）**：非 AN-THAI 直签合同；受 **Owner Gate #7** 约束（待 Owner 书面确认与 PACO 的法律关联表述及商图授权）。 |
| `REF-PACO-CENTRAL-FESTIVAL` | CentralFestival Inn Ville Project（对应内审台账 `PACO-S09`） | `PACO Record` | Precast Spun Piles & Driving（C60A + PD Pure Drive） | Pathumthani Concrete Co., Ltd. (PACO) | `paco-group.com` (Past Performance) | **否（`hold_pending_verification`, `verified: false`）**：身份及证明材料仍在复核中，且受 **Owner Gate #7** 约束。 |
| `REF-PACO-BMA-BOX-GIRDER` | Precast Box Girders Fabricated per BMA Public Works Design | `1985+` | Precast Structural Girders | Pathumthani Concrete Co., Ltd. (PACO) | `paco-group.com` (Corporate History) | **否（`hold_pending_disclosure`）**：非 AN-THAI 直签合同；受 **Owner Gate #7** 约束，且无相应现场实景证明。 |
| `REF-ROGE-GRADE-A-CONSULTANT` | Roge & Associates — Thai Engineering Consultancy Qualification Profile | `Est. 1983` | Civil Engineering Consultancy（机构资质概况：泰国财政部 Fiscal Policy Office Grade A、105+ 常驻员工） | Roge & Associates Co., Ltd. | `roge.co.th/About-Us/About-Us.html` | **否（`hold_pending_disclosure`）**：机构背景档案（非具体客户中标案例）；财政部 Grade A 与员工人数属 Roge 实体，不得归属为 AN-THAI 自身资质，受 **Owner Gate #7** 约束。 |

### 1.3 内部审查线索与动态草稿（均 `reviewOnly` / `draft` · 禁止直接公开）

| 来源文件 | 数量 | 内容概要 | 证据状态与约束 |
|---|---:|---|---|
| `content/project-references-review.json` | 23 条 | • **PACO 商住/工业历史名录（`PACO-S01` ~ `PACO-S09`，9 条）**：如 Bang Yai Square、Lumpini Ville、Tawandang Brewery 等。<br>• **PACO 2017 宣传册工业客户名录（`PACO-I01` ~ `PACO-I11`，11 条）**：Shell、Esso、Thai Oil、IRPC、SCG Dow、Ford 等。<br>• **ROGE 外部顾问提及（`ROGE-P01` ~ `ROGE-P03`，3 条）**：素万那普机场 JICA 评估、Phetchaburi 与 Nong Ruea 灌溉研究。 | `publicPublished: false`, `reviewOnly: true`, `imageUrl: null`。仅记录历史名称或外部提及，未核验 AN-THAI 合同范围、起止日期及授权，**禁止公开展示或归属 AN-THAI**。 |
| `content/updates.json` | 3 条 | `UPD-202611-01`（2026-11-20 声波探头校准）、`UPD-202611-02`（2026-11-15 钢构装运前规程）、`UPD-202611-03`（2026-11-09 PIT 准备指南）。 | 全部 `status: "draft"`, `verified: false`，按 P0-1 审计保留为内部草稿（未授权、无实证附件），**不得作为已核实新闻上线**。 |

### 1.4 真实工程业绩缺口清单（需请 Owner / 企业补充）
1. **An-Thai 直签真实工程清单（至少 1–3 个）**：需明确脱敏或可公开的项目代号/工程名称、地区、年份、检测/采购/设备服务类型、关键技术规模（且确认无客户 NDA 冲突）。
2. **客户或企业负责人的披露授权**：书面或明确确认可作为官网与 Precast.World V3.1（I-1 / I-3）公开展示记录。
3. **Owner Gate #7 决策**：若未来要启用任何 PACO / ROGE 关联档案，必须先由 Owner 书面确定法律关联措辞及图文版权授权。

---

## 二、现场照片与视觉资产清单

> **全库图像 EXIF 实测结论**：经对仓库 `assets/images/` 全部 **51 张栅格图片**（`.webp` 与 `.png`）扫描，**51 张全部为 `exif_tags = 0, raw_exif_bytes = 0, xmp = False`**（在 WebP/PNG 转码压制阶段已清除 EXIF、相机型号与 GPS 坐标，无位置隐私泄露风险，但同时无法从图像文件本身追溯原始拍摄时间与地点）。仓库另存有 **23 个 SVG 矢量文件**（纯示意图）。

### 2.1 企业品牌徽标与直连渠道图片（共 6 张 · 可公开）

| 文件路径 | 尺寸 (px) | 来源 | EXIF 状态 | 可公开状态与用途 |
|---|---:|---|---|---|
| `assets/images/brand-logo.webp` | 256×256 | 由 `brand-header.webp` 左侧官方印章无损提取 | 无 EXIF | **可公开**：全站页头、页脚公司徽标（V1.0 PR #33 已上线）。 |
| `assets/images/brand-logo.png` | 256×256 | 同上，透明底 PNG | 无 EXIF | **可公开**：全站 PNG Favicon（PR #33 已上线）。 |
| `assets/images/apple-touch-icon.png` | 180×180 | 同上，纯白底不透明 PNG | 无 EXIF | **可公开**：iOS Apple Touch Icon（PR #33 已上线）。 |
| `assets/images/brand-header.webp` | 615×290 | `ASSET_MANIFEST`（原手册抬头横幅图） | 无 EXIF | **可公开**：旧版页面及徽标源图。 |
| `assets/images/contact-line-qr.webp` | 600×600 | Owner 提供（2026-11-26） | 无 EXIF | **可公开**：官方 LINE（`p0_XsfILmH`）直连二维码（PR #31 已上线）。 |
| `assets/images/contact-wechat-qr.webp` | 600×600 | Owner 提供（2026-11-26） | 无 EXIF | **可公开**：官方微信（`James2021`）二维码（PR #31 已上线）。 |

### 2.2 AN-THAI 宣传册裁切摄影图（共 18 张：7 组主图/派生图 14 张 + Insights 裁切图 4 张 · 商业展示可用，但不可充当特定项目实景证明）

依据 `ASSET_MANIFEST.json` 与 `docs/editorial/evidence/static-load-vs-pda-thailand-pile-capacity.md`：下列图片**均源于 Owner 提供的旧版公司宣传册**，`commercialRightsApproved: true`，但明确标注 **`not independent proof of project ownership`（`projectMatch: false`）**：

| 文件路径（含对应 `-small`） | 尺寸 (px) | 来源说明 | EXIF 状态 | 可公开与限制边界 |
|---|---:|---|---|---|
| `assets/images/hero-field.webp` (+ `-small`) | 900×687 / 720×550 | AN-THAI 宣传册打桩/检测拼贴场景 | 无 EXIF | **可公开（能力示意真图）**；含文字遮罩拼贴，不可用于证明特定已完工项目。 |
| `assets/images/static-load.webp` (+ `-small`) | 900×389 / 520×225 | AN-THAI 宣传册静载反应架图 | 无 EXIF | **可公开（能力示意真图）**；不可宣称对应特定客户或荷载数值。 |
| `assets/images/high-strain.webp` (+ `-small`) | 900×480 / 520×277 | AN-THAI 宣传册高应变（PDA）检测场景 | 无 EXIF | **可公开（能力示意真图）**。 |
| `assets/images/low-strain.webp` (+ `-small`) | 900×538 / 520×311 | AN-THAI 宣传册低应变（PIT）检测图文合成 | 无 EXIF | **可公开（能力示意图）**；含拼贴说明元素。 |
| `assets/images/plate-load.webp` (+ `-small`) | 900×522 / 520×301 | AN-THAI 宣传册平板载荷试验图 | 无 EXIF | **可公开（能力示意真图）**（注意：旧 `capabilities` 页第 3 卡曾误用此图展示粉体设备，属已知非阻塞改进项）。 |
| `assets/images/lab-equipment.webp` (+ `-small`) | 900×513 / 520×297 | AN-THAI 宣传册合作实验室仪器图 | 无 EXIF | **可公开（能力示意图）**；代表设备类别，不得推导出自有实验室认证。 |
| `assets/images/office.webp` (+ `-small`) | 567×565 / 421×420 | AN-THAI 宣传册办公环境图 | 无 EXIF | **可公开（分辨率偏低）**；About 页使用。 |
| `assets/images/insights/pit-team-cover.webp` | 1000×604 | 源自公司现有手册现场图 | 无 EXIF | **可公开（仅文章配图）**；文档明示不指代特定泰国客户现场。 |
| `assets/images/insights/pit-field-sensor.webp` | 413×500 | 公司宣传册低应变传感器图 | 无 EXIF | **可公开（仅文章配图）**。 |
| `assets/images/insights/static-load-vs-pda-...-static-field-photo.webp` | 575×350 | 裁切自 `static-load.webp` 反应钢梁部分 | 无 EXIF | **可公开（仅文章配图）**；文档明示不证明 AN-THAI 实操特定试验。 |
| `assets/images/insights/static-load-vs-pda-...-pda-field-photo.webp` | 258×576 | 裁切自 `hero-field.webp` 重锤落锤部分 | 无 EXIF | **可公开（低宽竖图 258px）**；仅设备情境参考。 |

### 2.3 开源外部摄影与技术交流参考图（共 13 张 · 仅供页面版式/技术文章使用，严禁当作 AN-THAI 现场照）

| 组别 | 文件清单与尺寸 | 来源与许可 | EXIF 状态 | 使用约束 |
|---|---|---|---|---|
| **钢结构采购页配图（7 张）**<br>`assets/images/steel/` | `steel-hero.webp` (1440×960)<br>`steel-warehouse.webp` (900×1219)<br>`steel-fabrication.webp` (800×1000)<br>`steel-truss.webp` (850×637)<br>`steel-welding.webp` (900×506)<br>`steel-structure.webp` (1300×1733)<br>`steel-cta.webp` (850×650) | Unsplash 摄影师 Declan Sun、Neon Wang、Cemrecan Yurtman、Sebastian Schuster（见 `docs/STEEL_PAGE_PHOTO_SOURCES.md`） | 无 EXIF | Unsplash 商用免版税；**仅可作行业示意图**（Illustrative），严禁标注为 AN-THAI 工厂、团队或项目。 |
| **CSL 文章纪实图（5 张）**<br>`assets/images/insights/` | `bored-pile-csl-debonding-cover.webp` (563×750)<br>`bored-pile-csl-rebar-cage.webp` (1000×750)<br>`bored-pile-cage-installation.webp` (1000×750)<br>`bored-pile-core-drilling-verification.webp` (1000×745)<br>`bored-pile-core-compression-test.webp` (619×750) | Wikimedia Commons（CC BY-SA 4.0 / CC BY 2.0 / CC BY-SA 3.0 / Public Domain） | 无 EXIF | 须保留 CC 署名声明；仅科普与技术分析插图，**不得作为公司项目实景**。 |
| **中国大吨位配重参考照（1 张）**<br>`assets/images/insights/` | `static-load-vs-pda-thailand-pile-capacity-china-large-bags-field-photo.webp` (920×690) | Owner 提供的 2023 年中国现场交流照（已裁掉第三方梁体标识/电话） | 无 EXIF | **标明中国交流参考图**，非泰国与 AN-THAI 施工现场，不证明荷载合规。 |

### 2.4 技术示意图 / 概念图（共 10 张 WebP + 23 个 SVG · 绝对不得当作项目照片）
- **手册概念WebP（4 张）**：`capabilities.webp` (810×840) + `-small` (405×420)、`csl.webp` (540×795) + `-small` (285×420)。
- **工程原理框图WebP（6 张，`assets/images/insights/`）**：`global-inspection-dual-core-architecture.webp` (1200×720)、`iso17025-qa-chain-inspection-traceability.webp` (1100×680)、`megaton-slt-anchor-thermal-distortion.webp` (1100×680)、`paut-weld-flaw-vs-geometric-echo.webp` (1100×680)、`pit-impedance-shadowing-defect-masking.webp` (1100×680)、`post-fire-concrete-forensic-damage-zone.webp` (1100×680) —— 全为原创技术示意图（CC BY 4.0）。
- **SVG 技术示意图（23 个，`assets/images/insights/`）**：`pit-pretest-*.svg`（4 个）、`pit-report-review-*.svg`（9 个）、`static-load-vs-pda-*.svg`（10 个，含桌面与移动端分支）。

### 2.5 扣留外图（共 4 张 · `publicDisplay: false` · 严禁公开）
`assets/images/cases/` 下 4 张外部网站横幅/缩略图（`case-paco-embassy-spun-pile.webp`、`case-paco-eastville-foundation.webp`、`case-roge-bma-bridges.webp`、`case-roge-water-resources.webp`）均无商业授权且与项目现场不匹配，受 `OWNER_GATES #7` 与 `image_evidence.json` 严格扣留，不得进入 `dist/`、动态 Feed 或测试帖。

### 2.6 缺什么现场照片（请 Owner / 企业提供的清单）
目前仓库**尚无任何一组“无宣传册文字叠加、明确拍摄背景属于 An-Thai 现场且已完成脱敏授权的独立高清照片”**。建议 V1.1 试点优先补充以下 4 组原图（建议横向分辨率 ≥1200 px，上线流水线统一剥离不必要 EXIF/GPS 并遮挡个人面孔/车牌/敏感图纸编号）：
1. **桩基检测实测组（2–3 张）**：SLT 千斤顶/百分表实测架设、PDA 主机屏幕波形采集或 PIT/CSL 测桩现场实拍（无第三方面孔/铭牌）。
2. **钢结构买方验收组（2–3 张）**：驻厂焊缝 NDT 抽检、钢构件尺寸复核或集港装运前查验（替换当前 Unsplash 钢结构示意图）。
3. **粉体装备/检测仪器交付组（2 张）**：对应 Unit 03/04 的实际机械或检测仪器主机/传感器/校准文件脱敏实拍。
4. **曼谷团队/办公实景组（1–2 张）**：高清晰度办公或工程例会实拍（替代 567×565 的低分辨率宣传册图 `office.webp`）。

---

## 三、企业公开资料（V1.0 核实基线）

| 项目 | 公开口径（已于 `an-thai.com` 上线核实） | 说明与限制 |
|---|---|---|
| **法定主体名称** | `AN-THAI Engineering Company Limited`（安泰工程有限公司 / บริษัท แอน-ไทย เอ็นจิเนียริ่ง จำกัด） | 各语种与 JSON-LD Schema 一致。 |
| **公开地址与区域** | `1339 Arwan Building, Pracharat 1 Rd, Wongsawang, Bangsue District, Bangkok 10800, Thailand` | 服务覆盖大曼谷都会区与东部经济走廊（EEC / 罗勇 / 春武里）。 |
| **4 项核心服务线** | 1. **桩基检测与岩土（`/testing.html`）**：SLT、PDA、PIT、CSL、钻孔及泰国规范/注册工程师 PE 签章协调。<br>2. **买方钢结构采购代理（`/steel-procurement.html`）**：RFQ 对齐、验厂质检、材质溯源、装运前放行。<br>3. **粉体工艺设备（`/powder-equipment.html`）**：立磨（VRM）、选粉机、袋式除尘等技术边界协调与厂商对接。<br>4. **工程检测仪器（`/testing-instruments.html`）**：PIT/CSL/PDA 及实验室仪器选型、校准文件与本地交付支持。 | 仅基于清楚边界的工程协调与交付表述；**不可宣称自有重型桩机车队或特定认证机构证书编号**。 |
| **公开联系渠道** | • 邮箱：`info@an-thai.com`<br>• 电话 & WhatsApp：`+66 90 292 1749`（`https://wa.me/66902921749`）<br>• 官方 LINE：`https://line.me/ti/p/p0_XsfILmH` + QR `contact-line-qr.webp`<br>• 官方微信：`James2021` + QR `contact-wechat-qr.webp` | 已全量替换早期个人微信/LINE (`rachada2018`)；表单现处于结构化简报（`mailto:` / Copy Brief / WhatsApp）模式。 |
| **三语页面状态** | 全站构建 **47 页**，完整覆盖 `EN`（根路径）、`ZH`（`/zh/`）、`TH`（`/th/`）：首页、4 个服务页、`about.html`、`contact.html`、`insights.html`、`insights/index.html`、`cases/`、`404.html`（加上 3 个旧 URL 的 308 永久重定向）。 | **局限**：5 篇已发布技术文章（`insights/<slug>.html`）仅提供**英文全文页**，中/泰目录页点击卡片会打开英文原文页；中/泰文章导航会跳回中/泰列表页。 |
| **Resend 状态（Gate #5）** | `api/inquiry.js` 后端与防刷校验已就绪，但 Vercel 生产尚未配 `RESEND_API_KEY` 与发件域名验证。`GET /api/inquiry` 实测返回 `configured: false, backend: "unconfigured"`。 | 受 **Owner Gate #5** 阻塞；放行前前端保持诚实人工渠道兜底，**严禁伪造已发信回执**。 |
| **SourceRating 状态** | `assets/js/sourcerating-embed-adapter.js` v2.2 已置入仓库，默认处于 `apiBaseUrl: ""` 未连线隔离状态（不入线上活跃流程），待 G2/I-4 契约完成并经 preview 联调。 | 生产库迁移处于 **HARD HOLD（OWNER_GATES #2/#3）**。 |
| **统计与广告合规** | 页面已接隐私同意门控 `ga4-loader`（同意前 0 analytics 请求）及 AdSense 声明文件 `ads.txt`；商业转化数据因无只读凭证仍标 `UNKNOWN`（Gate #6）。 | 未经许可不得打开自动跟踪或广告位投放。 |

---

## 四、现有网站模板拆解（为 G4 模板化记录 · 本轮不建通用框架）

### 4.1 模板架构判断
依据 `INTEGRATION_BASELINE.md` 第 6 节核查，历史 `factorysite-os` 仓库仅含两份治理文档无源码，**当前唯一经过生产多端验证的可复用企业网站模板，即本仓库 `an-thai` V1.0（以及 `experiments/gemini-20261121/an-thai-living-studio-v5-4` 的后台草稿概念）**。

### 4.2 可直接复用给第二家工程企业的组件（配置、数据、页面骨架）

| 层级 | 可复用文件 / 模块 | 复用方式说明 |
|---|---|---|
| **无框架静态编译与质检管线** | `scripts/build-static.cjs`、`scripts/localize.py`、`scripts/build-insights.py`、`scripts/build-cases.py`、`scripts/check-site.py`、`scripts/check-locales.py`、`scripts/check-insights.py`、`scripts/check-interactions.cjs` | 零第三方构建包，一行打包 `dist/` 并自动输出三语镜像，内建 HTML SVG 自闭合修复、`data-i18n-aria`/`data-i18n-ph` 属性替换、`sitemap.xml`/`llms.txt` 生成、外链白名单与 `asset` 哈希完整性校核。 |
| **瑞士工程风格设计系统** | `assets/css/styles.css`、`assets/css/portfolio-v1.css` | 全局布局 Token（色彩、排版、栅格、8px 边线卡片）、三语切换顶栏与手风琴菜单、`ol.flow-pipeline` 响应式四步流程图、`.hub-diagram` 企业中心架构组件、全站底栏 + `#deskDrawer` 侧滑询盘抽屉。 |
| **结构化内容 JSON Schema** | `content/insights/*.json`、`content/updates.json`、`content/cases.json`、`content/image_evidence.json` | • 文章：支持结构化节次、图表双分辨率 `mobile_image`、证据声明与 FAQ Schema。<br>• 动态：`updates.json` 可直接映射为 G3/I-3 的受控 `PublicPost` 接口契约。<br>• 案例与图片：`cases.json` 含法人归属字段与三轴证据标记（`sourceVerified`、`projectMatch`、`commercialRightsApproved`）。 |
| **前端运行时与翻译键架构** | `assets/js/i18n-data.js`、`assets/js/site.js`、`assets/js/ga4.js`、`api/inquiry.js`、`assets/js/sourcerating-embed-adapter.js` | • `i18n-data.js`（414 组 `EN/ZH/TH` 键值表）。<br>• `site.js` 支持 URL 查询参数预填表单（`?type=&category=&route=`）与无后端诚实降级。<br>• `inquiry.js` 按环境变量注入收件箱/Webhook，与业务实体解耦。<br>• `sourcerating-embed-adapter.js` 以 `apiBaseUrl` + `workspaceKey` 隔离不同企业租户并内置 401 重试与会话重置提示。 |

### 4.3 属于 An-Thai 专属、接入第二家企业时必须替换或参数化的内容

| 类型 | 专属位置 | 说明（G4 产品化时抽离为企业配置文件） |
|---|---|---|
| **品牌标识与联系信息** | `assets/images/brand-logo.*`、`brand-header.webp`、`favicon.ico`、`apple-touch-icon.png`、`contact-line-qr.webp`、`contact-wechat-qr.webp`、页头/页脚/JSON-LD、`i18n-data.js` 会社与联系字段、`api/inquiry.js` 默认收件邮箱 `info@an-thai.com` 与前缀 `ANTHAI-RFQ-` | 需改为按企业 `tenantConfig` 注入名称、LOGO、联系通道与多语标题。 |
| **固定业务路线与页面正文** | `testing.html`、`steel-procurement.html`、`powder-equipment.html`、`testing-instruments.html`、`about.html`、`contact.html`、4 个服务路由 URL、`site.js` 中的 `normalizeRoute` / `CATEGORY_MAP` | 不同企业服务线数目（如 2 项或 6 项）及专业内容不同，G4 时应改为从企业配置生成核心服务路由数组，不再写死 `testing/steel/powder/instruments`。 |
| **行业素材与文章资产** | `content/insights/*.json`（5 篇基桩技术文）、`assets/images/*` | 属于 An-Thai 专属技术文章与行业照片。 |
| **站点域名、重定向与第三方账号** | `vercel.json`（历史 URL 重定向）、`sitemap.xml` / `robots.txt` / `llms.txt`、`ads.txt`（`pub-4813203643604350`）、`scripts/build-static.cjs` AdSense meta、GA4 Measurement ID | 必须随新企业域名与新站台账号独立生成或关闭。 |

---

## 五、SourceRating 企业知识库素材（AI 客服可引用的公开事实清单）

> 为 G2 / I-4 上线后 `workspaceKey: "an-thai-th"` 的 AI 辅助与访客询盘接待准备。AI **仅限使用下表第 5.1 节已核实公开事实**，严禁突破第 5.2 节限制边界。

### 5.1 允许 AI 直接引用的已核实公开事实
1. **企业基本身份**：AN-THAI Engineering Company Limited 位于泰国曼谷（1339 Arwan Building, Pracharat 1 Rd, Wongsawang, Bangsue District, Bangkok 10800），服务覆盖大曼谷都会区及东部经济走廊（EEC：罗勇/春武里），支持英、中、泰三语工程沟通与协调。
2. **四大业务与可交付说明**：
   - **桩基检测与岩土（Testing & Geotech）**：提供静载试验（SLT）、高应变动力检测（PDA）、低应变完整性检测（PIT）、声波透射法（CSL）、钻孔勘察、原位及材料测试协调，并对接泰国注册专业工程师（PE · วุฒิวิศวกร / สามัญวิศวกร）图纸转换、计算书审核签章与地方建筑许可协调；交付认可检测方案、原始曲线/波形数据及工程解译报告（具体签章责任依合同范围确定）。
   - **买方钢结构采购代理（Buyer-Side Steel Procurement）**：站在国际买方立场执行供应商筛选、技术标比价（RFQ 统一口径）、驻厂过程质量核验、焊缝 NDT 抽查、材质证明（MTC）追溯与装运前放行；不代表卖方/厂家立场。
   - **粉体工艺设备（Powder-Process Equipment）**：立式磨（VRM）、选粉机、袋式除尘及配套工艺线的技术边界协调，连接买方工况参数与合格制造商的确认规格及供货边界。
   - **工程检测仪器（Testing Instruments）**：协助桩基与实验室测控仪器选型、传感器/数采系统兼容性核对、校准随附文件说明及本地交付支持。
3. **技术交流参考资料**：官网 Insights 公开的 5 篇技术文章主题（CSL 声测管热收缩脱空识别、PIT 报告波形自检七问、PIT 检测前现场准备包、泰国 SLT vs PDA 证据对比分析、`Global Foundation & Full-Spectrum Engineering Inspection` 多规范实战对照），AI 可指引访客阅读相关方法论及现场准备核对清单。
4. **访客联系与询盘引导**：
   - 支持直接引导至官方渠道：`info@an-thai.com`、电话/WhatsApp `+66 90 292 1749`、LINE（`https://line.me/ti/p/p0_XsfILmH`）、微信 `James2021`。
   - 收集技术简报时应引导提供：**所在区域、业务类别、拟用规范（ASTM/EN/GB/TIS/EIT）、图纸或工期目标、以及有效联系邮箱或 WhatsApp/LINE**。

### 5.2 严禁 AI 虚构或外泄的内容红线
- **不得报价与承诺**：严禁编造任何单价、套餐价、测试折扣或承诺固定工期/必过验收结果。
- **不得越权归属 PACO / ROGE**：严禁宣称泰国财政部 Grade A 顾问资质、105+ 常驻人数或 PACO 管桩/箱梁项目为 AN-THAI 本身直接履历与合同业绩。
- **不得编造案例与证书**：严禁捏造尚未披露的 AN-THAI 客户名称、已签署合同数量、ISO/CNAS/DOH 具体证书号、实验报告读数或具名泰籍 PE 执业编号。
- **不得虚报已联系成功**：若 SourceRating 会话或 Resend 未配置/不可用，AI 与界面不得宣称“邮件已发给团队”或“人工客服一定在几分钟内在线”。

---

## 六、第一条 TEST 动态建议素材（仅限 V1.1 隔离 Preview 演练）

> 严格执行交接书第 5 节与全局发布约束：**必须显式标注为 `TEST`**；本建议**不编造工程名称、桩数、吨位或客户名称**；**严禁进入 V1.0 生产（`main`/`an-thai.com`）与搜索引擎索引**，正式动态须由企业授权人（Owner/Admin）以真实核实素材替换确认。

### 6.1 TEST 动态结构化草稿建议（用于 G3-I-3 / I-5 闭环链路联调）

| 字段 | 建议测试值 | 说明 |
|---|---|---|
| `id` | `TEST-ANTHAI-UPD-0001` | 稳定测试主键，方便清理与回滚验证 |
| `isTest` / `visibility` | `isTest: true` · `visibility: "staging_preview_only"` | 硬性标记，防止流入正式环境与搜索索引 |
| `seoRobots` | `noindex, nofollow`（排除出 `sitemap.xml` 与 `llms.txt`） | 防止搜索引擎抓取测试条目 |
| `companySlug` | `an-thai` | 归属企业实体 ID |
| `title (EN / ZH / TH)` | • EN: `[TEST] Field Testing Briefing & Site-Readiness Visual Check (Bangkok Hub)`<br>• ZH: `【TEST 测试动态】曼谷枢纽现场勘测与技术准备展示联调`<br>• TH: `[TEST] ทดสอบระบบเผยแพร่ข้อมูลภาคสนาม — ศูนย์ประสานงานกรุงเทพฯ` | 带 `[TEST]` 前缀，不出现虚构工程项目名称 |
| `summary` | `[TEST RECORD — NOT FOR PRODUCTION] Verification sample tracing controlled employee post authorization from Bangkok engineering desk to isolated Website Preview and Precast.World Feed.` | 纯描述闭环验证目标，不含虚构工期、数量或客户 |
| `image` | • **首选**：请 Owner 为本演练提供 1 张**已脱敏并确认可做测试的真实现场照片**。<br>• **无新图时的临时联调占位**：仅限在隔离 Preview 内使用授权手册图 `/assets/images/static-load.webp`（900×389），且正文与图注必须标注 `[TEST · Representative Equipment Visual Only — Not Jobsite Record]`；**禁止使用 `assets/images/cases/*.webp` 或 Unsplash 钢结构图片**。 |
| `sourceChannel` | `sourcerating_room_message -> public_post_draft -> admin_approved`（对应 G2/I-5 流程） | 若需测试撤回/修改闭环，测试完成后应执行一次 `status: "retracted"`，确认官网与 Precast Preview 均同步下线。 |
| `canonicalTarget` | 在 Precast.World V3.1 Preview（I-3）卡片中**不复制长文**，外链指回隔离 An-Thai Preview `/updates#TEST-ANTHAI-UPD-0001`。 | 验证“单一内容源（Single Source of Truth）+ 外链回流”。 |

---

## 七、对下游 G3 / G4 / I-3 / I-4 的下一步前置确认（待 Owner & 上游线解锁）

1. **等 SR-00（G2 / I-4）**：完成 `Room/Inquiry`、`PublicPost`、`Selected Message -> Draft -> Approve/Retract` 的真实 API 契约与 Staging (`nunojlfangvnjlwggvvb`) 联调窗口。
2. **请 Owner 提供的 V1.1 实测资料**：
   - 至少 1 组可公开/脱敏的真实工程现场原图与对应事实说明（用于替换测试动态，并验证完整真实企业首发发布）；
   - 决定 `OWNER_GATES #5`（Resend API Key 与发件域名）与 `#7`（PACO/ROGE 关联口径及商用图片授权）放行时间；
   - 指定 G3 端到端验收时使用的 1 名真实员工/管理员测试账号及授权范围。
