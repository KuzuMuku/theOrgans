# 器官一览

本仓库独立包含了 modpack 中的器官内容与完整设计稿。

## 仓库结构

- `packs/{data,resources}/*-pack/` —— 数据驱动的器官包，**权威来源**（服务端定义 + 客户端资源）。
  由 `sync_packs.bash` 部署到实例的 `<gameDir>/organs/` 目录（实例扫描约定路径）。
- `kubejs/` —— 合并后的 forge-only KubeJS 回退内容：技能、掉落/来源、运行时 hook、标签、辅助物品。
  脚本按 `startup_scripts/<群系>/`、`server_scripts/<群系>/`（`common/` 为共享 helper）组织，
  `assets/`、`data/`、`lang` 合并到标准命名空间路径。由 `sync_fallback.bash` 部署到实例 `kubejs/`。
- `others/` —— 非器官 KubeJS（维度锁、怪物难度、network、zhCN 汉化、quest 任务、config），独立保留，
  由 `sync_fallback.bash` 一并部署并合并其汉化。
- `docs/` —— 所有设计稿（核心哲学、流派扩展、各群系修改/实现方案）。

器官引用均已指向通用物品 `organapi:organ_item`（携带 `OrganId`）。旧的 kubejs 器官注册与
kubejs→包生成管线已退役，包成为权威来源。

## 许可

本仓库所有文件采用 `CC BY-NC 4.0` 协议。

许可链接：`https://creativecommons.org/licenses/by-nc/4.0/`
