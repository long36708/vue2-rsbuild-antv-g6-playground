# Vue2 + Rsbuild + AntV G6 Playground

一个用于学习与实践 [AntV G6](https://g6.antv.antgroup.com/) 图可视化的前端 playground 项目，基于 Vue 2 + Rsbuild 构建。

## 技术栈

- **Vue 2.7** + **Rsbuild**（由 Rspack 驱动，替代传统 webpack）
- **AntV G6 v5** 图可视化引擎
- **Element UI** 组件库
- **v-contextmenu** 右键菜单组件

> 请不要将 Vue 响应式数据直接传递给 G6 实例，这可能会导致 G6 无法正确渲染，甚至导致页面崩溃。

## 快速开始

安装依赖：

```bash
pnpm install
```

启动开发服务器，应用默认运行在 [http://localhost:3000](http://localhost:3000)：

```bash
pnpm run dev
```

构建生产版本：

```bash
pnpm run build
```

本地预览生产构建：

```bash
pnpm run preview
```

## 页面与功能

| 路由                        | 页面              | 说明                        |
|---------------------------|-----------------|---------------------------|
| `/`                       | Home            | 导航入口，汇总各 playground 页面的链接 |
| `/prototype/dag-tag-tree` | TagDagPrototype | 多父节点标签树原型（详见下方）           |

### 多父节点标签树原型（TagDagPrototype）

一个支持**节点拥有多个父节点**的标签树可视化原型，底层使用 DAG（有向无环图）模型：

- **DAG 核心逻辑**：位于 `src/prototype/tagDag.js`，提供节点的增删改、父子关系维护、祖先/后代查询、环路检测、层级统计等纯函数。
- **环检测**：新增边时校验是否会产生环，避免非法 DAG。
- **层级限制**：限制最大层级（默认 10 级），超出时给出明确反馈。
- **多父节点**：允许一个节点被多个父节点引用，支持跨支线汇聚。
- **右键菜单**：基于 `v-contextmenu` 实现，自动定位到鼠标位置，支持「添加子节点 / 添加父节点 / 修改信息 / 删除节点」。

> 说明：原型中的示例数据已扩展为 10 级深链，并补充了跨支线多父节点汇聚的节点，用于验证环检测与层级限制。

## 目录结构

```
src/
├── views/
│   ├── Home.vue              # 导航入口
│   └── TagDagPrototype.vue   # 多父节点标签树原型页面
├── prototype/
│   └── tagDag.js             # DAG 核心逻辑（纯函数）
├── router/                   # Vue Router 配置
├── App.vue
└── index.js                  # 应用入口，注册 Element UI 与 v-contextmenu
```

## 学习资源

- [Rsbuild 文档](https://rsbuild.rs) - 探索 Rsbuild 特性与 API
- [Rsbuild GitHub](https://github.com/web-infra-dev/rsbuild) - 欢迎反馈与贡献
- [AntV G6 文档](https://g6.antv.antgroup.com/) - G6 图可视化引擎
