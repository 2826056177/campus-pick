import type { Opportunity } from '../types'

export const opportunities: Opportunity[] = [
  { id: '01', title: '“蓝桥杯”程序设计校内训练营', original: '9月28日报名截止；每周六训练；面向全校学生；零基础可参加', type: '学习', tags: ['编程', '零基础', '大一友好'], deadline: '2026-09-28', recurring: '每周六训练', audience: ['全校学生', '零基础'], format: '未说明', team: '未说明', similarTo: '09' },
  { id: '02', title: 'AI应用入门公开课', original: '9月25日19:00；面向全校学生；无需报名', type: '讲座', tags: ['AI', '零门槛', '无需报名'], eventDate: '2026-09-25T19:00:00+08:00', audience: ['全校学生'], format: '未说明', commitment: '单次活动', team: '个人' },
  { id: '03', title: '大学生创新创业项目团队招募', original: '招募开发、设计、文案成员；每周需稳定投入4小时；9月27日截止', type: '招募', tags: ['创新创业', '项目实践', '多角色'], deadline: '2026-09-27', audience: ['开发', '设计', '文案'], format: '未说明', commitment: '每周稳定投入4小时', team: '组队' },
  { id: '04', title: '数学建模竞赛经验分享会', original: '9月22日19:30；线上举行；不限专业', type: '讲座', tags: ['数学建模', '线上', '不限专业'], eventDate: '2026-09-22T19:30:00+08:00', audience: ['不限专业'], format: '线上', commitment: '单次活动', team: '个人' },
  { id: '05', title: '校园公益志愿服务活动', original: '10月3日开展；9月29日报名截止；预计服务8小时', type: '志愿', tags: ['公益', '志愿服务'], deadline: '2026-09-29', eventDate: '2026-10-03', audience: ['未说明'], format: '未说明', commitment: '预计服务8小时', team: '未说明' },
  { id: '06', title: 'Web开发零基础学习小组', original: '每周三晚上；共6周；面向零基础学生；限30人', type: '学习', tags: ['Web', '零基础', '限额'], recurring: '每周三晚上，共6周', audience: ['零基础学生'], format: '未说明', commitment: '持续6周', team: '组队' },
  { id: '07', title: 'AI创新应用挑战赛', original: '允许使用大模型开发作品；2—4人组队；10月20日截止', type: '比赛', tags: ['AI', '大模型', '团队赛'], deadline: '2026-10-20', audience: ['未说明'], format: '未说明', commitment: '需完成参赛作品', team: '组队' },
  { id: '08', title: '校园软件项目组招募', original: '开发校园实用工具；希望成员了解Git；招募开发及产品方向成员', type: '招募', tags: ['软件开发', 'Git', '产品'], audience: ['开发方向', '产品方向'], format: '未说明', commitment: '未说明', team: '组队' },
  { id: '09', title: '“蓝桥杯”训练营招募通知', original: '9月28日截止；每周六训练；欢迎零基础学生参加', type: '学习', tags: ['编程', '零基础', '大一友好'], deadline: '2026-09-28', recurring: '每周六训练', audience: ['零基础学生'], format: '未说明', team: '未说明', similarTo: '01' },
  { id: '10', title: '前端开发经验交流会', original: '9月20日19:00；无需报名', type: '讲座', tags: ['前端', '无需报名'], eventDate: '2026-09-20T19:00:00+08:00', audience: ['未说明'], format: '未说明', commitment: '单次活动', team: '个人' },
  { id: '11', title: '大学生科研入门分享会', original: '9月26日举行；介绍论文检索、学生科研项目等内容', type: '科研', tags: ['科研入门', '论文检索'], eventDate: '2026-09-26', audience: ['未说明'], format: '未说明', commitment: '单次活动', team: '个人' },
  { id: '12', title: '全国高校计算机能力挑战赛', original: '面向本科生；10月5日报名截止；个人参赛', type: '比赛', tags: ['计算机', '个人赛'], deadline: '2026-10-05', audience: ['本科生'], format: '未说明', team: '个人' },
  { id: '13', title: '科研助理招募', original: '协助数据整理和实验工作；仅限大二及以上学生', type: '科研', tags: ['科研实践', '数据整理', '年级限制'], audience: ['大二及以上学生'], format: '未说明', commitment: '未说明', team: '未说明' },
  { id: '14', title: 'Git与GitHub零基础工作坊', original: '9月26日下午；主要面向大一新生；限40人', type: '学习', tags: ['Git', 'GitHub', '大一友好', '限额'], eventDate: '2026-09-26T14:00:00+08:00', audience: ['大一新生'], format: '未说明', commitment: '单次活动', team: '个人' },
  { id: '15', title: 'AI应用创意挑战', original: '9月30日提交作品；允许个人或团队参加', type: '比赛', tags: ['AI', '创意', '个人或团队'], deadline: '2026-09-30', audience: ['未说明'], format: '未说明', commitment: '需提交作品', team: '均可' },
  { id: '16', title: '校园摄影志愿者招募', original: '长期招募；具体报名截止时间未注明', type: '志愿', tags: ['摄影', '长期招募'], audience: ['未说明'], format: '未说明', commitment: '长期', team: '未说明' },
  { id: '17', title: 'Python程序设计学习资料合集', original: '包含课程、练习和项目案例；长期开放', type: '学习', tags: ['Python', '自主学习', '长期开放'], audience: ['未说明'], format: '线上', commitment: '自主安排', team: '个人' },
  { id: '18', title: '网络安全兴趣交流小组', original: '面向CTF、Web安全等方向感兴趣的学生；每两周交流一次', type: '学习', tags: ['网络安全', 'CTF', 'Web安全'], recurring: '每两周交流一次', audience: ['对网络安全感兴趣的学生'], format: '未说明', commitment: '每两周一次', team: '组队' },
]
