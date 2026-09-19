export type TeammateDirection = 'AI应用' | '前端开发' | '算法竞赛' | '产品设计' | '数据分析'
export type TeammateSkill = '开发' | '设计' | '产品' | '文案' | '演讲'

export interface TeammateProfile {
  id: string
  nickname: string
  grade: string
  major: string
  direction: TeammateDirection[]
  skills: TeammateSkill[]
  wantedSkills: TeammateSkill[]
  weeklyHours: number
  style: '规划清晰' | '边做边迭代' | '冲刺型'
  goal: string
  intro: string
  availability: string
}

// 所有人物均为产品演示所需的虚构数据，不代表真实学生。
export const mockTeammates: TeammateProfile[] = [
  { id: 'tm01', nickname: '林小满', grade: '大一', major: '软件工程', direction: ['AI应用', '前端开发'], skills: ['开发'], wantedSkills: ['设计', '产品'], weeklyHours: 6, style: '边做边迭代', goal: 'AI创新应用挑战赛', intro: '会 Python 和一点 React，想做一个真正能演示的小产品。', availability: '周二、周四晚上及周末' },
  { id: 'tm02', nickname: '陈屿', grade: '大一', major: '数字媒体技术', direction: ['产品设计', '前端开发'], skills: ['设计', '文案'], wantedSkills: ['开发'], weeklyHours: 5, style: '规划清晰', goal: 'AI应用创意挑战', intro: '擅长界面与视觉表达，希望和开发同学把想法落地。', availability: '工作日晚上' },
  { id: 'tm03', nickname: '周行', grade: '大二', major: '计算机科学与技术', direction: ['算法竞赛', 'AI应用'], skills: ['开发', '演讲'], wantedSkills: ['产品', '设计'], weeklyHours: 8, style: '冲刺型', goal: 'AI创新应用挑战赛', intro: '有算法和后端基础，比赛前可以集中投入，喜欢目标明确的团队。', availability: '周三晚上及周末' },
  { id: 'tm04', nickname: '许知遥', grade: '大一', major: '电子商务', direction: ['产品设计', '数据分析'], skills: ['产品', '文案', '演讲'], wantedSkills: ['开发'], weeklyHours: 4, style: '规划清晰', goal: '大学生创新创业项目', intro: '擅长需求梳理、展示和文案，想寻找技术搭档完成作品。', availability: '周一、周五晚上' },
  { id: 'tm05', nickname: '顾辰', grade: '大一', major: '数据科学与大数据技术', direction: ['数据分析', 'AI应用'], skills: ['开发'], wantedSkills: ['产品', '演讲'], weeklyHours: 4, style: '边做边迭代', goal: 'AI应用创意挑战', intro: '会数据处理和模型调用，愿意从小功能开始快速验证。', availability: '周末为主' },
  { id: 'tm06', nickname: '宋禾', grade: '大二', major: '视觉传达设计', direction: ['产品设计', 'AI应用'], skills: ['设计', '演讲'], wantedSkills: ['开发', '产品'], weeklyHours: 6, style: '冲刺型', goal: 'AI创新应用挑战赛', intro: '负责过海报和路演，希望参与有完整用户体验的 AI 项目。', availability: '周四至周日' },
]
