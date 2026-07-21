import{Injectable}from'@nestjs/common';import ExcelJS from'exceljs';import PDFDocument from'pdfkit';import type{OpeningProject,Recommendation}from'@opening/shared';import{prototypeMeta,quadrantMeta,readinessBand}from'@opening/shared';
@Injectable()export class ExcelService{async generate(p:OpeningProject){const wb=new ExcelJS.Workbook();wb.creator='开馆助手';wb.created=new Date();const sheet=(name:string,headers:string[])=>{const ws=wb.addWorksheet(name,{views:[{state:'frozen',ySplit:1}]});ws.addRow(headers);ws.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF173630'}};ws.columns=headers.map((h,i)=>({header:h,key:String(i),width:i===0?24:32}));return ws};
 const overview=sheet('1 项目概况',['项目','内容']);[['客户',p.customerName],['城市',p.city],['一级类型',quadrantMeta[p.quadrant].name],['白皮书原型',quadrantMeta[p.quadrant].original],['首选运营原型',prototypeMeta[p.prototype.primary].name],['备选运营原型',prototypeMeta[p.prototype.alternative].name],['面积',`${p.area}㎡`],['计划预算',p.budget],['开馆日期',p.openingDate],['目标客群',p.audiences.join('、')],['计划项目',p.plannedServices.join('、')]].forEach(x=>overview.addRow(x));
 const scores=sheet('2 能力与投资测算',['维度','得分','说明']);[['康复专业',p.capabilityResult.technicalScore,quadrantMeta[p.quadrant].tech],['商业经营',p.capabilityResult.commercialScore,quadrantMeta[p.quadrant].business],['投资准备度',p.readinessScore,readinessBand(p.readinessScore)],['资金能力',p.readiness.capital,''],['行业资源',p.readiness.resources,''],['参与程度',p.readiness.involvement,''],['回报预期',p.readiness.returnExpectation,''],['风险承受力',p.readiness.riskTolerance,'']].forEach(x=>scores.addRow(x));
 const budget=sheet('3 开馆总预算',['费用类别','金额','备注']);budget.addRow(['场地与装修','', '由用户或顾问填写']);budget.addRow(['标准版器械报价',{formula:"SUM('4 设备正式报价'!F2:F500)"},'仅汇总已审核价格']);budget.addRow(['人员启动成本','', '根据人员编制填写']);budget.addRow(['证照与专业服务','', '按当地要求核实']);budget.addRow(['合计',{formula:'SUM(B2:B5)'},'']);
 const quote=sheet('4 设备正式报价',['级别','产品','规格/变体','数量','单价','小计','价格状态','来源说明']);p.recommendations.filter(r=>r.kind==='equipment').forEach((r,i)=>quote.addRow([r.priority,r.name,r.note||r.variantId||'',r.quantity,r.unitPrice??'',r.unitPrice?{formula:`D${i+2}*E${i+2}`}:'',r.priceStatus==='approved'?'已审核':r.priceStatus==='conflict'?'价格冲突':'需要询价',r.reason]));
 const service=sheet('5 项目与产品包',['经营作用','项目','启动阶段','推荐理由']);p.recommendations.filter(r=>r.kind==='service').forEach((r,i)=>service.addRow([i===0?'引流/初评':'现金流/复购',r.name,i<2?'首期':'后续',r.reason]));
 const renovation=sheet('6 装修文字建议',['模块','建议','面积/优先级']);renovation.addRow(['定位',p.renovation.positioning,p.renovation.keywords.join('、')]);p.renovation.zoneRatios.forEach(z=>renovation.addRow(['功能分区',z.zone,`${z.percent}% / 约${z.area}㎡`]));p.renovation.essentials.forEach(x=>renovation.addRow(['必须完成',x,'必做']));p.renovation.recommended.forEach(x=>renovation.addRow(['建议配置',x,'建议']));p.renovation.deferred.forEach(x=>renovation.addRow(['可延期',x,'延期']));p.renovation.risks.forEach(x=>renovation.addRow(['风险提示',x,'需专业单位确认']));
 const licenses=sheet('7 证照准备',['事项','责任人','时间','材料','官方来源/核实渠道','状态']);p.licenses.forEach(x=>licenses.addRow([x.name,x.owner,x.timing,x.materials,x.source,x.status==='verify'?'需当地核实':x.status]));
 const staff=sheet('8 招聘与人员',['岗位','人数','到岗时间','职责','面试重点']);p.staffing.forEach(x=>staff.addRow([x.name,x.count,x.timing,x.responsibilities,x.interviewFocus]));
 const growth=sheet('9 第二阶段推广',['状态','推广任务','说明']);growth.addRow([['foundation_confirmed','growth_active'].includes(p.status)?'可解锁':'第一阶段未确认','商圈与竞品分析','继承首选门店定位']);this.by(p,'marketing').forEach(r=>growth.addRow(['待规划',r.name,r.reason]));
 wb.eachSheet(ws=>{ws.eachRow(row=>{row.alignment={vertical:'middle',wrapText:true};row.height=Math.max(row.height||15,22)});ws.getColumn(2).numFmt='#,##0.00';ws.autoFilter={from:'A1',to:ws.getRow(1).getCell(ws.columnCount).address};});return Buffer.from(await wb.xlsx.writeBuffer());}

// PDF 简洁导出
async generatePdf(p:OpeningProject):Promise<Buffer>{
 const qm=quadrantMeta[p.quadrant];const pm=prototypeMeta;
 const chunks:Buffer[]=[];
 return new Promise(async(resolve)=>{
  const doc=new PDFDocument({size:'A4',margins:{top:50,bottom:40,left:40,right:40},bufferPages:true});
  doc.on('data',(chunk:Buffer)=>chunks.push(chunk));
  doc.on('end',()=>resolve(Buffer.concat(chunks)));
  if(process.env.COMPANY_LOGO_URL){try{const r=await fetch(process.env.COMPANY_LOGO_URL);if(r.ok){const buf=Buffer.from(await r.arrayBuffer());doc.image(buf,40,20,{width:80});}else{doc.fontSize(16).text('开馆助手',40,30);}}catch{doc.fontSize(16).text('开馆助手',40,30);}}else{doc.fontSize(16).text('开馆助手',40,30);}
  doc.moveDown(4);
  doc.fontSize(14).text(`${p.customerName} - 开馆方案`,{align:'center'}).moveDown(0.5);
  doc.fontSize(10).fillColor('#666').text(`方案编号: ${p.id} | 版本: ${p.version} | 状态: ${p.status}`,{align:'center'}).moveDown();
  doc.fillColor('#000');
  // 分割线
  const lineY=doc.y;doc.moveTo(40,lineY).lineTo(555,lineY).stroke('#ccc');doc.moveDown();
  // 项目概况
  doc.fontSize(11).text('一、项目概况',{underline:true}).moveDown(0.3);
  const rows=[['城市',p.city],['类型',qm.name],['原型',pm[p.prototype.primary].name],['面积',`${p.area}㎡`],['预算',`${p.budget}元`],['开馆日期',p.openingDate||'待定'],['目标客群',p.audiences.join('、')]];
  rows.forEach(r=>doc.fontSize(10).text(`${r[0]}: ${r[1]}`,{indent:20}));
  doc.moveDown();
  // 能力与投资测算
  doc.fontSize(11).text('二、能力与投资测算',{underline:true}).moveDown(0.3);
  [['康复专业',String(p.capabilityResult.technicalScore)],['商业经营',String(p.capabilityResult.commercialScore)],['投资准备度',String(p.readinessScore)]].forEach(r=>doc.fontSize(10).text(`${r[0]}: ${r[1]}分`,{indent:20}));
  doc.moveDown();
  // 设备报价
  doc.fontSize(11).text('三、设备报价',{underline:true}).moveDown(0.3);
  const eqs=p.recommendations.filter(r=>r.kind==='equipment');
  eqs.forEach(r=>doc.fontSize(10).text(`• ${r.name}  ${r.quantity}台  ${r.unitPrice?`单价${r.unitPrice}元`:'待询价'}`,{indent:20}));
  doc.moveDown();
  // 项目与产品包
  doc.fontSize(11).text('四、项目与产品包',{underline:true}).moveDown(0.3);
  p.recommendations.filter(r=>r.kind==='service').forEach(r=>doc.fontSize(10).text(`• ${r.name}: ${r.reason}`,{indent:20}));
  doc.moveDown();
  // 装修建议
  doc.fontSize(11).text('五、装修建议',{underline:true}).moveDown(0.3);
  doc.fontSize(10).text(`定位: ${p.renovation.positioning}`,{indent:20});
  p.renovation.essentials.forEach(e=>doc.fontSize(10).text(`• 必做: ${e}`,{indent:20}));
  p.renovation.recommended.forEach(e=>doc.fontSize(10).text(`• 建议: ${e}`,{indent:20}));
  doc.moveDown();
  // 页脚
  doc.fontSize(8).fillColor('#999').text('由开馆助手自动生成，仅供参考 | 具体报价以销售确认为准',{align:'center'});
  doc.end();
 });
}

generateMd(p:OpeningProject):string{
 const qm=quadrantMeta[p.quadrant];const pm=prototypeMeta;
 const lines:string[]=[
  `# ${p.customerName} - 开馆方案`,
  `- 方案编号: ${p.id}`,
  `- 版本: ${p.version} | 状态: ${p.status}`,
  '',
  '## 一、项目概况',
  `| 项目 | 内容 |`,
  `|------|------|`,
  `| 城市 | ${p.city} |`,
  `| 类型 | ${qm.name} |`,
  `| 原型 | ${pm[p.prototype.primary].name} |`,
  `| 面积 | ${p.area}㎡ |`,
  `| 预算 | ${p.budget}元 |`,
  `| 开馆日期 | ${p.openingDate||'待定'} |`,
  `| 目标客群 | ${p.audiences.join('、')} |`,
  '',
  '## 二、能力与投资测算',
  `| 维度 | 得分 |`,
  `|------|------|`,
  `| 康复专业 | ${p.capabilityResult.technicalScore}分 |`,
  `| 商业经营 | ${p.capabilityResult.commercialScore}分 |`,
  `| 投资准备度 | ${p.readinessScore}分 |`,
  '',
  '## 三、设备报价',
  ...p.recommendations.filter(r=>r.kind==='equipment').map(r=>`- ${r.name} × ${r.quantity}台 ${r.unitPrice?`单价${r.unitPrice}元`:'待询价'}`),
  '',
  '## 四、项目与产品包',
  ...p.recommendations.filter(r=>r.kind==='service').map(r=>`- **${r.name}**: ${r.reason}`),
  '',
  '## 五、装修建议',
  `- 定位: ${p.renovation.positioning}`,
  ...p.renovation.essentials.map(e=>`- [必做] ${e}`),
  ...p.renovation.recommended.map(e=>`- [建议] ${e}`),
  '',
  '---',
  '*由开馆助手自动生成，仅供参考*',
 ];
 return lines.join('\n');
}

private by(p:OpeningProject,kind:Recommendation['kind']){return p.recommendations.filter(r=>r.kind===kind)}}
