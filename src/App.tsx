import { ArrowRight, Bot, CalendarDays, Compass, Sparkles } from 'lucide-react'
import { opportunities } from './data/opportunities'

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="拾机首页">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span>拾机 <em>CampusPick</em></span>
        </a>
        <nav aria-label="主导航">
          <a className="active" href="#discover">发现</a>
          <a href="#plans">计划</a>
          <a href="#advisor">AI 顾问</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="eyebrow"><span /> 新生机会决策助手</div>
          <h1>别让好机会，<br /><strong>淹没在消息里。</strong></h1>
          <p>从 18 条校园信息中，找到真正适合你的比赛、学习与实践机会。</p>
          <div className="hero-actions">
            <a className="button primary" href="#discover">开始探索 <ArrowRight size={18} /></a>
            <a className="button ghost" href="#advisor"><Bot size={18} /> 问问 AI 顾问</a>
          </div>
          <div className="hero-stats" aria-label="数据概览">
            <div><b>{opportunities.length}</b><span>条真实机会</span></div>
            <div><b>6</b><span>类成长方向</span></div>
            <div><b>0</b><span>虚构信息</span></div>
          </div>
        </section>

        <section className="preview" id="discover">
          <div className="section-heading">
            <div><span className="kicker">OPPORTUNITY RADAR</span><h2>此刻值得关注</h2></div>
            <button className="text-button">查看全部 <ArrowRight size={16} /></button>
          </div>
          <div className="card-grid">
            {opportunities.slice(0, 3).map((item, index) => (
              <article className="opportunity-card" key={item.id} style={{ '--delay': `${index * 90}ms` } as React.CSSProperties}>
                <div className="card-top"><span className="type-badge">{item.type}</span><span className="index">{item.id}</span></div>
                <h3>{item.title}</h3>
                <p>{item.original}</p>
                <div className="tags">{item.tags.slice(0, 2).map(tag => <span key={tag}>{tag}</span>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="coming-grid">
          <article id="plans"><CalendarDays /><h3>把机会变成计划</h3><p>收藏、记录和管理参与进度，刷新后依然保留。</p></article>
          <article id="advisor"><Compass /><h3>让推荐有理有据</h3><p>告诉 AI 你的兴趣与时间，获得基于原始信息的建议。</p></article>
        </section>
      </main>

      <footer>拾机 CampusPick · 所有机会信息均来自考核题目提供的模拟数据</footer>
    </div>
  )
}

export default App
