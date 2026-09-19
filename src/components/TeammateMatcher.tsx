import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Bookmark, Check, Clock3, Info, Plus, RotateCcw, Sparkles, UserRoundSearch, Users, X } from 'lucide-react'
import { mockTeammates, type TeammateDirection, type TeammateProfile, type TeammateSkill } from '../data/teammates'
import { useLocalStorage } from '../hooks/useLocalStorage'

type Answers = { direction: TeammateDirection; mySkill: TeammateSkill; needSkill: TeammateSkill; hours: number; style: TeammateProfile['style'] }
const directions: TeammateDirection[] = ['AI应用', '前端开发', '算法竞赛', '产品设计', '数据分析']
const skills: TeammateSkill[] = ['开发', '设计', '产品', '文案', '演讲']
const styles: TeammateProfile['style'][] = ['规划清晰', '边做边迭代', '冲刺型']
const initial: Answers = { direction: 'AI应用', mySkill: '开发', needSkill: '设计', hours: 4, style: '边做边迭代' }
const API = 'https://supernz.xyz/zcst/api'
type JoinForm = { nickname: string; grade: string; major: string; direction: TeammateDirection; skill: TeammateSkill; wantedSkill: TeammateSkill; weeklyHours: number; style: TeammateProfile['style']; goal: string; intro: string; availability: string }
const initialJoin: JoinForm = { nickname: '', grade: '大一', major: '', direction: 'AI应用', skill: '开发', wantedSkill: '设计', weeklyHours: 4, style: '边做边迭代', goal: '', intro: '', availability: '' }

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
  const [pool, setPool] = useState<TeammateProfile[]>(mockTeammates)
  const [joining, setJoining] = useState(false)
  const [joinForm, setJoinForm] = useState<JoinForm>(initialJoin)
  const [joinState, setJoinState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [clientId] = useLocalStorage('campuspick-pool-client-v1', crypto.randomUUID())
  useEffect(() => { fetch(`${API}/teammates`).then(response => response.json()).then(data => { if (Array.isArray(data.teammates) && data.teammates.length) setPool([...mockTeammates, ...data.teammates.filter((item: TeammateProfile) => !mockTeammates.some(mock => mock.id === item.id))]) }).catch(() => undefined) }, [])
  const results = useMemo(() => pool.map(item => score(item, answers)).sort((a, b) => b.value - a.value).slice(0, 6), [answers, pool])
  const questions = [
    { title: '你想探索什么方向？', hint: '选择这次组队最关注的项目方向', values: directions, value: answers.direction, set: (value: string) => setAnswers({ ...answers, direction: value as TeammateDirection }) },
    { title: '你最能贡献什么？', hint: '选择目前最有信心承担的角色', values: skills, value: answers.mySkill, set: (value: string) => setAnswers({ ...answers, mySkill: value as TeammateSkill }) },
    { title: '你希望队友补充什么？', hint: '互补能力会显著提高匹配分数', values: skills, value: answers.needSkill, set: (value: string) => setAnswers({ ...answers, needSkill: value as TeammateSkill }) },
    { title: '你偏好怎样的合作节奏？', hint: '减少组队后因工作方式不同产生的摩擦', values: styles, value: answers.style, set: (value: string) => setAnswers({ ...answers, style: value as TeammateProfile['style'] }) },
  ]

  function toggle(id: string) { setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]) }
  function reset() { setAnswers(initial); setStep(0) }
  async function joinPool(event: React.FormEvent) {
    event.preventDefault(); setJoinState('sending')
    try {
      const response = await fetch(`${API}/teammates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, nickname: joinForm.nickname, grade: joinForm.grade, major: joinForm.major, direction: [joinForm.direction], skills: [joinForm.skill], wantedSkills: [joinForm.wantedSkill], weeklyHours: joinForm.weeklyHours, style: joinForm.style, goal: joinForm.goal, intro: joinForm.intro, availability: joinForm.availability }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error)
      setPool(current => [...current.filter(item => item.id !== data.profile.id), data.profile]); setJoinState('success')
    } catch { setJoinState('error') }
  }

  return <section className="page-view teammate-page">
    <div className="page-intro teammate-intro"><div><span className="kicker">TEAM MATCH</span><h1>找到合拍的队友</h1><p>用一份简短问卷，发现方向一致、能力互补的合作伙伴。</p><div className="mock-label"><Info size={14}/> 初始候选人为模拟数据，用户可自愿加入真实匹配池</div></div><button className="button join-pool-button" onClick={() => { setJoining(true); setJoinState('idle') }}><Plus size={18}/> 我也想加入匹配池</button></div>
    {step < questions.length ? <div className="quiz-shell">
      <div className="quiz-progress"><span>匹配问卷</span><b>{step + 1} / {questions.length}</b><div><i style={{ width: `${(step + 1) / questions.length * 100}%` }}/></div></div>
      <div className="quiz-card"><span className="question-number">0{step + 1}</span><h2>{questions[step].title}</h2><p>{questions[step].hint}</p><div className="answer-grid">{questions[step].values.map(value => <button className={questions[step].value === value ? 'active' : ''} key={value} onClick={() => questions[step].set(value)}><span>{value}</span>{questions[step].value === value && <Check size={17}/>}</button>)}</div>{step === 2 && <div className="hours-control"><label>每周可投入时间 <b>{answers.hours} 小时</b></label><input type="range" min="2" max="10" step="1" value={answers.hours} onChange={event => setAnswers({ ...answers, hours: Number(event.target.value) })}/><div><span>2 小时</span><span>10 小时</span></div></div>}<div className="quiz-actions"><button className="button ghost" disabled={step === 0} onClick={() => setStep(value => value - 1)}><ArrowLeft size={17}/> 上一步</button><button className="button primary" onClick={() => setStep(value => value + 1)}>{step === questions.length - 1 ? <><Sparkles size={17}/> 查看匹配</> : <>下一步 <ArrowRight size={17}/></>}</button></div></div>
    </div> : <div className="match-results"><div className="results-head"><div><span className="kicker">YOUR MATCHES</span><h2>为你找到 {results.length} 位候选队友</h2><p>匹配度综合方向、能力互补、时间投入与合作节奏计算。</p></div><button className="button ghost" onClick={reset}><RotateCcw size={16}/> 重新填写</button></div><div className="teammate-grid">{results.map(({ profile, value, reasons }, index) => <article className="teammate-card" key={profile.id} style={{ '--rank': index } as React.CSSProperties}><div className="profile-top"><div className="avatar">{profile.nickname.slice(-1)}</div><div><h3>{profile.nickname}</h3><span>{profile.grade} · {profile.major}</span></div><div className="match-score"><b>{value}%</b><span>匹配</span></div></div><p className="profile-intro">{profile.intro}</p><div className="profile-skills"><span>擅长</span>{profile.skills.map(item => <b key={item}>{item}</b>)}<span>期待</span>{profile.wantedSkills.map(item => <b className="wanted" key={item}>{item}</b>)}</div><div className="reason-list">{reasons.slice(0, 3).map(item => <span key={item}><Check size={13}/>{item}</span>)}</div><div className="profile-meta"><span><Clock3 size={13}/>{profile.weeklyHours} 小时/周</span><span><Users size={13}/>{profile.style}</span></div><button className={`save-match ${saved.includes(profile.id) ? 'saved' : ''}`} onClick={() => toggle(profile.id)}><Bookmark size={16} fill={saved.includes(profile.id) ? 'currentColor' : 'none'}/>{saved.includes(profile.id) ? '已收藏候选人' : '收藏候选人'}</button></article>)}</div><div className="match-boundary"><UserRoundSearch/><div><b>匹配资料不包含联系方式</b><span>真实资料由用户自愿公开；初始演示人物均为模拟资料。</span></div></div></div>}
    {joining && <div className="modal-backdrop"><form className="join-modal" onSubmit={joinPool}><button type="button" className="modal-close" onClick={() => setJoining(false)}><X/></button>{joinState === 'success' ? <div className="join-success"><Check/><h2>你已进入匹配池</h2><p>其他用户现在可以根据公开资料匹配到你。再次填写会更新你的资料。</p><button type="button" className="button primary" onClick={() => setJoining(false)}>完成</button></div> : <><span className="kicker">JOIN THE POOL</span><h2>我也想加入匹配池</h2><p className="form-hint">只公开下方资料，请不要填写手机号、微信或真实姓名。</p><div className="join-form-grid"><label>昵称<input required maxLength={16} value={joinForm.nickname} onChange={e => setJoinForm({...joinForm,nickname:e.target.value})}/></label><label>年级<select value={joinForm.grade} onChange={e => setJoinForm({...joinForm,grade:e.target.value})}><option>大一</option><option>大二</option><option>大三</option><option>大四</option></select></label><label>专业<input required maxLength={30} value={joinForm.major} onChange={e => setJoinForm({...joinForm,major:e.target.value})}/></label><label>目标方向<select value={joinForm.direction} onChange={e => setJoinForm({...joinForm,direction:e.target.value as TeammateDirection})}>{directions.map(x=><option key={x}>{x}</option>)}</select></label><label>我的能力<select value={joinForm.skill} onChange={e => setJoinForm({...joinForm,skill:e.target.value as TeammateSkill})}>{skills.map(x=><option key={x}>{x}</option>)}</select></label><label>期待能力<select value={joinForm.wantedSkill} onChange={e => setJoinForm({...joinForm,wantedSkill:e.target.value as TeammateSkill})}>{skills.map(x=><option key={x}>{x}</option>)}</select></label><label>合作节奏<select value={joinForm.style} onChange={e => setJoinForm({...joinForm,style:e.target.value as TeammateProfile['style']})}>{styles.map(x=><option key={x}>{x}</option>)}</select></label><label>每周时间<input type="number" min={1} max={20} value={joinForm.weeklyHours} onChange={e => setJoinForm({...joinForm,weeklyHours:Number(e.target.value)})}/></label><label className="wide">目标项目<input maxLength={40} value={joinForm.goal} onChange={e => setJoinForm({...joinForm,goal:e.target.value})} placeholder="例如：AI创新应用挑战赛"/></label><label className="wide">自我介绍<textarea required maxLength={160} value={joinForm.intro} onChange={e => setJoinForm({...joinForm,intro:e.target.value})}/></label><label className="wide">方便协作的时间<input maxLength={60} value={joinForm.availability} onChange={e => setJoinForm({...joinForm,availability:e.target.value})} placeholder="例如：周二、周四晚上"/></label></div>{joinState === 'error' && <p className="form-error">提交失败，请检查网络和必填项后重试。</p>}<button className="button primary join-submit" disabled={joinState==='sending'}>{joinState==='sending'?'正在加入…':'同意公开以上资料并加入'}</button></>}</form></div>}
  </section>
}
