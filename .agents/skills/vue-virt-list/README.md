# vue-virt-list Skill

本 skill 用于指导用户或 AI 快速上手 [vue-virt-list](https://github.com/kolarorz/vue-virt-list)（npm 包名 `longmo-vue-virt-list`）虚拟滚动组件库。

## 包含内容

| 文件 | 说明 |
| --- | --- |
| `SKILL.md` | 主入口：快速开始、组件选择、核心概念、文档索引 |
| `references/virt-list-api.md` | VirtList 完整 API |
| `references/virt-tree-api.md` | VirtTree 完整 API（含 Vue2/3 差异、CSS 变量） |
| `references/virt-grid-api.md` | VirtGrid 完整 API |
| `references/best-practices.md` | 性能优化与最佳实践 |
| `references/common-pitfalls.md` | 常见踩坑与解决方案 |
| `references/examples.md` | 20+ 实用代码示例 |
| `assets/templates/basic-virt-list.vue` | 基础虚拟列表模板 |
| `assets/templates/lazy-tree.vue` | 懒加载树模板 |
| `assets/templates/grid-layout.vue` | 虚拟网格模板 |

## 设计目标

- **无源码可用**：所有 API 说明、示例、模板都自包含，无需阅读组件库源码即可上手。
- **可直接复制**：模板文件是完整可运行的 Vue 单文件组件。
- **覆盖踩坑**：汇总社区与官方文档中的高频问题与解决方案。

## 适用场景

- 渲染海量数据（列表 / 树 / 网格）且要求高性能。
- 需要虚拟树（懒加载、勾选、拖拽、筛选）。
- 排查滚动白屏、高度跳动、视图不刷新等问题。
