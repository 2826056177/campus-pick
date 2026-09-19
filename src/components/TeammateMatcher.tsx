import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Bookmark, Check, Clock3, Info, RotateCcw, Sparkles, UserRoundSearch, Users } from 'lucide-react'
import { mockTeammates, type TeammateDirection, type TeammateProfile, type TeammateSkill } from '../data/teammates'
import { useLocalStorage } from '../hooks/useLocalStorage'

type Answers = { direction: TeammateDirection; mySkill: TeammateSkill; needSkill: TeammateSkill; hours: number; style: TeammateProfile['style'] }
const directions: TeammateDirection[] = ['AI应用', '前端开发', '算法竞赛', '产品设计', '数据分析']
const skills: TeammateSkill[] = ['开发', '设计', '产品', '文案', '演讲']
const styles: TeammateProfile['style'][] = ['规划清晰', '边做边迭代', '冲刺型']
const initial: Answers = { direction: 'AI应用', mySkill: '开发', needSkill: '设计', hours: 4, style: '边做边迭代' }

function score(profile: TeammateProfile, answers: Answers) {
  let value = 45
  const reasons: string[] = []
  if (profile.direction.includes(answers.direction)) { value += 18; reasons.push(`同样关注${answers.direction}`) }
  if (profile.skills.includes(answers.needSkill)) { value += 16; reasons.push(`能补充你需要的${answers.needSkill}能力`) }
  if (profile.wantedSkills.includes(answers.mySkill)) { value += 10; reasons.push(`正在寻找擅长${answers.mySkill}的队友`) }
  if (Math.abs(profile.weeklyHours - answers.hours) <= 2) { value += 7; reasons.push('每周可投入时间接近') }
  if (profile.style === answers.style) { value += 4; reasons.push('合作节奏偏好一致') }
  return { profile, value: Math.min(value, 98), reasons }
}

export function TeammateMatcher() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>(initial)
  const [saved, setSaved] = useLocalStorage<string[]>('campuspick-teammates-v1', [])
  const results = useMemo(() => mockTeammates.map(item => score(item, answers)).sort((a, b) => b.value - a.value).slice(0, 4), [answers])
  const questions = [
    { title: '你想探索什么方向？', hint: '选择这次组队最关注的项目方向', values: directions, value: answers.direction, set: (value: string) => setAnswers({ ...answers, direction: value as TeammateDirection }) },
    { title: '你最能贡献什么？', hint: '选择目前最有信心承担的角色', values: skills, value: answers.mySkill, set: (value: string) => setAnswers({ ...answers, mySkill: value as TeammateSkill }) },
    { title: '你希望队友补充什么？', hint: '互补能力会显著提高匹配分数', values: skills, value: answers.needSkill, set: (value: string) => setAnswers({ ...answers, needSkill: value as TeammateSkill }) },
    { title: '你偏好怎样的合作节奏？', hint: '减少组队后因工作方式不同产生的摩擦', values: styles, value: answers.style, set: (value: string) => setAnswers({ ...answers, style: value as TeammateProfile['style'] }) },
  ]

  function toggle(id: string) { setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]) }
  function reset() { setAnswers(initial); setStep(0) }

  return <section className="page-view teammate-page">
    <div className="page-intro teammate-intro"><span className="kicker">TEAM MATCH</span><h1>找到合拍的队友</h1><p>用一份简短问卷，发现方向一致、能力互补的合作伙伴。</p><div className="mock-label"><Info size={14}/> 当前候选人为模拟数据，仅用于展示匹配功能</div></div>
    {step < questions.length ? <div className="quiz-shell">
      <div className="quiz-progress"><span>匹配问卷</span><b>{step + 1} / {questions.length}</b><div><i style={{ width: `${(step + 1) / questions.length * 100}%` }}/></div></div>
      <div className="quiz-card"><span className="question-number">0{step + 1}</span><h2>{questions[step].title}</h2><p>{questions[step].hint}</p><div className="answer-grid">{questions[step].values.map(value => <button className={questions[step].value === value ? 'active' : ''} key={value} onClick={() => questions[step].set(value)}><span>{value}</span>{questions[step].value === value && <Check size={17}/>}</button>)}</div>{step === 2 && <div className="hours-control"><label>每周可投入时间 <b>{answers.hours} 小时</b></label><input type="range" min="2" max="10" step="1" value={answers.hours} onChange={event => setAnswers({ ...answers, hours: Number(event.target.value) })}/><div><span>2 小时</span><span>10 小时</span></div></div>}<div className="quiz-actions"><button className="button ghost" disabled={step === 0} onClick={() => setStep(value => value - 1)}><ArrowLeft size={17}/> 上一步</button><button className="button primary" onClick={() => setStep(value => value + 1)}>{step === questions.length - 1 ? <><Sparkles size={17}/> 查看匹配</> : <>下一步 <ArrowRight size={17}/></>}</button></div></div>
    </div> : <div className="match-results"><div className="results-head"><div><span className="kicker">YOUR MATCHES</span><h2>为你找到 {results.length} 位候选队友</h2><p>匹配度综合方向、能力互补、时间投入与合作节奏计算。</p></div><button className="button ghost" onClick={reset}><RotateCcw size={16}/> 重新填写</button></div><div className="teammate-grid">{results.map(({ profile, value, reasons }, index) => <article className="teammate-card" key={profile.id} style={{ '--rank': index } as React.CSSProperties}><div className="profile-top"><div className="avatar">{profile.nickname.slice(-1)}</div><div><h3>{profile.nickname}</h3><span>{profile.grade} · {profile.major}</span></div><div className="match-score"><b>{value}%</b><span>匹配</span></div></div><p className="profile-intro">{profile.intro}</p><div className="profile-skills"><span>擅长</span>{profile.skills.map(item => <b key={item}>{item}</b>)}<span>期待</span>{profile.wantedSkills.map(item => <b className="wanted" key={item}>{item}</b>)}</div><div className="reason-list">{reasons.slice(0, 3).map(item => <span key={item}><Check size={13}/>{item}</span>)}</div><div className="profile-meta"><span><Clock3 size={13}/>{profile.weeklyHours} 小时/周</span><span><Users size={13}/>{profile.style}</span></div><button className={`save-match ${saved.includes(profile.id) ? 'saved' : ''}`} onClick={() => toggle(profile.id)}><Bookmark size={16} fill={saved.includes(profile.id) ? 'currentColor' : 'none'}/>{saved.includes(profile.id) ? '已收藏候选人' : '收藏候选人'}</button></article>)}</div><div className="match-boundary"><UserRoundSearch/><div><b>这是匹配演示，不会直接联系真实同学</b><span>正式版本可接入经本人授权的资料、校内身份验证与双向同意机制。</span></div></div></div>}
  </section>
}
