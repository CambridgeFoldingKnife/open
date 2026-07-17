import { describe, expect, it } from 'vitest';
import { RulesService } from '../src/rules.service';
import { StoreService } from '../src/store.service';
describe('客户隐私',()=>{it('客户可看自己的测算报价但看不到顾问内部访谈',()=>{const store=new StoreService(new RulesService());const p=store.get('project-demo',{id:'customer-1',role:'customer'});expect(p.recommendations.length).toBeGreaterThan(0);expect(p.interviewNotes).toBeUndefined();});it('客户不能访问其他账号项目',()=>{const store=new StoreService(new RulesService());expect(()=>store.get('project-demo',{id:'other-user',role:'customer'})).toThrow();});});
