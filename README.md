# Lumen Tarot

Lumen Tarot 是一个面向中文用户的沉浸式塔罗自我反思网站。产品通过牌阵结构、牌面象征、正逆位和可行动建议，帮助用户观察问题，而不是替用户做决定。

**在线体验：** [lumentarot.cn](https://lumentarot.cn)

## 产品特性

- 78 张 Rider-Waite-Smith 塔罗牌，默认包含正位与逆位。
- 四种牌阵：今日一牌、三张时间流、二选一牌阵、维纳斯爱情牌阵。
- 沉思、洗牌、双弧形选牌、阵位放置与逐张翻牌的完整仪式。
- 逐牌六层解析与根据牌面组合生成的整组总结。
- 响应式桌面端与移动端体验。
- 舒缓的程序化声音与本地解读存档。

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

然后打开终端中显示的本地地址。

## 检查与构建

```bash
npm run lint
npm test
```

## 技术结构

- Next.js 16 / React 19
- vinext / Vite
- TypeScript
- CSS 动画与 Web Audio API
- 浏览器 Local Storage 存档

## 牌面来源

Rider-Waite-Smith 塔罗牌由 Pamela Colman Smith 于 1909 年绘制。本项目使用的公版扫描版来自 [metabismuth/tarot-json](https://github.com/metabismuth/tarot-json)，详见 [`public/cards/NOTICE.txt`](public/cards/NOTICE.txt)。

## 声明

本站内容用于自我反思与娱乐，不替代医疗、法律、财务或心理健康专业建议。
