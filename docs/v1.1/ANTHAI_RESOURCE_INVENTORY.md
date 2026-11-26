# An-Thai V1.1 企业样板资源盘点清单（G3 第一步）

- **文档版本 / 日期**：`2026-11-26 11:14 +07:00` · 分支：`v1.1/resource-inventory-g3`
- **仓库基线**：`Jamescheng2022/an-thai` · `origin/main` `19bfe290e0b2825bd444089560bbbfe43e3c2e39`（V1.0 生产部署 `dpl_DUC9PFDmBS1V7RhqHgazrYhm7xgc`，对应域名 `https://an-thai.com`）
- **依据文件**：
  - `D:\AgentWorkspaces\command-center\INTEGRATION_BASELINE.md`
  - `Jamescheng2022/global-product-infrastructure@ba851c2` · `docs/integration/ENGINEERING_NETWORK_INTEGRATION_HANDOFF_20261126.md`（第 5、6 节）
  - `D:\AgentWorkspaces\command-center\OWNER_GATES.md`（Gate #5、Gate #7 等）
- **范围与红线**：本轮仅盘点已有资产与能力、编写本清单，**不修改 V1.0 生产代码与发布状态，不新建通用框架，不做接口联调（等待 SR-00 的 I-4 契约），不触发任何真实外联，PACO/ROGE 与 Resend 门禁继续保持开启（HARD HOLD）**。

---

## 一、真实工程业绩与案例档案

### 1.1 总览：An-Thai 直签公开业绩数 = `0`
依据仓库现存的 [content/cases.json](../../content/cases.json)（Schema 2.0，`anThaiDirectStatus.publishedCount`: `0`，`status`: `"nda_clearance_pending"`）与 [content/cases-ai-index.json](../../content/cases-ai-index.json)（`anThaiDirectPublishedCount`: `0`）：
- 官网政策明确声明：**AN-THAI 直签客户合同受双边保密协议（NDA）约束**，必须待客户书面披露授权及合格现场摄影审批完成后才可公开发布。
- 目前线上 `/cases/`（及 `/zh/cases/`、`/th/cases/`）由 [scripts/build-cases.py](../../scripts/build-cases.py) 编译为工程能力范围与交付标准页（`Engineering Scope & Field Delivery Standards`），展示 4 个服务单元能力卡片；**`content/cases.json`、`content/cases-ai-index.json`、`content/project-references-review.json`、`content/image_evidence.json`、`cases/case-template.html` 与 `assets/images/cases/*` 均被 [scripts/build-static.cjs](../../scripts/build-static.cjs) 排除在 `dist/` 发布包外**（V1.0 生产访问返回 `404`）。
- **需注意**：[content/updates.json](../../content/updates.json) 目前**未在 `build-static.cjs` 排除名单中**，详见 §1.3。

### 1.2 已结构化的关联历史参考记录（共 4 条 · 全部维持隐藏 · 受 Owner Gate #7 约束）

| ID | 项目名 / 档案名 | 年份 | 服务类型 / 领域 | 归属主体 | 证据来源 | 能否公开 |
|---|---|---|---|---|---|---|
| `REF-PACO-EMBASSY-SPUN-PILE` | Royal Thai Embassy (Singapore) — Spun Pile Export Reference | `2005` | Precast Spun Piles（基准参考 TIS 398-2563） | Pathumthani Concrete Co., Ltd. (PACO) | `paco-group.com` (Corporate History) | **否（`hold_pending_disclosure`）**：非 AN-THAI 直签合同；受 **Owner Gate #7** 约束（待 Owner 书面确认与 PACO 的法律关联表述及商图授权）。 |
| `REF-PACO-CENTRAL-FESTIVAL` | CentralFestival Inn Ville Project（对应内审台账 `PACO-S09`） | `PACO Record` | Precast Spun Piles & Driving（C60A + PD Pure Drive） | Pathumthani Concrete Co., Ltd. (PACO) | `paco-group.com` (Past Performance) | **否（`hold_pending_verification`, `verified: false`）**：身份及证明材料仍在复核中，且受 **Owner Gate #7** 约束。 |
| `REF-PACO-BMA-BOX-GIRDER` | Precast Box Girders Fabricated per BMA Public Works Design | `1985+` | Precast Structural Girders | Pathumthani Concrete Co., Ltd. (PACO) | `paco-group.com` (Corporate History) | **否（`hold_pending_disclosure`）**：非 AN-THAI 直签合同；受 **Owner Gate #7** 约束，且无相应现场实景证明。 |
| `REF-ROGE-GRADE-A-CONSULTANT` | Roge & Associates — Thai Engineering Consultancy Qualification Profile | `Est. 1983` | Civil Engineering Consultancy（机构资质概况：泰国财政部 Fiscal Policy Office Grade A、105+ 常驻员工） | Roge & Associates Co., Ltd. | `roge.co.th/About-Us/About-Us.html` | **否（`hold_pending_disclosure`）**：机构背景档案（非具体客户中标案例）；财政部 Grade A 与员工人数属 Roge 实体，不得归属为 AN-THAI 自身资质，受 **Owner Gate #7** 约束。 |

### 1.3 内部审查线索与动态草稿（禁止公开展示；其中 `updates.json` 现状需单独跟踪收口）

| 来源文件 | 数量 | 内容概要 | 证据与线上可达状态 |
|---|---:|---|---|
| `content/project-references-review.json` | 23 条 | • **PACO 商住/工业历史名录（`PACO-S01` ~ `PACO-S09`，9 条）**：Bang Yai Square、Lumpini Ville、Tawandang Brewery 等。<br>• **PACO 2017 宣传册工业客户名录（`PACO-I01` ~ `PACO-I11`，11 条）**：Shell、Esso、Thai Oil、IRPC、SCG Dow、Ford 等。<br>• **ROGE 外部顾问提及（`ROGE-P01` ~ `ROGE-P03`，3 条）**：素万那普机场 JICA 评估、Phetchaburi 与 Nong Ruea 灌溉研究。 | `publicPublished: false`, `reviewOnly: true`, `imageUrl: null`，已被 `build-static.cjs` 排除出 `dist/`。未核验 AN-THAI 合同范围、起止日期及授权，**禁止公开展示或归属 AN-THAI**。 |
| `content/updates.json` | 3 条 | `UPD-202611-01`（2026-11-20 声波探头校准）、`UPD-202611-02`（2026-11-15 钢构装运前规程）、`UPD-202611-03`（2026-11-09 PIT 准备指南）。 | 全部 `status: "draft"`, `verified: false`（按 P0-1 审计保留为内部未核实草稿）。**实测现状**：由于 `scripts/build-static.cjs:34` 仅排除了 `cases`/`image_evidence`/`project-references-review` 四份 JSON，未排除 `updates.json`，**`dist/content/updates.json` 仍被打包，`GET https://an-thai.com/content/updates.json` 线上当前返回 `HTTP 200`**（页面 UI 未渲染草稿，但原始 JSON 可直接访问）。本 PR 不改 V1.0 构建，**建议立项单列一条 V1.0 维护单予以隔离收口**。 |

### 1.4 真实工程业绩缺口清单（需请 Owner / 企业补充）
1. **An-Thai 直签真实工程清单（至少 1–3 个）**：需明确脱敏或可公开的项目代号/工程名称、地区、年份、检测/采购/设备服务类型、关键技术规模（且确认无客户 NDA 冲突）。
2. **客户或企业负责人的披露授权**：书面或明确确认可作为官网与 Precast.World V3.1（I-1 / I-3）公开展示记录。
3. **Owner Gate #7 决策**：若未来要启用任何 PACO / ROGE 关联档案，必须先由 Owner 书面确定法律关联措辞及图文版权授权。

---

## 二、现场照片与视觉资产清单

> **全库图像 EXIF 实测结论**：经对仓库 `assets/images/` 全部 **51 张栅格图片**（49 张 `.webp` + 2 张 `.png`）扫描，**51 张全部为 `exif_tags = 0, raw_exif_bytes = 0, xmp = False`**（在 WebP/PNG 转码压制阶段已清除 EXIF、相机型号与 GPS 坐标，无位置隐私泄露风险，但同时无法从图像文件本身追溯原始拍摄时间与地点）。仓库另存有 **23 个 SVG 矢量文件**（纯示意图）。

### 2.1 企业品牌徽标与直连渠道图片（共 6 张 · 可公开）

| 文件路径 | 尺寸 (px) | 来源 | EXIF 状态 | 可公开状态与用途 |
|---|---:|---|---|---|
| `assets/images/brand-logo.webp` | 256×256 | 由 `brand-header.webp` 左侧官方印章无损提取 | 无 EXIF | **可公开**：全站页头、页脚公司徽标（V1.0 PR #33 已上线）。 |
| `assets/images/brand-logo.png` | 256×256 | 同上，透明底 PNG | 无 EXIF | **可公开**：全站 PNG Favicon（PR #33 已上线）。 |
| `assets/images/apple-touch-icon.png` | 180×180 | 同上，纯白底不透明 PNG | 无 EXIF | **可公开**：iOS Apple Touch Icon（PR #33 已上线）。 |
| `assets/images/brand-header.webp` | 615×290 | `ASSET_MANIFEST`（原手册抬头横幅图） | 无 EXIF | **可公开**：旧版页面及徽标源图。 |
| `assets/images/contact-line-qr.webp` | 600×600 | Owner 提供（2026-11-26） | 无 EXIF | **可公开**：官方 LINE（`p0_XsfILmH`）直连二维码（PR #31 已上线）。 |
| `assets/images/contact-wechat-qr.webp` | 600×600 | Owner 提供（2026-11-26） | 无 EXIF | **可公开**：官方微信（`James2021`）二维码（PR #31 已上线）。 |

### 2.2 AN-THAI 宣传册裁切摄影图（共 18 张：7 组主图/派生图 14 张 + Insights 裁切图 4 张 · 仅能力示意，不可充当项目实景）

- **来源与权属严格表述**：
  - `ASSET_MANIFEST.json` **不含** `commercialRightsApproved` 布尔字段，它记录的统一来源口径为 `provenance: "Owner-supplied AN-THAI brochure crop; not independent proof of project ownership"`。
  - `content/image_evidence.json` 的 `publicAuthorizedAssets` 中，宣传册照片**仅 3 张**（`hero-field.webp`、`static-load.webp`、`plate-load.webp`，另有 1 张 Unsplash 摄影图 `steel/steel-structure.webp`，见 §2.3）被显式记录了 `sourceVerified: true, projectMatch: false, commercialRightsApproved: true`（用作 `/cases/` 隐藏记录中的能力配图）；其余 11 张宣传册主图/派生图与 4 张 Insights 裁切图沿用手册自带配图权属（`not independent proof of project ownership`），均不得标注为某特定客户或某特定工程项目的实景。

| 文件路径（含对应 `-small`） | 尺寸 (px) | 来源说明 | EXIF 状态 | 可公开与限制边界 |
|---|---:|---|---|---|
| `assets/images/hero-field.webp` (+ `-small`) | 900×687 / 720×550 | AN-THAI 宣传册打桩/检测拼贴场景；`image_evidence.json` 载 `projectMatch:false, commercialRightsApproved:true` | 无 EXIF | **可公开（能力示意真图）**；含文字遮罩拼贴，不可用于证明特定已完工项目。 |
| `assets/images/static-load.webp` (+ `-small`) | 900×389 / 520×225 | AN-THAI 宣传册静载反应架图；`image_evidence.json` 载 `projectMatch:false, commercialRightsApproved:true` | 无 EXIF | **可公开（能力示意真图）**；不可宣称对应特定客户或荷载数值。 |
| `assets/images/plate-load.webp` (+ `-small`) | 900×522 / 520×301 | AN-THAI 宣传册平板载荷试验图；`image_evidence.json` 载 `projectMatch:false, commercialRightsApproved:true` | 无 EXIF | **可公开（能力示意真图）**（注意：旧 `capabilities` 页第 3 卡曾误用此图展示粉体设备，属已知非阻塞改进项）。 |
| `assets/images/high-strain.webp` (+ `-small`) | 900×480 / 520×277 | AN-THAI 宣传册高应变（PDA）检测场景（`ASSET_MANIFEST`） | 无 EXIF | **可公开（能力示意真图）**。 |
| `assets/images/low-strain.webp` (+ `-small`) | 900×538 / 520×311 | AN-THAI 宣传册低应变（PIT）检测图文合成（`ASSET_MANIFEST`） | 无 EXIF | **可公开（能力示意图）**；含拼贴说明元素。 |
| `assets/images/lab-equipment.webp` (+ `-small`) | 900×513 / 520×297 | AN-THAI 宣传册合作实验室仪器图（`ASSET_MANIFEST`） | 无 EXIF | **可公开（能力示意图）**；代表设备类别，不得推导出自有实验室认证。 |
| `assets/images/office.webp` (+ `-small`) | 567×565 / 421×420 | AN-THAI 宣传册办公环境图（`ASSET_MANIFEST`） | 无 EXIF | **可公开（分辨率偏低）**；About 页使用。 |
| `assets/images/insights/pit-team-cover.webp` | 1000×604 | 源自公司现有手册现场图 | 无 EXIF | **可公开（仅文章配图）**；文档明示不指代特定泰国客户现场。 |
| `assets/images/insights/pit-field-sensor.webp` | 413×500 | 公司宣传册低应变传感器图 | 无 EXIF | **可公开（仅文章配图）**。 |
| `assets/images/insights/static-load-vs-pda-...-static-field-photo.webp` | 575×350 | 裁切自 `static-load.webp` 反应钢梁部分 | 无 EXIF | **可公开（仅文章配图）**；文档明示不证明 AN-THAI 实操特定试验。 |
| `assets/images/insights/static-load-vs-pda-...-pda-field-photo.webp` | 258×576 | 裁切自 `hero-field.webp` 重锤落锤部分 | 无 EXIF | **可公开（低宽竖图 258px）**；仅设备情境参考。 |

### 2.3 开源外部摄影与技术交流参考图（共 13 张 · 仅供页面版式/技术文章使用，严禁当作 AN-THAI 现场照）

| 组别 | 文件清单与尺寸 | 来源与许可 | EXIF 状态 | 使用约束与存量元数据冲突提醒 |
|---|---|---|---|---|
| **钢结构采购页配图（7 张）**<br>`assets/images/steel/` | `steel-hero.webp` (1440×960)<br>`steel-warehouse.webp` (900×1219)<br>`steel-fabrication.webp` (800×1000)<br>`steel-truss.webp` (850×637)<br>`steel-welding.webp` (900×506)<br>`steel-structure.webp` (1300×1733)<br>`steel-cta.webp` (850×650) | Unsplash 摄影师 Declan Sun、Neon Wang、Cemrecan Yurtman、Sebastian Schuster（见 `docs/STEEL_PAGE_PHOTO_SOURCES.md`） | 无 EXIF | Unsplash 商用免版税；**仅可作行业示意图**（Illustrative），严禁标注为 AN-THAI 工厂、团队或项目。<br>**存量元数据冲突备注（供 G3 清理）**：`image_evidence.json` 将 `steel/steel-structure.webp` 列入 `publicAuthorizedAssets`（`commercialRightsApproved: true`），而 `cases.json` 中隐藏条目 `REF-PACO-BMA-BOX-GIRDER` 的图注将其标称为 `"AN-THAI licensed asset"`，实为 Sebastian Schuster 的 Unsplash 摄影作品；当前该记录已隐藏不影响线上，后续清理时须统一口径。 |
| **CSL 文章纪实图（5 张）**<br>`assets/images/insights/` | `bored-pile-csl-debonding-cover.webp` (563×750)<br>`bored-pile-csl-rebar-cage.webp` (1000×750)<br>`bored-pile-cage-installation.webp` (1000×750)<br>`bored-pile-core-drilling-verification.webp` (1000×745)<br>`bored-pile-core-compression-test.webp` (619×750) | Wikimedia Commons（CC BY-SA 4.0 / CC BY 2.0 / CC BY-SA 3.0 / Public Domain） | 无 EXIF | 须保留 CC 署名声明；仅科普与技术分析插图，**不得作为公司项目实景**。 |
| **中国大吨位配重参考照（1 张）**<br>`assets/images/insights/` | `static-load-vs-pda-thailand-pile-capacity-china-large-bags-field-photo.webp` (920×690) | Owner 提供的 2023 年中国现场交流照（已裁掉第三方梁体标识/电话） | 无 EXIF | **标明中国交流参考图**，非泰国与 AN-THAI 施工现场，不证明荷载合规。 |

### 2.4 技术示意图 / 概念图（共 10 张 WebP + 23 个 SVG · 绝对不得当作项目照片）
- **手册概念 WebP（4 张）**：`capabilities.webp` (810×840) + `-small` (405×420)、`csl.webp` (540×795) + `-small` (285×420)。
- **工程原理框图 WebP（6 张，`assets/images/insights/`）**：`global-inspection-dual-core-architecture.webp` (1200×720)、`iso17025-qa-chain-inspection-traceability.webp` (1100×680)、`megaton-slt-anchor-thermal-distortion.webp` (1100×680)、`paut-weld-flaw-vs-geometric-echo.webp` (1100×680)、`pit-impedance-shadowing-defect-masking.webp` (1100×680)、`post-fire-concrete-forensic-damage-zone.webp` (1100×680) —— 全为原创技术示意图（CC BY 4.0）。
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
| **三语页面覆盖（`dist/` 共 47 页）** | `47 = 11 个活跃页面 × 3 语种（33）+ 3 个旧版重命名页面 × 3 语种（`services.html`/`equipment.html`/`portfolio.html` 共 9）+ 5 篇英文文章`。<br>Vercel `vercel.json` 另配置 10 条 308 永久重定向：`/insights.html -> /insights/`，以及 `/services.html`、`/equipment.html`、`/portfolio.html` 的 EN/ZH/TH 全 9 条跳转。 | **局限**：5 篇已发布技术文章（`insights/<slug>.html`）仅提供**英文全文页**，无 `/zh/insights/<slug>.html` 与 `/th/insights/<slug>.html`；文章页语言切换器跳回 `/zh/insights/index.html` 或 `/th/insights/index.html`。 |
| **Resend 状态（Gate #5）** | `api/inquiry.js` 后端与防刷校验已就绪，但 Vercel 生产尚未配 `RESEND_API_KEY` 与发件域名验证。`GET /api/inquiry` 实测返回 `configured: false, backend: "unconfigured"`。 | 受 **Owner Gate #5** 阻塞；放行前前端保持诚实人工渠道兜底，**严禁伪造已发信回执**。 |
| **SourceRating 状态** | `assets/js/sourcerating-embed-adapter.js` v2.2 已置入仓库，默认 `apiBaseUrl: ""` 且不打包进 `dist/`，待 G2/I-4 契约完成并在 staging (`nunojlfangvnjlwggvvb`) 联调。 | 生产库迁移处于 **HARD HOLD（OWNER_GATES #2/#3）**。 |
| **统计与广告合规** | 构建脚本 `scripts/inject-analytics.cjs` 仅在 `VERCEL_ENV === 'production'` 且配了有效 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 时，生成 `dist/assets/js/ga4.js` 并挂入同意横幅（未点击同意前 0 analytics 请求）；另已发布 `ads.txt` 与 `google-adsense-account`。商业转化数据因无只读凭证仍标 `UNKNOWN`（Gate #6）。 | 未经许可不得打开自动跟踪或广告位投放。 |

---

## 四、现有网站模板拆解（为 G4 模板化记录 · 本轮不建通用框架）

### 4.1 模板架构判断
依据 `INTEGRATION_BASELINE.md` 第 6 节核查，历史 `factorysite-os` 仓库仅含两份治理文档无源码，**当前唯一经过生产多端验证的可复用企业网站模板，即本仓库 `an-thai` V1.0（以及 `experiments/gemini-20261121/an-thai-living-studio-v5-4` 的后台草稿概念）**。

### 4.2 可直接复用给第二家工程企业的组件（配置、数据、页面骨架）

| 层级 | 可复用文件 / 模块 | 复用方式说明 |
|---|---|---|
| **无框架静态编译与质检管线** | `scripts/build-static.cjs`、`scripts/localize.py`、`scripts/build-insights.py`、`scripts/build-cases.py`、`scripts/inject-analytics.cjs`、`scripts/check-site.py`、`scripts/check-locales.py`、`scripts/check-insights.py`、`scripts/check-interactions.cjs` | 零第三方构建包，一行打包 `dist/` 并自动输出三语镜像，内建 HTML SVG 自闭合修复、`data-i18n-aria`/`data-i18n-ph` 属性替换、`sitemap.xml`/`llms.txt` 生成、条件生成 `ga4.js`、外链白名单与 `ASSET_MANIFEST` 哈希完整性校核。 |
| **瑞士工程风格设计系统** | `assets/css/styles.css`、`assets/css/portfolio-v1.css` | 全局布局 Token（色彩、排版、栅格、边线卡片）、三语切换顶栏与手风琴菜单、`ol.flow-pipeline` 响应式四步流程图、`.hub-diagram` 企业中心架构组件、全站底栏 + `#deskDrawer` 侧滑询盘抽屉。 |
| **结构化内容 JSON Schema** | `content/insights/*.json`、`content/updates.json`、`content/cases.json`、`content/image_evidence.json` | • 文章：支持结构化节次、图表双分辨率 `mobile_image`、证据声明与 FAQ Schema。<br>• 动态：`updates.json` 可直接映射为 G3/I-3 的受控 `PublicPost` 接口契约。<br>• 案例与图片：`cases.json` 含法人归属字段与三轴证据标记（`sourceVerified`、`projectMatch`、`commercialRightsApproved`）。 |
| **前端运行时与翻译键架构** | `assets/js/i18n-data.js`、`assets/js/site.js`、`api/inquiry.js`、`assets/js/sourcerating-embed-adapter.js` | • `i18n-data.js`（414 组 `EN/ZH/TH` 键值表）。<br>• `site.js` 支持 URL 查询参数预填表单（`?type=&category=&route=`）与无后端诚实降级。<br>• `inquiry.js` 按环境变量注入收件箱/Webhook，与业务实体解耦。<br>• `sourcerating-embed-adapter.js` 以 `apiBaseUrl` + `workspaceKey` 隔离不同企业租户并内置 401 重试与会话重置提示。 |

### 4.3 属于 An-Thai 专属、接入第二家企业时必须替换或参数化的内容

| 类型 | 专属位置 | 说明（G4 产品化时抽离为企业配置文件） |
|---|---|---|
| **品牌标识与联系信息** | `assets/images/brand-logo.*`、`brand-header.webp`、`favicon.ico`、`apple-touch-icon.png`、`contact-line-qr.webp`、`contact-wechat-qr.webp`、页头/页脚/JSON-LD、`i18n-data.js` 会社与联系字段、`api/inquiry.js` 默认收件邮箱 `info@an-thai.com` 与前缀 `ANTHAI-RFQ-` | 需改为按企业 `tenantConfig` 注入名称、LOGO、联系通道与多语标题。 |
| **固定业务路线与页面正文** | `testing.html`、`steel-procurement.html`、`powder-equipment.html`、`testing-instruments.html`、`about.html`、`contact.html`、4 个服务路由 URL、`site.js` 中的 `normalizeRoute` / `CATEGORY_MAP` | 不同企业服务线数目与专业内容不同，G4 时应改为从企业配置生成核心服务路由数组，不再写死 `testing/steel/powder/instruments`。 |
| **行业素材与文章资产** | `content/insights/*.json`（5 篇基桩技术文）、`assets/images/*` | 属于 An-Thai 专属技术文章与行业照片。 |
| **站点域名、重定向与脚本硬编码** | `vercel.json`（历史 URL 重定向）、`sitemap.xml` / `robots.txt` / `llms.txt`、`ads.txt`（`pub-4813203643604350`）、`scripts/build-static.cjs` AdSense meta、**`scripts/inject-analytics.cjs:12` 中硬编码的 `'an-thai.com'` 与 `'www.an-thai.com'`**、`scripts/check-site.py:30` 与 `check-locales.py:54` 中的 `'an-thai.com'` 域名 | 第二家企业必须从配置读取 `primaryDomain`/`allowedHosts`、统计 ID，并关闭或独立配置 AdSense。 |

---

## 五、复制给第二家企业所需的配置项（G4 准备 · 仅清点不建框架）

当 G3 最小闭环在 V1.1 Preview 完整验收后，在 G4 阶段向第二家隔离 TEST 企业租户复制站点时，所需收敛出的独立配置项全集如下（目标：不改业务逻辑与构建脚本，只换配置与内容 JSON 即可运行且租户完全隔离）：

| 配置域 | 具体配置项 Key（对照现有源码映射） | 示例用途 / 隔离要求 |
|---|---|---|
| **1. 租户与域名标识** | `tenantSlug`、`primaryDomain`（如 `https://example-co.com`）、`allowedHosts`（供 `inject-analytics.cjs` / `check-site.py` 校验）、`enabledLocales`（如 `['en','zh','th']`） | 替换所有脚本与 `canonical`/`sitemap.xml`/`robots.txt` 中硬编码的 `an-thai.com`。 |
| **2. 法定主体与品牌视觉** | `legalName`、`shortBrandName`、`brandSub`（EN/ZH/TH）、`officeAddress`、`serviceRegions`、`brandLogoPaths`（`.webp`/`.png`/`apple-touch-icon.png`/`favicon.ico`）、`primaryAccentHex` | 替换页头/页脚徽标、JSON-LD `Organization` / `ProfessionalService` 及主体声明。 |
| **3. 联系与收件配置（服务端环境变量）** | `directEmail`、`directPhone`、`whatsappUrl`、`lineUrl`/`lineQrPath`、`wechatId`/`wechatQrPath`；服务端 Env：`RESEND_API_KEY`、`INQUIRY_FROM_EMAIL`、`INQUIRY_TO_EMAIL`、`INQUIRY_WEBHOOK_URL`、`INQUIRY_STORE_WEBHOOK_URL`、`RFQ_ID_PREFIX` | 收件目标与回执编号完全按租户隔离，配置缺失时 `api/inquiry.js` 必须 fail-closed / 诚实降级，禁止回落硬编码密钥或串投至 An-Thai 邮箱。 |
| **4. SourceRating 协作租户参数** | `sourceRating.apiBaseUrl`、`sourceRating.workspaceKey`、`allowedOrigins`、企业知识库公开事实文档（Section 5 格式） | **严格隔离**：每个企业独立 `workspaceKey`；私有消息、草稿、询盘与 AI KB 均不可跨租户串读。 |
| **5. 业务路线与导航菜单配置** | `serviceLines[]`（`id`, `slug`, `codeLabel`, `navLabel[EN/ZH/TH]`, `summary`, `flowSteps[1..4]`, `ctaRoute`）与 `routeAliases`（用于 `site.js` `normalizeRoute`） | 动态渲染菜单栏、首页业务卡、`.hub-diagram` 及 `flow-pipeline`，不绑死 `testing/steel/powder/instruments`。 |
| **6. 内容与三轴图片证据包** | `content/cases.json`（含 `anThaiDirectStatus` 通用化为 `directPortfolioStatus`）、`content/image_evidence.json`、`content/updates.json`、`content/insights/*.json`、`assets/js/i18n-data.js` | 第二家企业仅携带其自有已核实案例、照片与翻译文本，默认严禁继承 `an-thai` 图片或 PACO/ROGE 线索。 |
| **7. 分析、广告与环境隔离开关** | `NEXT_PUBLIC_GA_MEASUREMENT_ID`、`GA4_DEBUG_MODE`、`adsenseAccount`（可空/关闭）、`legacyRedirects[]`、`previewNoIndex`（隔离测试租户置 `true`） | 第二家 TEST 租户必须配 `robots: noindex,nofollow` 与独立 `sitemap.xml`（或禁止收录）。 |

---

## 六、SourceRating 企业知识库素材（AI 客服可引用的公开事实清单）

> 为 G2 / I-4 上线后 `workspaceKey: "an-thai-th"` 的 AI 辅助与访客询盘接待准备。AI **仅限使用 §6.1 已核实公开事实**，严禁突破 §6.2 限制边界。

### 6.1 允许 AI 直接引用的已核实公开事实
1. **企业基本身份**：AN-THAI Engineering Company Limited 位于泰国曼谷（1339 Arwan Building, Pracharat 1 Rd, Wongsawang, Bangsue District, Bangkok 10800），服务覆盖大曼谷都会区及东部经济走廊（EEC：罗勇/春武里），支持英、中、泰三语工程沟通与协调。
2. **四大业务与可交付说明**：
   - **桩基检测与岩土（Testing & Geotech）**：提供静载试验（SLT）、高应变动力检测（PDA）、低应变完整性检测（PIT）、声波透射法（CSL）、钻孔勘察、原位及材料测试协调，并对接泰国注册专业工程师（PE · วุฒิวิศวกร / สามัญวิศวกร）图纸转换、计算书审核签章与地方建筑许可协调；交付认可检测方案、原始曲线/波形数据及工程解译报告（具体签章责任依合同范围确定）。
   - **买方钢结构采购代理（Buyer-Side Steel Procurement）**：站在国际买方立场执行供应商筛选、技术标比价（RFQ 统一口径）、驻厂过程质量核验、焊缝 NDT 抽查、材质证明（MTC）追溯与装运前放行；不代表卖方/厂家立场。
   - **粉体工艺设备（Powder-Process Equipment）**：立式磨（VRM）、选粉机（Cyclone）、袋式除尘及配套工艺线的技术边界协调，连接买方工况参数与合格制造商的确认规格及供货边界。
   - **工程检测仪器（Testing Instruments）**：协助桩基与实验室测控仪器选型、传感器/数采系统兼容性核对、校准随附文件说明及本地交付支持。
3. **技术交流参考资料**：官网 Insights 公开的 5 篇技术文章主题（CSL 声测管热收缩脱空识别、PIT 报告波形自检七问、PIT 检测前现场准备包、泰国 SLT vs PDA 证据对比分析、`Global Foundation & Full-Spectrum Engineering Inspection` 多规范实战对照），AI 可指引访客阅读相关方法论及现场准备核对清单。
4. **访客联系与询盘引导**：
   - 支持直接引导至官方渠道：`info@an-thai.com`、电话/WhatsApp `+66 90 292 1749`、LINE（`https://line.me/ti/p/p0_XsfILmH`）、微信 `James2021`。
   - 收集技术简报时应引导提供：**所在区域、业务类别、拟用规范（ASTM/EN/GB/TIS/EIT）、图纸或工期目标、以及有效联系邮箱或 WhatsApp/LINE**。

### 6.2 严禁 AI 虚构或外泄的内容红线
- **不得报价与承诺**：严禁编造任何单价、套餐价、测试折扣或承诺固定工期/必过验收结果。
- **不得越权归属 PACO / ROGE**：严禁宣称泰国财政部 Grade A 顾问资质、105+ 常驻人数或 PACO 管桩/箱梁项目为 AN-THAI 本身直接履历与合同业绩。
- **不得编造案例与证书**：严禁捏造尚未披露的 AN-THAI 客户名称、已签署合同数量、ISO/CNAS/DOH 具体证书号、实验报告读数或具名泰籍 PE 执业编号。
- **不得虚报已联系成功**：若 SourceRating 会话或 Resend 未配置/不可用，AI 与界面不得宣称“邮件已发给团队”或“人工客服一定在几分钟内在线”。

---

## 七、第一条 TEST 动态建议素材（仅限 V1.1 隔离 Preview 演练）

> 严格执行交接书第 5 节与全局发布约束：**必须显式标注为 `TEST`**；本建议**不编造工程名称、桩数、吨位或客户名称**；**严禁进入 V1.0 生产（`main`/`an-thai.com`）与搜索引擎索引**，正式动态须由企业授权人（Owner/Admin）以真实核实素材替换确认。

| 字段 | 建议测试值 | 说明 |
|---|---|---|
| `id` | `TEST-ANTHAI-UPD-0001` | 稳定测试主键，方便清理与回滚验证 |
| `isTest` / `visibility` | `isTest: true` · `visibility: "staging_preview_only"` | 硬性标记，防止流入正式环境与搜索索引 |
| `seoRobots` | `noindex, nofollow`（排除出 `sitemap.xml` 与 `llms.txt`） | 防止搜索引擎抓取测试条目 |
| `companySlug` | `an-thai` | 归属企业实体 ID |
| `title (EN / ZH / TH)` | • EN: `[TEST] Field Testing Briefing & Site-Readiness Visual Check (Bangkok Hub)`<br>• ZH: `【TEST 测试动态】曼谷枢纽现场勘测与技术准备展示联调`<br>• TH: `[TEST] ทดสอบระบบเผยแพร่ข้อมูลภาคสนาม — ศูนย์ประสานงานกรุงเทพฯ` | 带 `[TEST]` 前缀，不出现虚构工程项目名称 |
| `summary` | `[TEST RECORD — NOT FOR PRODUCTION] Verification sample tracing controlled employee post authorization from Bangkok engineering desk to isolated Website Preview and Precast.World Feed.` | 纯描述闭环验证目标，不含虚构工期、数量或客户 |
| `image` | • **首选**：请 Owner 为本演练提供 1 张**已脱敏并确认可做测试的真实现场照片**。<br>• **无新图时的临时联调占位**：仅限在隔离 Preview 内使用授权手册图 `/assets/images/static-load.webp`（900×389），且正文与图注必须标注 `[TEST · Representative Equipment Visual Only — Not Jobsite Record]`；**禁止使用 `assets/images/cases/*.webp` 或 Unsplash 钢结构图片**。 | 仅用真实脱敏现场照或显式标注 TEST 的公司设备图，严禁扣留/外部示意图 |
| `sourceChannel` | `sourcerating_room_message -> public_post_draft -> admin_approved`（对应 G2/I-5 流程） | 测试完成后应执行一次撤回（`retracted`），验证官网 Preview 与 Precast Preview 均同步下线。 |
| `canonicalTarget` | 在 Precast.World V3.1 Preview（I-3）卡片中**不复制长文**，外链指回隔离 An-Thai Preview `/updates#TEST-ANTHAI-UPD-0001`。 | 验证“单一内容源（Single Source of Truth）+ 外链回流”。 |

---

## 八、实际工时记录（从本轮开始按工作包记录真实耗时 · 不估算）

| 工作包 | 执行阶段与起止时间（`+07:00` 实际时钟） | 实际耗时 | 阶段状态与依据 |
|---|---|---:|---|
| **G3 第一步：An-Thai V1.1 资源盘点与配置拆解** | • 阶段 1a（`11:03:37` – `11:09:11`）：读取交接书与基线、全库 EXIF 扫描、盘点 6 大板块并提交初稿 `33a3539`<br>• 阶段 1b（`11:09:22` – `11:12:13`）：Claude Opus 5.5 首轮审核（`de45bcae`）<br>• 阶段 1c（`11:12:13` – `11:14:02`）：按 Opus 意见修正 6 项细节、新增第 5 节与第 8 节并提交 `0446d39`<br>• 阶段 1d（`11:14:11` – `11:16:00`）：Claude Opus 5.5 复核 PASS（`a73a79bf`），补全微调措辞并推送（`df8c70f`） | 已实测总计 **`12 分 23 秒`**（`11:03:37` – `11:16:00`） | 已完成文档编写与 Opus 审核 `PASS` |
| **G3 第二步：V1.1 分支接入 SourceRating Bridge + Mock 预审与保护门禁** | • 阶段 2a（`15:09:28` – `15:25:49`）：隔离分支 `feat/v1.1-i4-bridge-g3` 落盘 `3f41b15`（`api/sr-bridge.js`、Adapter、`PublicPost` 动态区、Mock 契约）<br>• 阶段 2b（`15:26:04` – `15:32:50`）：Codex（`c56d3557`）与 Opus（`79947353`）首轮双审并提交 `3af32ab`，经 Codex（`17386aed`）与 Opus（`4ee12961`）PASS 放行 | 已实测总计 **`23 分 22 秒`**（`15:09:28` – `15:32:50`） | 已通过首轮 Preview 放行双审 |
| **G3 第三步：Live SR Staging 联调切换 + 390/768/1440 × EN/ZH/TH 全链路闭合 + Resend 备用通道 + Codex/Opus 终审** | • 阶段 3a（`20:55` – `21:25`）：配置 `SR_BRIDGE_BASE_URL`、关闭默认 Mock 仅留 `?sr_mode=mock`、Preview `noindex`、对齐 SR `senderKind`/`x-bridge-challenge`（`73066bc`、`13785db`）<br>• 阶段 3b（`21:26` – `21:55`）：真实 Staging E2E（`8e93a088`/`1bac4a97`/`a37ebbb2`/`5f416f2a`、`bcfb1e40` 发布与撤回、`A2` 回复 `#6E1DFAC4`），按 Codex 评审（`245aed94`）关闭 3 个 P1 + 5 个 P2 推至 `00516d6` + `https://an-thai-hours30jd-jamescheng2022s-projects.vercel.app`<br>• 阶段 3c（`21:56` – `22:11`）：基于 `00516d6` + SR 固定别名 `https://sourcerating-i4-staging-preview.vercel.app` 复验 `5f416f2a` 与 `bcfb1e40` 撤回（Opus `fdaaef00` PASS）<br>• 阶段 3d（`22:13` – `22:27`）：按补充指令完成 Resend 五段核查、新增 `/api/enquiry` 主备切换 + `【未送达】` 明确兜底 + 紧缩 `sr-bridge` / `test-demo` 清理（`f01def3`）；Vercel 免费版 `api-deployments-free-per-day`（100次/日）触发，故断网备用逻辑通过本地真实 `api/sr-bridge.js` + `api/enquiry.js` + Chromium 全双语实测截图验证，新增云端 Preview 待次日配额刷新后补发 | 累计 **`1 小时 32 分`**（`20:55` – `22:27`，含跨窗口协同等待；终审与台账收尾进行中） | `00516d6` 已在云端 Staging 全通；`f01def3` 本地真实处理器+Chromium 与单测全通过，待最终 Codex + Opus 终审 |
| **G4 验证：第二家隔离 TEST 企业租户（`test-demo` 纯配置构建与跨租户隔离）** | • 商业架构复盘：首次接入通用化改动（`site.js` 约 27 行配置读取与多租户回退清理 + `scripts/build-tenant.cjs` 一次性生成器 310 行）；**此后第 3 家起核心产品代码增量 = 0 行**（仅需 1 份 `config/tenants/<slug>.json`，`test-demo.json` 共 **55 行 / 12 个核心配置域**）<br>• 单次 `build-tenant.cjs` 构建耗时 **`0.24 秒`**；Staging 实测 `workspaceKey: "test-demo"`（`orgId: 11111111-1111-4111-8111-111111111001`）创建 `e62a633f`（`SR-INQ-20261126-E62A633F`），`posts` 返回 `[]`，`an-thai-th` 与 `test-demo` 双向零可见性 | 核心业务代码增量 **0 行**（第 3 家起）；生成器构建 **`0.24 秒`**（`55` 行配置 JSON） | 已完成架构量化与 Staging 跨租户零泄漏实测 |
