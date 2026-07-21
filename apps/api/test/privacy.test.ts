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

describe('客户隐私', () => {
  it('客户可看自己的测算报价但看不到顾问内部访谈', () => {
    const store = makeStore();
    const customer = { id: demoUser.id, role: 'customer' as const };
    const draft = store.saveDraft(customer, {
      customerName: demoUser.name, phone: demoUser.phone, city: demoUser.city, area: 180, budget: 800000,
      audiences: ['跑者', '久坐白领'], plannedServices: ['运动损伤', '体态矫正'], openingDate: '2026-10-01', teamFoundation: '已有1名主理人',
      readiness: { capital: 82, resources: 70, involvement: 88, returnExpectation: 64, riskTolerance: 76 },
      venue: { address: '杭州市滨江区', area: 180, rentMonthly: 26000, ceilingHeight: 3.4, beds: 3 }
    });
    const lead = store.leads.find(l => l.projectId === draft.id);
    store.assignLead(lead!.id, { id: 'staff-admin', role: 'admin' }, 'staff-consultant');
    store.transition(draft.id, { id: 'staff-consultant', role: 'consultant' }, 'processing');
    store.updatePlan(draft.id, { id: 'staff-consultant', role: 'consultant' }, { interviewNotes: '客户重视专业口碑' });

    const p = store.get(draft.id, customer);
    expect(p.recommendations.length).toBeGreaterThan(0);
    expect(p.interviewNotes).toBeUndefined();
  });

  it('客户不能访问其他账号项目', () => {
    const store = makeStore();
    const customer = { id: demoUser.id, role: 'customer' as const };
    const draft = store.saveDraft(customer, {
      customerName: demoUser.name, phone: demoUser.phone, city: demoUser.city, area: 100, budget: 500000,
      audiences: ['跑者'], plannedServices: ['运动损伤'], openingDate: '2026-12-01', teamFoundation: '主理人1名',
      readiness: { capital: 80, resources: 60, involvement: 80, returnExpectation: 70, riskTolerance: 60 },
      venue: { address: '上海', area: 100, rentMonthly: 16000, ceilingHeight: 3.2, beds: 2 }
    });
    expect(() => store.get(draft.id, { id: 'other-user', role: 'customer' })).toThrow();
  });
});
