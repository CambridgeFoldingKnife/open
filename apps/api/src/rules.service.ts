import { Injectable } from '@nestjs/common';
import { capabilityScore, prototypeMeta, quadrantMeta } from '@opening/shared';
import type { BreakEvenEstimate, CatalogItem, LicenseTask, OpeningProject, OpeningTask, OperatingPrototype, PrototypeRecommendation, Recommendation, RenovationRecommendation, ServiceOffering, StaffingRole } from '@opening/shared';

@Injectable()
export class RulesService {
  diagnose(project: OpeningProject, items: CatalogItem[]) {
    this.applyNarrativeAnswers(project);
    project.capabilityResult = capabilityScore(project.capability);
    project.quadrant = project.capabilityResult.quadrant;
    project.prototype = this.prototype(project);
    project.venueTypeId = `prototype-${project.prototype.primary}`;
    project.venueTypeName = `${quadrantMeta[project.quadrant].name} / ${prototypeMeta[project.prototype.primary].name}`;
    project.renovation = this.renovation(project);
    project.servicePortfolio = this.services(project,project.servicePortfolio);
    project.plannedServices=[...new Set(project.servicePortfolio.filter(x=>x.selected).flatMap(x=>x.equipmentTags))];
    project.recommendations = this.match(project, items);
    project.quoteSummaries = this.quoteSummaries(project.recommendations);
    project.licenses = this.licenses(project);
    project.staffing = this.staffing(project);
    project.breakEven = this.breakEven(project);
    project.openingTasks = this.openingTasks(project);
    return project;
  }

  private applyNarrativeAnswers(project:OpeningProject) {
    const capabilityKeys=Object.keys(project.capability) as (keyof typeof project.capability)[];
    for(const key of capabilityKeys)if(project.capabilityModes?.[key]==='other')project.capability[key]=this.narrativeScore(project.capabilityNotes?.[key]);
    const readinessKeys=Object.keys(project.readiness) as (keyof typeof project.readiness)[];
    for(const key of readinessKeys)if(project.readinessModes?.[key]==='other')project.readiness[key]=this.narrativeScore(project.readinessNotes?.[key]);
    project.readinessScore=Math.round(Object.values(project.readiness).reduce((sum,value)=>sum+value,0)/readinessKeys.length);
  }

  private narrativeScore(note='') {
    const text=note.trim();
    if(!text)return 50;
    const strong=['独立','稳定','成熟','多年','负责过','带教','团队','大量','持续','完整'];
    const early=['没有','刚开始','学习中','暂时','很少','不熟','不会','还没','偶尔'];
    const strongHits=strong.filter(x=>text.includes(x)).length,earlyHits=early.filter(x=>text.includes(x)).length;
    if(strongHits>earlyHits)return Math.min(85,65+strongHits*5);
    if(earlyHits>strongHits)return Math.max(25,45-earlyHits*5);
    return 50;
  }

  match(project: OpeningProject, items: CatalogItem[]): Recommendation[] {
    return items.filter(item => {
      if (!item.active || project.area < item.minArea || project.budget < item.minBudget) return false;
      if (item.maxArea && project.area > item.maxArea) return false;
      if (item.prototypeIds?.length && !item.prototypeIds.includes(project.prototype.primary)) return false;
      const serviceMatch = !item.serviceTags.length || item.serviceTags.some(x => project.plannedServices.includes(x));
      const audienceMatch = !item.audienceTags.length || item.audienceTags.some(x => project.audiences.includes(x));
      return serviceMatch && audienceMatch;
    }).map(item => ({
      id: `rec-${item.id}`, kind: item.kind, name: item.name, required: item.required,
      quantity: item.kind === 'role' ? Math.max(1, Math.ceil(project.area / 120)) : this.quantity(project, item),
      unitPrice: item.priceStatus === 'approved' ? item.approvedPrice : undefined,
      priceStatus: item.priceStatus || 'inquiry', variantId: item.variantId,
      priority: item.required ? 'essential' : item.budgetTier === 'premium' ? 'upgrade' : 'recommended',
      reason: this.reason(project, item), note: item.specification
    }));
  }

  private prototype(project: OpeningProject): PrototypeRecommendation {
    const { area, budget, capability, audiences } = project;
    const medicalEligible = project.capabilityResult.technicalScore >= 60 && capability.riskRecognition >= 65 && (audiences.includes('术后稳定期') || capability.customerResources >= 70);
    const commercialEligible = area >= 150 && budget >= 500000 && project.capabilityResult.commercialScore >= 55;
    let primary: OperatingPrototype = 'community';
    if (medicalEligible && area >= 120 && area <= 250) primary = 'medical';
    else if (commercialEligible) primary = 'commercial';
    // A secondary option may be aspirational, but it must never imply that a
    // currently ineligible high-risk model is ready to open.
    const alternative: OperatingPrototype = primary === 'community'
      ? (commercialEligible ? 'commercial' : medicalEligible ? 'medical' : 'commercial')
      : 'community';
    const reasons = {
      community:`${area}㎡场地与当前团队更适合从高频社区问题切入，控制固定成本并建立近距离复购。`,
      commercial:`${area}㎡面积与${Math.round(budget/10000)}万元预算可承载评估、训练和内容获客的标准化分区。`,
      medical: medicalEligible
        ? `专业得分${project.capabilityResult.technicalScore}分且具备风险识别/转介基础，可在边界清晰的前提下开展医健协同。`
        : `医健协同需先将专业能力与风险识别补至准入线，并建立可核验的转介合作资源。`
    };
    const rejectedReasons:string[]=[];
    if (!medicalEligible) rejectedReasons.push('医健协同店暂不作为首选：需补足专业能力、禁忌识别和正式转介资源。');
    if (!commercialEligible) rejectedReasons.push('商圈标准店暂不作为首选：建议面积达到150㎡、预算达到50万元并补足获客管理能力。');
    const alternativeReason = alternative === 'commercial' && !commercialEligible
      ? '可作为中长期升级方向：面积、预算与获客管理能力达到标准后，再升级为商圈标准店。'
      : reasons[alternative];
    return { primary, alternative, primaryReason: reasons[primary], alternativeReason, rejectedReasons };
  }

  private renovation(project: OpeningProject): RenovationRecommendation {
    const p = project.prototype.primary, q = project.quadrant, area = project.area || 100;
    const ratios:Record<OperatingPrototype,[string,number][]> = {
      community:[['接待咨询',12],['基础评估',14],['开放训练',36],['私密服务',23],['储物后勤',15]],
      commercial:[['品牌接待',15],['评估沟通',16],['开放训练',31],['私密服务',23],['更衣后勤',15]],
      medical:[['接待等候',10],['独立评估',20],['主动训练',25],['一对一服务',30],['资料后勤',15]]
    };
    const base = {
      community:{keywords:['亲和','明亮','耐用','低维护'],positioning:'用灵活可变空间完成评估—训练—复测闭环，避免豪装挤占流动资金。'},
      commercial:{keywords:['清晰','高效','品牌感','可拍摄'],positioning:'让前台、评估、服务、训练和会员沟通各有边界，同时支持高峰期多人交付。'},
      medical:{keywords:['专业','克制','可信','私密'],positioning:'强化独立评估、风险筛查和资料管理，避免使用容易误导为医疗机构的装饰与标识。'}
    }[p];
    const modifier:Record<typeof q,string>={starter:'坚持最小可用装修，多用可移动设备并预留升级位置。',growth:'增加品牌展示与固定拍摄背景，但前场营销空间不得挤压交付面积。',expert:'强化私密咨询、评估解释、模型教具与小型教学功能。',system:'统一工位、储物和动线，形成可复制到下一家门店的模块化标准。'};
    return {
      keywords:[...base.keywords,quadrantMeta[q].name], positioning:`${base.positioning}${modifier[q]}`,
      zoneRatios:ratios[p].map(([zone,percent])=>({zone,percent,area:Math.round(area*percent/100)})),
      circulation:['客户动线：接待 → 咨询评估 → 服务/训练 → 复测沟通 → 离店。','员工动线避开等候区，耗材、清洁与资料储存就近布置。','大件设备先定位置，再核对门宽、电源、承重和检修距离。'],
      essentials:['防滑耐磨地面与圆角防撞','评估和私密服务区的声学隐私','训练区均匀照明、通风与独立电路','消防疏散、无障碍及当地物业条件核验'],
      recommended:['使用可移动隔断保留调整弹性','入口设置清晰但克制的服务边界说明','设置带锁客户资料柜和耗材库位'],
      deferred:['非必要造型吊顶和高维护饰面','在客群与项目尚未验证前建设大面积固定直播间','无法直接带来交付效率的装饰性设备'],
      risks:['本建议不替代建筑、消防或施工图设计。','涉及承重墙、消防、上下水和大功率设备时必须由专业单位复核。','医健协同模式的标识与宣传不得造成医疗机构误认。']
    };
  }

  private licenses(project:OpeningProject):LicenseTask[]{return [
    {id:'license-business',name:'营业执照与经营范围',owner:'创始人/财务',timing:'D-60至D-45',materials:'主体身份证明、场地证明、公司章程及拟经营项目',source:'当地市场监督管理部门；经营范围需当地核实',status:'verify'},
    {id:'license-tax',name:'税务登记、银行账户与开票',owner:'财务',timing:'执照后10日内',materials:'营业执照、公章、法人及银行资料',source:'当地税务部门及开户银行',status:'todo'},
    {id:'license-fire',name:'消防、疏散与物业用途确认',owner:'创始人/设计方',timing:'装修施工前',materials:'原始图纸、面积、楼层、用途、装修方案和疏散条件',source:'当地消防救援机构、住建及物业；必须属地核实',status:'verify'},
    {id:'license-health-place',name:'公共场所卫生许可适用性核验',owner:'馆长',timing:'D-45前',materials:'经营项目、场地布局、通风消毒和卫生制度',source:'当地卫生健康主管部门；并非所有运动康复门店统一要求',status:'verify'},
    {id:'license-health-card',name:'员工健康证适用岗位清单',owner:'馆长/人事',timing:'员工到岗前',materials:'岗位接触范围、体检材料及人员名单',source:'当地卫生健康主管部门；仅对属地规定岗位办理',status:'verify'},
    {id:'license-professional',name:'技术人员学历、培训与专业能力档案',owner:'技术负责人',timing:'录用时',materials:'学历、职业资格/技能证书、培训证明、案例与继续教育记录',source:'发证机构及当地行业要求；不得把培训证包装为医疗执业资质',status:'verify'},
    {id:'license-medical-boundary',name:'医疗执业边界与项目合规核验',owner:'技术负责人/法务',timing:'项目上架前',materials:'服务名称、操作流程、宣传用语、转介流程',source:'当地卫生健康及市场监管部门；不得开展需医疗机构资质的诊疗项目',status:'verify'},
    {id:'license-employment',name:'劳动合同、社保与员工档案',owner:'馆长/人事',timing:'到岗前',materials:'劳动合同、身份证明、岗位说明书、考勤与资质材料',source:'当地人力资源和社会保障部门',status:'todo'},
    {id:'license-price',name:'价目表、会员合同与退费规则',owner:'馆长/财务',timing:'试营业前',materials:'服务项目、价格、次数、有效期、预约与退费条款',source:'当地市场监管部门及消费者权益保护规则',status:'verify'},
    {id:'license-ad',name:'广告宣传与平台违禁词审查',owner:'运营/技术负责人',timing:'所有内容发布前',materials:'门头、案例、短视频、团购页和疗效表达',source:'广告法、市场监管及各平台规则；医疗承诺须重点核验',status:'verify'}
  ];}

  private staffing(project:OpeningProject):StaffingRole[]{const n=Math.max(2,Math.ceil(project.area/80));const big=project.area>=150;return [
    {id:'staff-tech',name:'技术负责人',count:1,timing:'D-60前确认',recruitmentDay:-60,monthlySalary:12000,responsibilities:'对专业交付、风险边界和人员带教负最终责任',interviewFocus:'完整案例推演、禁忌识别、转介判断、带教与记录能力',duties:['建立初评、方案、复测和结案标准','审核复杂客户方案与高风险情况','每周病例会和技术质检','维护专业资质、培训和转介档案'],qualifications:['有可核验的专业学习与实操经历','能独立完成风险筛查并说明服务边界','具备带教和SOP沉淀能力'],weeklyOutputs:['1次病例讨论','抽查不少于10份服务记录','完成2个专业内容审核'],kpis:['方案记录完整率≥95%','高风险客户100%留痕','月度复测完成率≥85%']},
    {id:'staff-training',name:'训练负责人',count:1,timing:big?'D-45前到岗':'由技术负责人兼任',recruitmentDay:-45,monthlySalary:big?9000:0,canCombineWith:big?undefined:'技术负责人',responsibilities:'负责主动训练区、安全规范和训练计划质量',interviewFocus:'动作教学、训练进阶、现场安全和团课组织',duties:['建立训练动作库和进退阶标准','检查训练区安全与器械归位','组织小组训练和员工实操考核','跟进家庭训练任务完成情况'],weeklyOutputs:['更新1组训练模板','完成1次员工实操训练','拍摄/审核5条动作示范'],kpis:['训练安全事件为0','计划执行率≥90%','器械完好率≥98%']},
    {id:'staff-practitioner',name:'康复技师／训练师',count:n,timing:'D-45至D-30到岗',recruitmentDay:-45,monthlySalary:8000,responsibilities:'承担客户服务、复测、复购沟通与个人账号内容运营',interviewFocus:'沟通、动作观察、服务记录、镜头表达与客户跟进',duties:['按标准完成接待、评估、服务、训练和复测','每次服务后完成记录与家庭任务','负责本人客户的预约、满意度和续费沟通','运营公司分配的个人账号并参与门店宣传'],weeklyOutputs:['每人每周拍摄10条短视频','每周整理1个匿名案例素材','每周完成客户回访与复测清单'],kpis:['客户满意度≥90%','复测完成率≥85%','每周视频完成率100%','服务记录当天完成率≥95%']},
    {id:'staff-apprentice',name:'学徒／助理',count:big?1:0,timing:big?'D-30前到岗':'盈亏平衡后储备',recruitmentDay:-30,monthlySalary:big?4000:0,responsibilities:'协助场地、器械、客户准备和基础内容拍摄，不独立承接超能力项目',interviewFocus:'学习能力、服务意识、执行力和边界意识',duties:['准备服务区域与器械','协助客户引导和基础数据记录','完成内部学习与实操考核','协助技师拍摄、剪辑和素材整理'],weeklyOutputs:['完成学习清单','协助不少于10条视频素材','完成器械盘点'],kpis:['考核通过率','准备工作准时率≥95%','无越权独立服务']},
    {id:'staff-manager',name:'馆长／前台／运营',count:1,timing:'D-60至D-45到岗',recruitmentDay:-60,monthlySalary:7500,responsibilities:'小店多职角色，统筹前台、排班、成交、会员、行政和经营数据',interviewFocus:'现场管理、经营指标、客户异议、排班和多任务能力',duties:['负责接待、预约、收银、合同和客户档案','制定排班并跟踪到店率、成交率和复购','管理采购、库存、卫生、安全与员工考勤','组织内容排期、活动和异业合作','每日更新收入、线索和盈亏平衡看板'],weeklyOutputs:['1份经营周报','1次排班与线索复盘','完成所有到期客户回访'],kpis:['到店率、成交率和复购率','现金与合同差错为0','人效和固定成本控制','客户投诉闭环率100%']}
  ];}

  private services(project:OpeningProject,existing?:ServiceOffering[]):ServiceOffering[]{if(existing?.length)return existing.map(x=>({...x,variableCostRate:x.variableCostRate??this.defaultVariableRate(x.category)}));const p=project.prototype.primary;const base:Record<OperatingPrototype,ServiceOffering[]>={
    community:[{id:'svc-screen',name:'体态与功能初筛',category:'traffic',categoryLabel:'引流项目',description:'低门槛完成基础筛查、问题教育与首次转化',unitPrice:99,sessions:1,monthlyTarget:35,selected:true,equipmentTags:['体态矫正']},{id:'svc-pain',name:'常见疼痛功能改善包',category:'star',categoryLabel:'明星项目',description:'针对肩颈腰背等高频问题的评估、训练与复测',unitPrice:1680,sessions:6,monthlyTarget:12,selected:true,equipmentTags:['运动损伤','体态矫正']},{id:'svc-function',name:'12次功能训练计划',category:'cashflow',categoryLabel:'现金流项目',description:'形成稳定预收与阶段复测',unitPrice:2980,sessions:12,monthlyTarget:8,selected:true,equipmentTags:['体态矫正']},{id:'svc-maintain',name:'月度功能维护会员',category:'retention',categoryLabel:'复购维护',description:'每月训练、复测和家庭计划更新',unitPrice:699,sessions:4,monthlyTarget:20,selected:true,equipmentTags:['体态矫正']}],
    commercial:[{id:'svc-sport-screen',name:'运动功能评估',category:'traffic',categoryLabel:'引流项目',description:'跑者与球类人群的功能筛查',unitPrice:199,sessions:1,monthlyTarget:40,selected:true,equipmentTags:['运动损伤']},{id:'svc-sport-rehab',name:'运动损伤恢复计划',category:'star',categoryLabel:'明星项目',description:'评估、手法、训练和复测的组合交付',unitPrice:3680,sessions:10,monthlyTarget:14,selected:true,equipmentTags:['运动损伤']},{id:'svc-performance',name:'运动表现提升计划',category:'cashflow',categoryLabel:'现金流项目',description:'12次专项力量和动作训练',unitPrice:4280,sessions:12,monthlyTarget:10,selected:true,equipmentTags:['运动表现']},{id:'svc-club',name:'运动会员维护包',category:'retention',categoryLabel:'复购维护',description:'月度恢复、训练和赛前赛后支持',unitPrice:999,sessions:4,monthlyTarget:24,selected:true,equipmentTags:['运动损伤','运动表现']}],
    medical:[{id:'svc-risk-screen',name:'风险筛查与功能评估',category:'traffic',categoryLabel:'引流项目',description:'边界清晰的风险筛查、功能评估和转介建议',unitPrice:299,sessions:1,monthlyTarget:25,selected:true,equipmentTags:['术后稳定期']},{id:'svc-postop',name:'术后稳定期功能恢复计划',category:'star',categoryLabel:'明星项目',description:'在明确转介与禁忌边界下完成阶段训练',unitPrice:4980,sessions:12,monthlyTarget:10,selected:true,equipmentTags:['术后稳定期']},{id:'svc-chronic',name:'慢病稳定期运动计划',category:'cashflow',categoryLabel:'现金流项目',description:'评估、运动教育和12次主动训练',unitPrice:3980,sessions:12,monthlyTarget:10,selected:true,equipmentTags:['慢病稳定期']},{id:'svc-follow',name:'月度复测维护',category:'retention',categoryLabel:'复购维护',description:'月度复测、家庭任务与风险复核',unitPrice:899,sessions:4,monthlyTarget:18,selected:true,equipmentTags:['术后稳定期','慢病稳定期']}]
  };return base[p].map(x=>({...x,variableCostRate:this.defaultVariableRate(x.category)}));}

  private defaultVariableRate(category:ServiceOffering['category']){return({traffic:.30,star:.18,cashflow:.15,retention:.12,custom:.20})[category];}

  private breakEven(project:OpeningProject):BreakEvenEstimate{const staffCost=project.staffing.reduce((s,x)=>s+(x.monthlySalary||0)*x.count,0);const rentCost=project.venue.rentMode==='owned'?0:Math.max(0,project.venue.rentMonthly||0);const occupancyCost=project.venue.rentMode==='owned'?Math.max(0,Number((project.venue as any).imputedRentMonthly)||0):rentCost;const utilitiesCost=Math.round(project.area*12);const adminCost=3000;const standardQuote=project.quoteSummaries.find(x=>x.tier==='standard')?.total||0;const depreciationCost=Math.round(standardQuote/36+(project.area*800)/60);const monthlyFixedCost=staffCost+occupancyCost+utilitiesCost+adminCost+depreciationCost;const selected=(project.servicePortfolio||[]).filter(x=>x.selected);const plannedRevenue=selected.reduce((s,x)=>s+x.unitPrice*x.monthlyTarget,0)||1;const weightedVariableCostRate=Number((selected.reduce((s,x)=>s+x.unitPrice*x.monthlyTarget*(x.variableCostRate??this.defaultVariableRate(x.category)),0)/plannedRevenue).toFixed(3));const contributionMarginRate=Math.max(.35,1-weightedVariableCostRate);const breakEvenRevenue=Math.ceil(monthlyFixedCost/contributionMarginRate/100)*100;const safetyRevenue=Math.ceil((breakEvenRevenue/(1-.15))/100)*100;const scale=safetyRevenue/plannedRevenue;const projectTargets=selected.map(x=>{const packages=Math.max(1,Math.ceil(x.monthlyTarget*scale));return{serviceId:x.id,name:x.name,packages,sessions:packages*x.sessions,revenue:packages*x.unitPrice};});const monthlyOrders=projectTargets.reduce((s,x)=>s+x.packages,0);const requiredSessions=projectTargets.reduce((s,x)=>s+x.sessions,0);const practitionerCount=project.staffing.find(x=>x.id==='staff-practitioner')?.count||1;const trainingFte=(project.staffing.find(x=>x.id==='staff-training')?.monthlySalary||0)>0?1:0;const capacitySessions=Math.round((practitionerCount+1+trainingFte)*26*6*.7);return{staffCost,rentCost,occupancyCost,utilitiesCost,adminCost,depreciationCost,monthlyFixedCost,weightedVariableCostRate,contributionMarginRate:Number(contributionMarginRate.toFixed(3)),breakEvenRevenue,safetyRevenue,averageOrderValue:Math.round(plannedRevenue/(selected.reduce((s,x)=>s+x.monthlyTarget,0)||1)),monthlyOrders,dailyOrders:Number((requiredSessions/26).toFixed(1)),staffHeadcount:project.staffing.reduce((s,x)=>s+x.count,0),capacitySessions,requiredSessions,capacityUtilization:Number((requiredSessions/Math.max(1,capacitySessions)).toFixed(2)),cashReserve90Days:monthlyFixedCost*3,projectTargets,assumptions:['固定成本包含基础工资、场地占用成本、水电网络估算、软件行政和设备/基础装修月度折旧；不包含第二阶段推广预算。','变动成本率按项目组合加权，覆盖绩效提成、耗材、支付手续费、优惠与退款准备；自定义项目可调整。','安全营业额按15%安全边际计算，即目标营业额高于会计盈亏平衡点。','产能按每名可交付人员每月26天、每天6个可服务小时、70%有效利用率估算。','本结果用于经营规划，不构成收益承诺；签约和开业前应由财务按实际合同、薪酬和税务口径复核。']};}

  private openingTasks(project:OpeningProject):OpeningTask[]{return[
    {id:'task-position',stage:'定位',title:'确认门店模式、客群和盈亏平衡目标',owner:'创始人/顾问',startDay:-60,endDay:-55,status:'doing',deliverable:'定位确认单与月度目标'},
    {id:'task-site',stage:'场地',title:'完成场地、物业、消防和租赁条件复核',owner:'创始人',startDay:-60,endDay:-48,status:'todo',deliverable:'选址风险清单'},
    {id:'task-license',stage:'证照',title:'办理主体登记并核验证照适用性',owner:'财务/馆长',startDay:-55,endDay:-30,status:'todo',deliverable:'证照台账'},
    {id:'task-design',stage:'装修',title:'确定功能分区、施工方案和设备点位',owner:'设计方/技术负责人',startDay:-50,endDay:-35,status:'todo',deliverable:'确认版布局与预算'},
    {id:'task-build',stage:'装修',title:'施工、消防复核与工程验收',owner:'施工方/创始人',startDay:-35,endDay:-12,status:'todo',deliverable:'验收与整改记录'},
    {id:'task-hire-leads',stage:'招聘',title:'技术负责人和馆长到岗',owner:'创始人',startDay:-60,endDay:-45,status:'todo',deliverable:'劳动合同与岗位目标'},
    {id:'task-hire-team',stage:'招聘',title:'技师、训练师与学徒招聘',owner:'馆长/技术负责人',startDay:-45,endDay:-25,status:'todo',deliverable:'人员名单与排班草案'},
    {id:'task-services',stage:'项目',title:'确认项目组合、定价、合同和服务SOP',owner:'技术负责人/馆长',startDay:-40,endDay:-20,status:'todo',deliverable:'项目手册与价目表'},
    {id:'task-equipment',stage:'采购',title:'锁定设备清单、报价与到货计划',owner:'创始人/技术负责人',startDay:-38,endDay:-15,status:'todo',deliverable:'审核报价与到货表'},
    {id:'task-training',stage:'培训',title:'完成技术、服务、销售和内容训练',owner:'技术负责人/馆长',startDay:-24,endDay:-7,status:'todo',deliverable:'考核记录'},
    {id:'task-trial',stage:'试营业',title:'内部演练、试营业和问题整改',owner:'全员',startDay:-10,endDay:-1,status:'todo',deliverable:'试营业复盘'},
    {id:'task-open',stage:'开业',title:'正式开业并启动每日经营看板',owner:'馆长',startDay:0,endDay:0,status:'todo',deliverable:`月度安全营业额目标¥${project.breakEven?.safetyRevenue||0}`}
  ];}

  private quoteSummaries(items:Recommendation[]){const tiers=[['starter','基础版',new Set(['essential'])],['standard','标准版',new Set(['essential','recommended'])],['premium','升级版',new Set(['essential','recommended','upgrade'])]] as const;return tiers.map(([tier,label,allowed])=>{const rows=items.filter(x=>x.kind==='equipment'&&allowed.has(x.priority as any));return{tier,label,total:rows.reduce((s,x)=>s+(x.unitPrice||0)*x.quantity,0),itemCount:rows.length,inquiryCount:rows.filter(x=>x.priceStatus!=='approved').length};});}
  recalcQuoteSummaries(recommendations:Recommendation[]){return this.quoteSummaries(recommendations);}
  private quantity(project:OpeningProject,item:CatalogItem){if(item.name.includes('治疗床')||item.name.includes('PT凳'))return Math.max(1,Math.min(4,project.venue.beds||Math.ceil(project.area/60)));if(item.name.includes('弹力')||item.name.includes('筋膜球'))return Math.max(2,Math.ceil(project.area/50));return 1;}
  private reason(project:OpeningProject,item:CatalogItem){return `${item.required?'基础配置':'建议配置'}：适配${prototypeMeta[project.prototype.primary].name}${item.serviceTags.length?`的${item.serviceTags.join('、')}项目`:''}，符合${project.area}㎡场地与当前预算。`;}
}
