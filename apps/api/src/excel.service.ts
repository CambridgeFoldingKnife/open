import{Injectable}from'@nestjs/common';import PDFDocument from'pdfkit';import type{OpeningProject}from'@opening/shared';import{prototypeMeta,quadrantMeta}from'@opening/shared';

@Injectable()export class ExcelService{
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
   const lineY=doc.y;doc.moveTo(40,lineY).lineTo(555,lineY).stroke('#ccc');doc.moveDown();
   doc.fontSize(11).text('一、项目概况',{underline:true}).moveDown(0.3);
   const rows=[['城市',p.city],['类型',qm.name],['原型',pm[p.prototype.primary].name],['面积',`${p.area}㎡`],['预算',`${p.budget}元`],['开馆日期',p.openingDate||'待定'],['目标客群',p.audiences.join('、')]];
   rows.forEach(r=>doc.fontSize(10).text(`${r[0]}: ${r[1]}`,{indent:20}));
   doc.moveDown();
   doc.fontSize(11).text('二、能力与投资测算',{underline:true}).moveDown(0.3);
   [['康复专业',String(p.capabilityResult.technicalScore)],['商业经营',String(p.capabilityResult.commercialScore)],['投资准备度',String(p.readinessScore)]].forEach(r=>doc.fontSize(10).text(`${r[0]}: ${r[1]}分`,{indent:20}));
   doc.moveDown();
   doc.fontSize(11).text('三、设备报价',{underline:true}).moveDown(0.3);
   const eqs=p.recommendations.filter(r=>r.kind==='equipment');
   eqs.forEach(r=>doc.fontSize(10).text(`• ${r.name}  ${r.quantity}台  ${r.unitPrice?`单价${r.unitPrice}元`:'待询价'}`,{indent:20}));
   doc.moveDown();
   doc.fontSize(11).text('四、项目与产品包',{underline:true}).moveDown(0.3);
   p.recommendations.filter(r=>r.kind==='service').forEach(r=>doc.fontSize(10).text(`• ${r.name}: ${r.reason}`,{indent:20}));
   doc.moveDown();
   doc.fontSize(11).text('五、装修建议',{underline:true}).moveDown(0.3);
   doc.fontSize(10).text(`定位: ${p.renovation.positioning}`,{indent:20});
   p.renovation.essentials.forEach(e=>doc.fontSize(10).text(`• 必做: ${e}`,{indent:20}));
   p.renovation.recommended.forEach(e=>doc.fontSize(10).text(`• 建议: ${e}`,{indent:20}));
   doc.moveDown();
   doc.fontSize(8).fillColor('#999').text('由开馆助手自动生成，仅供参考 | 具体报价以销售确认为准',{align:'center'});
   doc.end();
  });
 }
}
