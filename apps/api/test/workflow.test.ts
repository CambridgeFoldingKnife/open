import { describe, expect, it } from 'vitest';
import { RulesService } from '../src/rules.service';
import { StoreService } from '../src/store.service';

describe('开馆方案审核流程', () => {
  it('客户提交、管理员分配、顾问编制、审核和发布', () => {
    const store = new StoreService(new RulesService());
    store.sendCode('13900000000');const account=store.register({phone:'13900000000',code:'246810',email:'test@example.com',name:'测试客户',city:'上海',identity:'investor',preferredContact:'phone',contactWindow:'工作日',marketingConsent:true});
    const customer = { id: account.id, role: 'customer' as const };
    const draft = store.saveDraft(customer, {
      customerName: '测试客户', phone: '13900000000', city: '上海', area: 100, budget: 500000,
      audiences: ['跑者'], plannedServices: ['运动损伤'], openingDate: '2026-12-01', teamFoundation: '主理人1名',
      readiness: { capital: 80, resources: 60, involvement: 80, returnExpectation: 70, riskTolerance: 60 },venue:{address:'上海',area:100,rentMonthly:16000,ceilingHeight:3.2,beds:2}
    });
    expect(draft.readinessScore).toBe(70);
    const submitted=store.transition(draft.id, customer, 'submitted');expect(submitted.recommendations.length).toBeGreaterThan(0);
    const beforeAverage=submitted.breakEven!.averageOrderValue;const changed=store.updateServices(draft.id,customer,submitted.servicePortfolio!.map((x,i)=>i===0?{...x,unitPrice:x.unitPrice+200}:x));expect(changed.version).toBe(2);expect(changed.breakEven!.averageOrderValue).not.toBe(beforeAverage);
    expect(store.assign(draft.id, { id: 'admin-1', role: 'admin' }, 'consultant-1').status).toBe('assigned');
    expect(store.updatePlan(draft.id, { id: 'consultant-1', role: 'consultant' }, { interviewNotes: '已完成访谈' }).status).toBe('planning');
    expect(store.transition(draft.id, { id: 'consultant-1', role: 'consultant' }, 'review').status).toBe('review');
    const published = store.transition(draft.id, { id: 'admin-1', role: 'admin' }, 'published');
    expect(published.status).toBe('published'); expect(published.version).toBe(3); expect(published.publishedAt).toBeTruthy();
  });

  it('顾问不能发布，其他顾问不能编辑已分配项目', () => {
    const store = new StoreService(new RulesService());
    expect(() => store.transition('project-demo', { id: 'consultant-1', role: 'consultant' }, 'published')).toThrow();
    store.projects[0].status = 'assigned';
    expect(() => store.updatePlan('project-demo', { id: 'consultant-2', role: 'consultant' }, {})).toThrow();
  });
});
