export type OpportunityType = '比赛' | '讲座' | '学习' | '招募' | '科研' | '志愿' | '活动'

export type PlanStatus = 'saved' | 'planning' | 'done' | 'passed'

export interface Opportunity {
  id: string
  title: string
  original: string
  type: OpportunityType
  source: '校级活动' | '计算机学院' | '外国语学院' | '学生个人'
  status: string
  risk?: 'high'
  riskNote?: string
  tags: string[]
  deadline?: string
  eventDate?: string
  recurring?: string
  audience: string[]
  format?: '线上' | '线下' | '线上及线下' | '未说明'
  commitment?: string
  team?: '个人' | '组队' | '均可' | '未说明'
  relatedTo?: string
  relationNote?: string
}

export interface PlanEntry {
  status: PlanStatus
  note: string
  updatedAt: string
}

export interface UserPreferences {
  interests: OpportunityType[]
  beginner: boolean
  preferShortTerm: boolean
  canTeam: boolean
  weeklyHours: number
}
