import fs from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourceRoot=path.resolve(root,'../..','报价单案例');
const sources=['Theratools报价单6.16.xlsx','案例表(1).xlsx','动衡.xlsx'];
const lines=['# 历史报价与预算组合知识库','',`生成时间：${new Date().toISOString()}`,'','> 本文件用于组合逻辑与历史差异参考，不代表当前有效标准价。',''];

for(const file of sources){
  const wb=new ExcelJS.Workbook();await wb.xlsx.readFile(path.join(sourceRoot,file));
  lines.push(`## ${file}`,'');
  for(const ws of wb.worksheets){
    const rows=[];
    ws.eachRow({includeEmpty:false},row=>{
      const vals=row.values.slice(1).map(v=>typeof v==='object'&&v&&'result'in v?v.result:v);
      if(vals.some(v=>v!==null&&v!==undefined&&String(v).trim()))rows.push(vals);
    });
    if(!rows.length)continue;
    lines.push(`### ${ws.name}`,'',`- 使用区域：${ws.dimensions||'未知'}`,'');
    const compact=rows.filter(r=>r.some(v=>typeof v==='number')||r.some(v=>/产品名称|康复小工具|合计|金额总计/.test(String(v||''))));
    lines.push('| 行内容 |','|---|',...compact.map(r=>`| ${r.filter(v=>v!==null&&v!==undefined&&String(v)!=='').map(v=>String(v).replace(/\|/g,'/').replace(/\n/g,' ')).join(' ｜ ')} |`),'');
  }
}
const out=path.join(root,'knowledge/pricing/quote-cases.md');await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,lines.join('\n'),'utf8');console.log(`wrote ${out}`);
