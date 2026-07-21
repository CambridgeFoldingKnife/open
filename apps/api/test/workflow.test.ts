import { describe, expect, it } from 'vitest';
import { RulesService } from '../src/rules.service';
import { StoreService } from '../src/store.service';
import { demoUser, demoStaff } from '../src/seed';

function makeStore() {
  const store = new StoreService(new RulesService(), undefined as any);
  (store as any).pool = { query: async () => ({ rowCount: 0, rows: [] }) };
  store.users.push({ ...demoUser });
  store.staff.push(...demoStaff.map(s => ({ ...s })));
  return store;
}

const customerInput = {
  customerName: demoUser.name, phone: demoUser.phone, city: demoUser.city, area: 100, budget: 500000,
  audiences: ['跑者'], plannedServices: ['运动损伤'], openingDate: '2026-12-01', teamFoundation: '主理人1名',
  readiness: { capital: 80, resources: 60, involvement: 80, returnExpectation: 70, riskTolerance: 60 },
  venue: { address: '上海', area: 100, rentMonthly: 16000, ceilingHeight: 3.2, beds: 2 }
};

describe('开馆方案流程', () => {
  it('客户创建项目后，顾问跟进并标记完成', () => {
    const store = makeStore();
    const customer = { id: demoUser.id, role: 'customer' as const };
    const draft = store.saveDraft(customer, customerInput);
    expect(draft.status).toBe('pending');
    expect(draft.recommendations.length).toBeGreaterThan(0);

    const lead = store.leads.find(l => l.projectId === draft.id);
    expect(lead).toBeDefined();
    store.assignLead(lead!.id, { id: 'staff-admin', role: 'admin' }, 'staff-consultant');

    expect(store.transition(draft.id, { id: 'staff-consultant', role: 'consultant' }, 'processing').status).toBe('processing');
    expect(store.updatePlan(draft.id, { id: 'staff-consultant', role: 'consultant' }, { interviewNotes: '已完成访谈' }).status).toBe('processing');

    const completed = store.transition(draft.id, { id: 'staff-consultant', role: 'consultant' }, 'completed');
    expect(completed.status).toBe('completed');
    expect(lead!.status).toBe('won');
  });

  it('顾问不能完成不是自己的项目', () => {
    const store = makeStore();
    const customer = { id: demoUser.id, role: 'customer' as const };
    const draft = store.saveDraft(customer, customerInput);
    const lead = store.leads.find(l => l.projectId === draft.id);
    store.assignLead(lead!.id, { id: 'staff-admin', role: 'admin' }, 'staff-consultant');
    store.transition(draft.id, { id: 'staff-consultant', role: 'consultant' }, 'processing');
    expect(() => store.transition(draft.id, { id: 'staff-other', role: 'consultant' }, 'completed')).toThrow();
  });
});
