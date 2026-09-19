import type { Opportunity, OpportunityType, UserPreferences } from '../types'

const interestWords: Record<OpportunityType, string[]> = {
  比赛: ['比赛', '竞赛', '挑战', '获奖'],
  讲座: ['讲座', '分享', '公开课', '交流会'],
  学习: ['学习', '入门', '零基础', '编程', '前端', 'python', '安全', 'git'],
  招募: ['招募', '项目', '实践', '开发'],
  科研: ['科研', '论文', '实验'],
  志愿: ['志愿', '公益', '摄影'],
  活动: ['活动', '交流', '约球', '语言角', '观摩'],
}

export function recommendFromText(query: string, items: Opportunity[]) {
  const normalized = query.toLowerCase()
  return items.map(item => {
    let score = 0
    const reasons: string[] = []
    const searchable = `${item.title} ${item.original} ${item.tags.join(' ')}`.toLowerCase()
    for (const [type, words] of Object.entries(interestWords)) {
      if (words.some(word => normalized.includes(word)) && (item.type === type || words.some(word => searchable.includes(word)))) { score += 4; reasons.push(`与你提到的“${type}”方向相关`) }
    }
    if (/零基础|新手|大一|不会/.test(normalized) && /零基础|大一|入门/.test(searchable)) { score += 5; reasons.push('对新生或零基础更友好') }
    if (/个人|一个人|不组队/.test(normalized) && item.team === '个人') { score += 3; reasons.push('可以个人参与') }
    if (/组队|团队|同学/.test(normalized) && (item.team === '组队' || item.team === '均可')) { score += 3; reasons.push('支持团队参与') }
    if (/时间少|忙|短期|试试/.test(normalized) && item.commitment === '单次活动') { score += 3; reasons.push('单次活动，时间压力较小') }
    if (/ai|人工智能|大模型/.test(normalized) && /AI|大模型/.test(searchable)) { score += 6; reasons.push('与你的 AI 兴趣直接匹配') }
    if (/web|网页|前端/.test(normalized) && /Web|前端/.test(searchable)) { score += 6; reasons.push('与你的 Web 开发方向匹配') }
    if (item.risk === 'high') score -= 100
    return { item, score, reasons }
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score).slice(0, 3)
}

export function scoreWithPreferences(item: Opportunity, preferences: UserPreferences) {
  if (item.risk === 'high') return -100
  let score = preferences.interests.includes(item.type) ? 4 : 0
  if (preferences.beginner && item.tags.some(tag => /零基础|大一友好/.test(tag))) score += 3
  if (preferences.preferShortTerm && item.commitment === '单次活动') score += 2
  if (!preferences.canTeam && item.team === '个人') score += 2
  if (preferences.canTeam && (item.team === '组队' || item.team === '均可')) score += 1
  return score
}
