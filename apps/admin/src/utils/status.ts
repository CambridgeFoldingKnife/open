import { statusLabels, type ProjectStatus } from '@opening/shared';

export const statusColor: Record<string, string> = {
  pending: 'blue',
  processing: 'orange',
  completed: 'green',
  // 旧状态兼容（数据迁移完成前可能残留）
  draft: 'blue',
  submitted: 'blue',
  assigned: 'orange',
  planning: 'orange',
  published: 'orange',
  foundation_confirmed: 'green',
  growth_active: 'green',
};

export const projectStatusLabels: Record<string, string> = {
  ...statusLabels,
  draft: '待处理',
  submitted: '待处理',
  assigned: '处理中',
  planning: '处理中',
  published: '处理中',
  foundation_confirmed: '已完成',
  growth_active: '已完成',
};

export const getProjectStatusTag = (p: { status: ProjectStatus; deletedAt?: string }) => {
  if (p.deletedAt) return { color: 'red', text: '用户已删除' };
  return {
    color: statusColor[p.status] || 'default',
    text: projectStatusLabels[p.status] || p.status,
  };
};
