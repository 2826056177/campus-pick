import { ArrowUpRight, Bookmark, CalendarClock } from 'lucide-react'
import type { Opportunity, PlanEntry } from '../types'

interface Props { item: Opportunity; plan?: PlanEntry; onOpen: (item: Opportunity) => void; onSave: (item: Opportunity) => void }

function dateLabel(item: Opportunity) {
  const value = item.deadline ?? item.eventDate
  if (!value) return item.recurring ?? '日期未注明'
  const date = new Date(value)
  return `${date.getMonth() + 1}月${date.getDate()}日${item.deadline ? '截止' : ''}`
}

export function OpportunityCard({ item, plan, onOpen, onSave }: Props) {
  return <article className="opportunity-card">
    <button className={`save-button ${plan ? 'saved' : ''}`} onClick={() => onSave(item)} aria-label={plan ? '取消收藏' : '收藏'}><Bookmark size={17} fill={plan ? 'currentColor' : 'none'} /></button>
    <div className="card-top"><span className={`type-badge type-${item.type}`}>{item.type}</span><span className="index">NO.{item.id}</span></div>
    <h3>{item.title}</h3><p>{item.original}</p><div className="tags">{item.tags.slice(0, 3).map(tag => <span key={tag}>#{tag}</span>)}</div>
    <div className="card-footer"><span><CalendarClock size={14} /> {dateLabel(item)}</span><button onClick={() => onOpen(item)}>查看详情 <ArrowUpRight size={15} /></button></div>
  </article>
}
