import { describe, expect, it } from 'vitest';
import { ExcelService } from '../src/excel.service';
import { catalog, demoProject } from '../src/seed';
import { RulesService } from '../src/rules.service';

describe('PDF交付', () => {
  it('生成PDF文件并返回Buffer', async () => {
    const project = { ...demoProject, status: 'processing' as const, recommendations: new RulesService().match(demoProject, catalog) };
    const data = await new ExcelService().generatePdf(project);
    expect(data).toBeInstanceOf(Buffer);
    expect(data.length).toBeGreaterThan(0);
    // PDF文件头标识
    expect(data.slice(0, 4).toString()).toBe('%PDF');
  });
});
