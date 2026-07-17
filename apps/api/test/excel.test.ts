import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { ExcelService } from '../src/excel.service';
import { catalog, demoProject } from '../src/seed';
import { RulesService } from '../src/rules.service';

describe('Excel交付', () => {
  it('生成九个工作表并保留自动汇总公式', async () => {
    const project = { ...demoProject, status: 'published' as const, recommendations: new RulesService().match(demoProject, catalog) };
    const data = await new ExcelService().generate(project);
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(data as unknown as ExcelJS.Buffer);
    expect(wb.worksheets).toHaveLength(9);
    expect(wb.worksheets.map(x => x.name)).toEqual(['1 项目概况','2 能力与投资测算','3 开馆总预算','4 设备正式报价','5 项目与产品包','6 装修文字建议','7 证照准备','8 招聘与人员','9 第二阶段推广']);
    expect(wb.getWorksheet('3 开馆总预算')?.getCell('B6').value).toEqual({ formula: 'SUM(B2:B5)' });
  });
});
