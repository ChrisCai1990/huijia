export const STAGES = [
  {
    id: 1,
    name: '服务启动',
    tasks: [
      { id: '1_1', text: '发送欢迎信息及服务介绍' },
      { id: '1_2', text: '签署服务协议', docRef: '01-健康档案' },
      { id: '1_3', text: '建立客户健康档案', docRef: '01-健康档案' },
      { id: '1_4', text: '完成基础问卷填写' },
      { id: '1_5', text: '介绍服务流程与时间节点' },
      { id: '1_6', text: '拉入专属服务群' },
      { id: '1_7', text: '安排采样邮寄说明' },
      { id: '1_8', text: '确认负责人分工' }
    ]
  },
  {
    id: 2,
    name: '采样与调研',
    tasks: [
      { id: '2_1', text: '发送采样包及说明材料' },
      { id: '2_2', text: '指导客户完成采样操作' },
      { id: '2_3', text: '跟踪样本寄回情况' },
      { id: '2_4', text: '深度健康问卷调研' },
      { id: '2_5', text: '收集既往检查报告' },
      { id: '2_6', text: '确认样本已到达实验室' }
    ]
  },
  {
    id: 3,
    name: '等待报告',
    tasks: [
      { id: '3_1', text: '通知客户等待周期（约14-21天）' },
      { id: '3_2', text: '每周发送一次关怀问候' },
      { id: '3_3', text: '报告到达后立即通知客户' }
    ]
  },
  {
    id: 4,
    name: '报告解读',
    tasks: [
      { id: '4_1', text: '整理分析检测报告', docRef: '02-基础检测报告解读' },
      { id: '4_2', text: '完成报告解读文档', docRef: '02-基础检测报告解读' },
      { id: '4_3', text: '与客户安排视频解读会议' },
      { id: '4_4', text: '解答客户疑问' },
      { id: '4_5', text: '更新健康档案关键数据', docRef: '01-健康档案' },
      { id: '4_6', text: '确认干预方向与目标' }
    ]
  },
  {
    id: 5,
    name: '方案交付',
    tasks: [
      { id: '5_1', text: '制定个性化干预方案', docRef: '03-个性化干预方案' },
      { id: '5_2', text: '完成饮食调理计划', docRef: '04-饮食调理计划' },
      { id: '5_3', text: '完成营养素补充方案', docRef: '05-营养素补充方案' },
      { id: '5_4', text: '完成生活方式建议', docRef: '06-生活方式建议' },
      { id: '5_5', text: '与客户视频讲解方案细节' },
      { id: '5_6', text: '客户确认并签收方案' }
    ]
  },
  {
    id: 6,
    name: '落地执行',
    tasks: [
      { id: '6_1', text: '协助客户制定执行计划', docRef: '07-运动康复计划' },
      { id: '6_2', text: '营养素采购指导' },
      { id: '6_3', text: '首次执行情况跟进（第3天）' },
      { id: '6_4', text: '两周执行情况复盘' },
      { id: '6_5', text: '根据反馈调整执行方案' }
    ]
  },
  {
    id: 7,
    name: '持续跟进',
    tasks: [
      { id: '7_1', text: '每月定期跟进回访' },
      { id: '7_2', text: '记录症状变化及改善情况' },
      { id: '7_3', text: '根据反馈动态调整方案' },
      { id: '7_4', text: '提醒3个月复查安排', docRef: '09-3个月复查报告' },
      { id: '7_5', text: '更新压力管理方案（如需）', docRef: '08-压力管理方案' }
    ]
  },
  {
    id: 8,
    name: '阶段复查',
    tasks: [
      { id: '8_1', text: '安排3个月/6个月复查检测' },
      { id: '8_2', text: '解读复查报告', docRef: '09-3个月复查报告' },
      { id: '8_3', text: '完成阶段性总结', docRef: '11-阶段性总结与调整' },
      { id: '8_4', text: '对比干预前后数据变化' },
      { id: '8_5', text: '调整下阶段方案' },
      { id: '8_6', text: '确认是否续约或进入维护期' }
    ]
  }
];

export function getStageById(id) {
  return STAGES.find(s => s.id === id) || STAGES[0];
}

export function getStageProgress(completedTasks, stageId) {
  const stage = getStageById(stageId);
  if (!stage || stage.tasks.length === 0) return 0;
  const completed = Array.isArray(completedTasks) ? completedTasks : [];
  const stageTasks = stage.tasks.map(t => t.id);
  const doneCount = stageTasks.filter(tid => completed.includes(tid)).length;
  return Math.round((doneCount / stage.tasks.length) * 100);
}
