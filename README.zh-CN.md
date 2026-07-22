# Interview Dojo OS

**v0.1.0** 是本地优先的技术面试训练系统：记录计时练习、答案版本、透明自评 rubric、回放、知识点趋势与可控导出。它不把自评伪装成招聘结论。

![题库界面](docs/assets/library.png)

## 最快运行

```bash
npm ci
npm run dev
```

浏览器打开 `http://localhost:3000`。首次打开会把仓库内的 20 道原创样题导入本机 SQLite 数据库；选择题目、保存答案版本、记录 rubric，即可在刷新后继续查看同一条训练记录。

## 主要能力

- JSON 题包导入/导出，所有样例可离线复现。
- 计时会话、答案版本与操作时间线持久化。
- 明确展示的 0–4 加权自评，不输出“录用/淘汰”结论。
- 基于已完成自评计算知识点弱项趋势。
- 训练报告默认不含本地答案，只有主动勾选后才会导出。

## 命令

```bash
npm run lint && npm run typecheck && npm run test:coverage && npm run test:e2e && npm run build
npm run package
make verify
make demo
make package
make release-check
```

没有 `make` 时，请使用等价的 `npm run verify`、`npm run demo`、`npm run package`、`npm run release-check`。

## 隐私边界

默认数据文件是本机的 `data/interview-dojo.db`；不需要账号、云同步或分析服务。报告默认删除答案正文。详见 [隐私与安全说明](docs/PRIVACY_AND_SECURITY.md)。

## 非目标与差异化

它不是自动招聘评估、监考或云端 AI 面试助手。公开仓库抽样检索未发现同名且高度同构的活跃项目；本项目的差异在于离线 SQLite、可回放的答案版本、透明人工自评和默认脱敏导出。竞品样本见 [COMPETITOR_SCAN.md](docs/COMPETITOR_SCAN.md)。

贡献方式请见 [CONTRIBUTING.md](CONTRIBUTING.md)。
