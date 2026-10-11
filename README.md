# 器官一览

# 器官一览

本仓库独立包含了 modpack 中的器官内容与完整设计稿。

器官本体已迁移为数据驱动自定义包（`organs/{data,resources}/*-pack/`，即权威来源），
通过 `sync_packs.bash` 部署到游戏实例的 `organs/` 目录。

仍保留的 forge-only KubeJS 回退内容（技能、掉落/来源、运行时 hook、标签、辅助物品）
位于 `organs/<群系>/kubejs/` 与 `organ_sources/<群系>/kubejs/`，通过 `sync_fallback.bash`
部署到实例的 `kubejs/` 目录。器官引用均已指向通用物品 `organapi:organ_item`（携带
`OrganId`），`migrate_sources.py` 负责这一重指向（幂等，可重跑）。

旧的 kubejs 器官注册与 kubejs→包生成管线（convert_to_packs/resolve_hooks/regenerate）
已随本次迁移退役，包成为权威来源。

## 许可

本仓库所有文件采用 `CC BY-NC 4.0` 协议。

许可链接：`https://creativecommons.org/licenses/by-nc/4.0/`
