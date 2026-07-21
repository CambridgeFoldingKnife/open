export type Role = 'customer' | 'consultant' | 'admin';
export type ProjectStatus = 'draft' | 'submitted' | 'assigned' | 'planning' | 'review' | 'published' | 'foundation_confirmed' | 'growth_active';
export const statusLabels: Record<ProjectStatus, string> = {
  draft: '草稿', submitted: '已完成测算', assigned: '已分配', planning: '方案编制中', review: '待审核',
  published: '报价已发布', foundation_confirmed: '基础方案已确认', growth_active: '推广助手已开放'
};

export type StoreQuadrant = 'starter' | 'growth' | 'expert' | 'system';
export type OperatingPrototype = 'community' | 'commercial' | 'medical';
export const quadrantMeta: Record<StoreQuadrant, { name: string; original: string; tech: '低' | '高'; business: '低' | '高'; upgrade: string }> = {
  starter: { name: '起步型门店', original: '传统体验型门店', tech: '低', business: '低', upgrade: '先聚焦高频问题，建立基础评估和项目包' },
  growth: { name: '流量增长型门店', original: '营销型流量店', tech: '低', business: '高', upgrade: '补足专业评估、禁忌识别和复测证据' },
  expert: { name: '专家型门店', original: '专家工作室', tech: '高', business: '低', upgrade: '把专家经验沉淀为SOP、课程包和训练体系' },
  system: { name: '系统型门店', original: '系统型康复门店', tech: '高', business: '高', upgrade: '用看板、AI助手和督导机制提升复制能力' }
};
export const prototypeMeta: Record<OperatingPrototype, { name: string; area: string; audience: string }> = {
  community: { name: '社区轻量店', area: '80-150㎡', audience: '社区居民、银发、久坐办公与家庭客户' },
  commercial: { name: '商圈标准店', area: '150-300㎡', audience: '白领、运动人群与体态功能改善用户' },
  medical: { name: '医健协同店', area: '120-250㎡', audience: '术后稳定期、慢病稳定期与专业转介用户' }
};

export interface UserAccount {
  id: string; phone: string; email: string; name: string; city: string;
  identity: 'investor' | 'therapist' | 'partner' | 'other';
  stage: 'exploring' | 'site_selected' | 'opening_soon';
  passwordHash?: string; emailVerified?: boolean;
  preferredContact: 'phone' | 'wechat' | 'email'; contactWindow: string; marketingConsent: boolean; consentAt?: string;
  organizationId: string; createdAt: string;
}
export interface ConsentRecord { id: string; userId: string; type: 'terms' | 'privacy' | 'marketing'; granted: boolean; at: string; }
export interface CapabilityAnswers {
  professionalBackground: number; assessmentIntervention: number; riskRecognition: number; cases: number; teachingTeam: number;
  customerResources: number; contentAcquisition: number; salesConversion: number; management: number; fundingTeam: number;
}
export interface CapabilityResult {
  technicalScore: number; commercialScore: number; completeness: number; quadrant: StoreQuadrant;
  strengths: string[]; gaps: string[];
}
export interface ReadinessAnswers { capital: number; resources: number; involvement: number; returnExpectation: number; riskTolerance: number; }
export interface VenueProfile {
  address: string; area: number; rentMonthly: number; ceilingHeight: number; beds: number; length?: number; width?: number;
  rentMode?: 'leased' | 'owned' | 'undecided'; imputedRentMonthly?: number; layoutNotes?: string;
}
export interface PrototypeRecommendation { primary: OperatingPrototype; alternative: OperatingPrototype; primaryReason: string; alternativeReason: string; rejectedReasons: string[]; }
export interface RenovationRecommendation {
  keywords: string[]; positioning: string; zoneRatios: { zone: string; percent: number; area: number }[];
  circulation: string[]; essentials: string[]; recommended: string[]; deferred: string[]; risks: string[];
}
export interface Recommendation {
  id: string; kind: 'equipment' | 'course' | 'role' | 'marketing' | 'service'; name: string;
  reason: string; required: boolean; quantity: number; unitPrice?: number; priceStatus?: 'approved' | 'inquiry' | 'conflict';
  variantId?: string; note?: string; priority?: 'essential' | 'recommended' | 'upgrade' | 'defer';
}
export interface QuoteSummary { tier: 'starter' | 'standard' | 'premium'; label: string; total: number; itemCount: number; inquiryCount: number; }
export interface LicenseTask { id: string; name: string; owner: string; timing: string; materials: string; source: string; status: 'todo' | 'verify' | 'done'; }
export interface StaffingRole { id: string; name: string; count: number; timing: string; responsibilities: string; interviewFocus: string;
  duties?: string[]; qualifications?: string[]; weeklyOutputs?: string[]; kpis?: string[]; recruitmentDay?: number; canCombineWith?: string; monthlySalary?: number; }
export interface ServiceOffering { id:string; name:string; category:'traffic'|'star'|'cashflow'|'retention'|'custom'; categoryLabel:string; description:string; unitPrice:number; sessions:number; monthlyTarget:number; selected:boolean; equipmentTags:string[]; variableCostRate?:number; }
export interface BreakEvenEstimate { staffCost:number; rentCost:number; occupancyCost:number; utilitiesCost:number; adminCost:number; depreciationCost:number; monthlyFixedCost:number;
  weightedVariableCostRate:number; contributionMarginRate:number; breakEvenRevenue:number; safetyRevenue:number; averageOrderValue:number; monthlyOrders:number; dailyOrders:number;
  staffHeadcount:number; capacitySessions:number; requiredSessions:number; capacityUtilization:number; cashReserve90Days:number;
  projectTargets:{serviceId:string;name:string;packages:number;sessions:number;revenue:number}[]; assumptions:string[]; }
export interface OpeningTask { id:string; stage:string; title:string; owner:string; startDay:number; endDay:number; status:'todo'|'doing'|'done'; deliverable:string; }
export interface OpeningProject {
  id: string; customerId: string; organizationId: string; customerName: string; phone: string; email?: string;
  founderRole?: 'investor' | 'therapist';
  venueTypeId: string; venueTypeName: string; city: string; area: number; budget: number; audiences: string[]; plannedServices: string[];
  openingDate: string; teamFoundation: string; readiness: ReadinessAnswers; readinessScore: number; capability: CapabilityAnswers;
  capabilityModes?: Partial<Record<keyof CapabilityAnswers,'option'|'other'>>; capabilityNotes?: Partial<Record<keyof CapabilityAnswers,string>>;
  readinessModes?: Partial<Record<keyof ReadinessAnswers,'option'|'other'>>; readinessNotes?: Partial<Record<keyof ReadinessAnswers,string>>;
  capabilityResult: CapabilityResult; quadrant: StoreQuadrant; prototype: PrototypeRecommendation; venue: VenueProfile;
  renovation: RenovationRecommendation; licenses: LicenseTask[]; staffing: StaffingRole[]; quoteSummaries: QuoteSummary[];
  servicePortfolio?: ServiceOffering[]; breakEven?: BreakEvenEstimate; openingTasks?: OpeningTask[];
  status: ProjectStatus; consultantId?: string; interviewNotes?: string; recommendations: Recommendation[];
  version: number; createdAt: string; updatedAt: string; publishedAt?: string;
}
export interface CatalogItem {
  id: string; kind: Recommendation['kind']; name: string; category: string; venueTypeIds: string[]; prototypeIds?: OperatingPrototype[];
  minArea: number; maxArea?: number; minBudget: number; budgetTier: 'starter' | 'standard' | 'premium';
  serviceTags: string[]; audienceTags: string[]; personnelRequirement?: string; required: boolean; description: string; active: boolean;
  variantId?: string; specification?: string; catalogPrice?: number; historicalPrice?: number; approvedPrice?: number; floorPrice?: number;
  priceStatus?: 'approved' | 'inquiry' | 'conflict'; source?: string;
}
export interface VenueType { id: string; name: string; description: string; active: boolean; }
export type LeadStatus = 'registered' | 'measured' | 'quoted' | 'unassigned' | 'contacted' | 'qualified' | 'requote' | 'negotiating' | 'won' | 'paused' | 'lost';
export const leadStatusLabels: Record<LeadStatus, string> = { registered:'新注册', measured:'已测算', quoted:'已报价', unassigned:'待分配', contacted:'已联系', qualified:'需求确认', requote:'报价调整', negotiating:'商务跟进', won:'成交', paused:'暂缓', lost:'失败' };
export interface Lead {
  id: string; userId: string; projectId?: string; name: string; phone: string; email: string; city: string; identity: UserAccount['identity'];
  budget: number; area: number; openingDate?: string; quadrant?: StoreQuadrant; prototype?: OperatingPrototype; quoteAmount?: number;
  marketingConsent: boolean; status: LeadStatus; assignedConsultantId?: string; nextFollowUpAt?: string; expectedAmount?: number;
  probability?: number; lastNote?: string; lostReason?: string; createdAt: string; updatedAt: string;
}
export interface FollowUp { id: string; leadId: string; consultantId: string; channel: 'phone' | 'wechat' | 'email' | 'meeting'; note: string; nextAt?: string; at: string; }
export interface StaffAccount { id: string; email: string; passwordHash: string; name: string; role: Role; title: string; phone: string; active: boolean; createdAt: string; }
export interface AuditEvent { id: string; projectId: string; actorId: string; actorRole: Role; action: string; detail: string; at: string; }

export const emptyCapability = (): CapabilityAnswers => ({ professionalBackground:50,assessmentIntervention:50,riskRecognition:50,cases:50,teachingTeam:50,customerResources:50,contentAcquisition:50,salesConversion:50,management:50,fundingTeam:50 });
export const readinessScore = (a: ReadinessAnswers) => Math.round((a.capital + a.resources + a.involvement + a.returnExpectation + a.riskTolerance) / 5);
export const readinessBand = (score: number) => score < 60 ? '准备不足' : score < 80 ? '有条件推进' : '准备充分';

export function capabilityScore(a: CapabilityAnswers): CapabilityResult {
  const technicalScore = Math.round(a.professionalBackground*.25+a.assessmentIntervention*.25+a.riskRecognition*.2+a.cases*.15+a.teachingTeam*.15);
  const commercialScore = Math.round(a.customerResources*.2+a.contentAcquisition*.2+a.salesConversion*.2+a.management*.2+a.fundingTeam*.2);
  const quadrant: StoreQuadrant = technicalScore>=60 ? (commercialScore>=60?'system':'expert') : (commercialScore>=60?'growth':'starter');
  const dims: [string,number][] = [['专业背景',a.professionalBackground],['评估干预',a.assessmentIntervention],['风险识别',a.riskRecognition],['案例积累',a.cases],['带教团队',a.teachingTeam],['客户资源',a.customerResources],['内容获客',a.contentAcquisition],['销售转化',a.salesConversion],['经营管理',a.management],['资金团队',a.fundingTeam]];
  return { technicalScore, commercialScore, completeness: Math.round(dims.filter(([,v])=>Number.isFinite(v)).length/10*100), quadrant,
    strengths:dims.filter(([,v])=>v>=70).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([n])=>n), gaps:dims.filter(([,v])=>v<60).sort((a,b)=>a[1]-b[1]).slice(0,3).map(([n])=>n) };
}
