# PyinNyar study abroad

缅甸学生的中、缅、英三语静态留学网站。生产网址由 **`SITE.url` in `dist/site-config.mjs`** 单独配置。当前发布到 <https://jeffery2004024-png.github.io/pyinnyar/>。

## 构建与部署

无需运行服务器、数据库、账号系统、ChatGPT Sites API 或 npm 包。

```sh
node scripts/build-site.mjs
node --test tests/*.test.mjs
python3 scripts/serve-preview.py
```

GitHub Actions 从 `main` 构建、运行检查并将 `dist/` 上传到 GitHub Pages。工作流只读取源码，并在部署步骤使用 Pages 和 OIDC 最小权限；无自建部署密钥或 token。GitHub 仓库 Pages 的发布来源选 **GitHub Actions**。不将任何凭据、私人学生资料、`.env` 文件提交到仓库。

## 地址与搜索

- 根地址自动进入 `/pyinnyar/my/`。
- 每种语言都有可直接抓取的完整 HTML：`my/`、`zh/`、`en/`；各自包含首页、`match/`、`universities/`、`destinations/`、`scholarships/`。
- `templates/` 是基础 HTML，`dist/app.js`、各 `*-i18n.mjs` 是三语文案，`scripts/build-seo.py` 生成标题、摘要、canonical、hreflang、Open Graph、Twitter 和 EducationalOrganization JSON-LD。
- `dist/assets/share-card.png` 是1200×630的书本品牌分享图，无人物、虚构学生或录取结果；重生成可运行 `scripts/create-share-card.py`（Pillow，生成一次后 PNG 直接入库，部署不需要 Pillow）。
- `/pyinnyar/sitemap.xml` 列出15个三语 canonical 页面；`robots.txt` 随项目提供。搜索引擎通常从域名根目录读取 robots，而项目站不能控制 `username.github.io/robots.txt`，因此必须在站长工具直接提交本项目 sitemap。
- 404页面提供三语首页入口，并修复可识别的旧式成绩/目录路径。
- 搜索收录和排名由搜索引擎决定。迁移后请在 Google Search Console 和 Bing Webmaster 添加新 URL-prefix 属性并提交 sitemap；更新 Facebook 等公开入口。

## 本地预览和验收

`python3 scripts/serve-preview.py` 在 `http://127.0.0.1:4173/pyinnyar/` 模拟项目子路径。`python3 qa/serve.py` 提供仅本机的 Safari 375/768/1440px 三语自查；其脚本、报告不发布进 dist。

## 成绩与院校数据

成绩匹配、校验、语言切换、文件导入导出和本机保存完全在浏览器执行。只点击保存才写入当前设备；不会上传给顾问或学校。Messenger 链接不会自动附加成绩。

`research/*.json` 保存官方来源和核查日期；构建生成静态 `dist/data/`。保留143所院校、212条路径的既有规则和学历差异；GED不换算百分制、AS不算完整A-Level、比赛不增加虚构分数。需后续按官方新简章维护研究资料。

联系方式在 `dist/site-config.mjs`；未知 Viber、电话、邮箱、地址等字段保持空。`student-cases.mjs` 为空，只有获得发布同意且核实的真实案例才可展示。

## 以后绑定自有域名（现在不添加 CNAME）

1. 购买并确认域名归属，在 GitHub 个人设置 **Pages** 验证域名（按 GitHub 提供的 TXT 记录操作）。
2. 按 [GitHub 官方自有域名说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) 配置 DNS。子域名通常 CNAME 到 `jeffery2004024-png.github.io`，不把 `/pyinnyar/` 写入 DNS；裸域使用 GitHub 当时公布的 A/AAAA/ALIAS 规则。
3. 修改 `dist/site-config.mjs` 的唯一 `SITE.url` 为带末尾斜杠的新完整地址（例如 `https://www.example.com/`）；所有 base path、canonical、分享图、sitemap 和语言地址会随构建更新。
4. 在仓库 Settings → Pages 填入已验证的自有域名，按 GitHub 要求添加 CNAME，等待证书后启用 Enforce HTTPS，重新部署并检查。
5. 更新旧站跳转目标、站长工具属性、sitemap 和 Facebook 网站栏；保留旧域名的跳转。

本项目当前没有 CNAME，也没有虚构电话、地址、学生评价或录取案例。

## 本次迁移验收（2026-10-15）

- GitHub Actions 构建和部署成功；Pages `build_type=workflow`、`https_enforced=true`、`cname=null`。
- 23项 Node 检查全部通过；Safari 在375、768、1440px的三语首页和成绩页完成55项检查，0失败（含选考、录入、匹配、语言切换、保存/导出/导入和加载骨架）。
- 线上根入口、15个语言页面、sitemap、robots、分享图、favicon及三个数据 JSON 均HTTP200，响应与本地构建逐字节一致。
- 原站由 Sites 插件保留为三语跳转入口；旧站默认中文、my/en保持语言，页面、查询参数和片段保留。`scripts/build-legacy-redirects.mjs <旧站dist绝对路径>` 提供迁移生成器，请勿指向本仓库dist。旧站保留自己的 Google 验证文件/标记。

### 站长本人后续操作

1. Google Search Console 添加 URL-prefix 属性 `https://jeffery2004024-png.github.io/pyinnyar/`，使用 Google 返回的新 HTML 验证文件或 meta（填写 `config/seo.json` 后重建）。旧站的验证标记不代表新站已验证。
2. 提交 `https://jeffery2004024-png.github.io/pyinnyar/sitemap.xml`，可分别请求收录三语首页及主要功能页。
3. Bing Webmaster Tools 添加新站并验证、提交同一个 sitemap（也可按其流程从已验证的 Google 属性导入）。
4. Facebook专页“网站”栏及其他公开简介、宣传材料改成新网址。保留旧站，供旧链接和搜索引擎逐步迁移。

搜索引擎需要自行抓取并更新索引；静态站发布和跳转不代表已经收录或达到特定排名。
