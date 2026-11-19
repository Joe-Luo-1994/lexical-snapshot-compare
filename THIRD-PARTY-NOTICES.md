# 來源、授權與修訂界線

本專案自行撰寫的程式與說明採 [MIT](LICENSE)。以下文章、衍生 snapshots 與生成的文章 fixtures 保留 CC-BY-4.0；不因放入本 repository 而改為 MIT。依賴套件各自授權見 lockfile 對應套件；node_modules 不隨 repository 發布。

| 來源 | 作者／歸屬 | 固定版本 | 授權 |
| --- | --- | --- | --- |
| [Configure Liveness, Readiness and Startup Probes](https://github.com/kubernetes/website/blob/6a20979cf474462be672e7387c37dfb0f5f285a4/content/en/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes.md) 及六份 YAML 範例 | The Kubernetes Authors | 6a20979cf474462be672e7387c37dfb0f5f285a4 | [CC-BY-4.0](corpus/sources/CC-BY-4.0.txt) |
| [CNCF 社群行為準則（繁體中文）](https://github.com/cncf/foundation/blob/f2bb3ab459ee44ef5cddc34f285018b7d37837ea/code-of-conduct-languages/zh-tw.md) | CNCF contributors and Traditional Chinese translation contributors | f2bb3ab459ee44ef5cddc34f285018b7d37837ea | CC-BY-4.0；[上游授權聲明](corpus/sources/cncf-license-notices.md) |

原文與雜湊：`corpus/sources/`、[SOURCES.json](corpus/SOURCES.json)。轉錄：`scripts/article-to-lexical.mjs` 以 Markdown AST 建立實際 Lexical 0.18 nodes，再保存原生 JSON。Kubernetes 網站標記作了顯式轉錄，六份程式樣本展開，四個未展開 shortcode 保留可見佔位；詳見 [runtime-report.json](corpus/runtime-report.json)。這不是官方網站的完全複製。

每組 A 是公開原文轉錄；B 是本專案刻意製作的測試修訂，含不合理或錯誤變更，用來檢驗 reviewer 能否找出風險。B **不是上游歷史版本，也不可作為技術操作或規範依據**。變更清單見 `corpus/snapshots/*.answers.json`。兩個來源組織均未背書本工具。

若重用文章、snapshots、文章 fixtures 或含文章的截圖，請連同此歸屬、授權連結、固定來源與修改聲明一併保留。
