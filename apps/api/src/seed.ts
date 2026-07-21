import type { CatalogItem, Lead, OpeningProject, StaffAccount, UserAccount, VenueType } from '@opening/shared';
import { capabilityScore, emptyCapability, readinessScore } from '@opening/shared';
import { hashPassword } from './auth';

export const venues: VenueType[] = [
  { id:'prototype-community',name:'社区轻量店',description:'80-150㎡，社区信任与近距离复购',active:true },
  { id:'prototype-commercial',name:'商圈标准店',description:'150-300㎡，白领与运动客群，多项目标准交付',active:true },
  { id:'prototype-medical',name:'医健协同店',description:'120-250㎡，专业转介与边界清晰的恢复服务',active:true }
];

const item=(x:Partial<CatalogItem>&Pick<CatalogItem,'id'|'name'|'category'>):CatalogItem=>({
  kind:'equipment',venueTypeIds:[],prototypeIds:['community','commercial','medical'],minArea:0,minBudget:0,budgetTier:'starter',serviceTags:[],audienceTags:[],required:false,description:'',active:true,priceStatus:'inquiry',...x
});

export const catalog: CatalogItem[] = [
  item({id:'eq-bed-electric',variantId:'TT-BED-3S-BLUE',name:'三段式电动手法PT床',category:'治疗床、PT凳',specification:'蓝色三段升级款气杆调节床体加固',historicalPrice:3300,approvedPrice:3300,floorPrice:3000,priceStatus:'approved',required:true,description:'评估与一对一服务基础工位',source:'Theratools报价单6.16.xlsx',serviceTags:['运动损伤','体态矫正']}),
  item({id:'eq-pt-stool',variantId:'TT-STOOL-ROUND',name:'专业PT凳',category:'治疗床、PT凳',specification:'圆凳',historicalPrice:220,approvedPrice:220,floorPrice:200,priceStatus:'approved',required:true,source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-dms',variantId:'TT-DMS-PLUG-RIGHT',name:'DMS深层肌肉刺激仪',category:'手法治疗',specification:'新一代插电式直角款，长柄钛合金7头',historicalPrice:2090,approvedPrice:2090,floorPrice:1900,priceStatus:'approved',required:true,source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-fascia-set',variantId:'TT-FASCIA-6-BROWN',name:'筋膜刀套装',category:'手法治疗',specification:'褐色精英六件套',historicalPrice:400,approvedPrice:400,floorPrice:360,priceStatus:'approved',required:true,source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-fms',variantId:'TT-FMS-CN',name:'FMS功能性运动测试工具套件',category:'筛查评估',specification:'国产版',historicalPrice:586,approvedPrice:586,floorPrice:520,priceStatus:'approved',required:true,source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-posture',variantId:'TT-POSTURE-GREEN-HI',name:'体姿评估图',category:'筛查评估',specification:'高配版绿色',historicalPrice:100,approvedPrice:100,floorPrice:90,priceStatus:'approved',required:true,source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-angle',variantId:'TT-ANGLE-ACRYLIC-5',name:'肢体角度尺',category:'筛查评估',specification:'亚克力五件套',historicalPrice:150,approvedPrice:150,floorPrice:135,priceStatus:'approved',required:true,source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-bosu',variantId:'TT-BOSU-615-BLACK',name:'稳定性训练波速球',category:'运动治疗',specification:'黑色专业款61.5cm',historicalPrice:200,approvedPrice:200,floorPrice:180,priceStatus:'approved',required:true,source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-mat',variantId:'TT-MAT-LONG',name:'康复训练垫',category:'运动治疗',specification:'加长款',historicalPrice:120,approvedPrice:120,floorPrice:108,priceStatus:'approved',required:true,source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-ribstall',variantId:'TT-RIB-2600-1800',name:'脊柱侧弯训练架肋木架',category:'脊柱侧弯SPS',specification:'墙上固定双肩款，2.6m×1.8m，水曲柳',historicalPrice:2800,approvedPrice:2800,floorPrice:2500,priceStatus:'approved',budgetTier:'standard',minArea:120,serviceTags:['体态矫正'],source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-posture-mirror',variantId:'TT-MIRROR-GRID',name:'姿势矫正镜',category:'脊柱侧弯SPS',specification:'带网格线',historicalPrice:800,approvedPrice:800,floorPrice:720,priceStatus:'approved',budgetTier:'standard',serviceTags:['体态矫正'],source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-compression',variantId:'TT-BOOTS-PRO',name:'气压恢复靴',category:'康复辅助',specification:'专业款',historicalPrice:1300,approvedPrice:1300,floorPrice:1170,priceStatus:'approved',budgetTier:'standard',serviceTags:['运动表现'],source:'Theratools报价单6.16.xlsx'}),
  item({id:'eq-ultrasound',variantId:'THIRD-US-WEIERDE',name:'超声波康复仪',category:'物理因子',specification:'维尔德',historicalPrice:5000,priceStatus:'conflict',budgetTier:'premium',minArea:120,description:'历史报价与画册型号/价格存在差异，必须人工确认',source:'Theratools报价单6.16.xlsx / 画册.pdf'}),
  item({id:'eq-shockwave',variantId:'TT-SHOCKWAVE',name:'弹道式气动冲击波理疗器',category:'物理因子',catalogPrice:15600,priceStatus:'inquiry',budgetTier:'premium',minArea:150,description:'画册标价仅作参考，正式报价待审核',source:'画册.pdf 第50页'}),
  {id:'role-therapist',kind:'role',name:'一线康复/训练人员',category:'人员配置',venueTypeIds:[],prototypeIds:['community','commercial','medical'],minArea:0,minBudget:0,budgetTier:'starter',serviceTags:[],audienceTags:[],required:true,description:'负责评估、服务记录、训练与复测',active:true},
  {id:'course-eval',kind:'course',name:'标准化评估与风险识别训练',category:'人员培训',venueTypeIds:[],prototypeIds:['community','commercial','medical'],minArea:0,minBudget:0,budgetTier:'starter',serviceTags:[],audienceTags:[],required:true,description:'补齐评估、禁忌识别和服务边界',active:true},
  {id:'service-assess',kind:'service',name:'首次功能评估包',category:'引流项目',venueTypeIds:[],prototypeIds:['community','commercial','medical'],minArea:0,minBudget:0,budgetTier:'starter',serviceTags:[],audienceTags:[],required:true,description:'用评估解释问题并建立信任',active:true},
  {id:'service-improve',kind:'service',name:'4-8周功能改善包',category:'现金流项目',venueTypeIds:[],prototypeIds:['community','commercial','medical'],minArea:0,minBudget:0,budgetTier:'starter',serviceTags:[],audienceTags:[],required:true,description:'核心收入与阶段复测项目',active:true},
  {id:'marketing-30',kind:'marketing',name:'开馆前30天内容预热',category:'第二阶段推广',venueTypeIds:[],prototypeIds:['community','commercial','medical'],minArea:0,minBudget:0,budgetTier:'starter',serviceTags:[],audienceTags:[],required:true,description:'仅在基础方案确认后开放',active:true}
];

export const demoUser:UserAccount={id:'customer-1',phone:'13800002468',email:'lin@example.com',name:'林女士',city:'杭州',identity:'investor',stage:'exploring',preferredContact:'wechat',contactWindow:'工作日 14:00-18:00',marketingConsent:true,consentAt:new Date().toISOString(),organizationId:'org-customer-1',createdAt:new Date().toISOString()};
const readiness={capital:82,resources:70,involvement:88,returnExpectation:64,riskTolerance:76};
const capability={...emptyCapability(),professionalBackground:72,assessmentIntervention:76,riskRecognition:70,cases:68,teachingTeam:62,customerResources:66,contentAcquisition:58,salesConversion:54,management:56,fundingTeam:72};
export const demoProject:OpeningProject={
  id:'project-demo',customerId:'customer-1',organizationId:'org-customer-1',customerName:'林女士',phone:'13800002468',email:'lin@example.com',venueTypeId:'',venueTypeName:'',city:'杭州',area:180,budget:800000,
  audiences:['跑者','久坐白领'],plannedServices:['运动损伤','体态矫正','运动表现'],openingDate:'2026-10-01',teamFoundation:'已有1名主理人及1名健身教练',
  readiness,readinessScore:readinessScore(readiness),capability,capabilityResult:capabilityScore(capability),quadrant:'expert',prototype:{primary:'community',alternative:'commercial',primaryReason:'',alternativeReason:'',rejectedReasons:[]},
  venue:{address:'杭州市滨江区',area:180,rentMonthly:26000,ceilingHeight:3.4,beds:3},renovation:{keywords:[],positioning:'',zoneRatios:[],circulation:[],essentials:[],recommended:[],deferred:[],risks:[]},licenses:[],staffing:[],quoteSummaries:[],
  status:'review',consultantId:'staff-consultant',interviewNotes:'客户重视专业口碑，建议先聚焦跑者与久坐白领。',recommendations:[],version:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
};
export const demoLead:Lead={id:'lead-demo',userId:'customer-1',projectId:'project-demo',name:'林女士',phone:'13800002468',email:'lin@example.com',city:'杭州',identity:'investor',budget:800000,area:180,openingDate:'2026-10-01',quadrant:'expert',prototype:'commercial',quoteAmount:0,marketingConsent:true,status:'qualified',assignedConsultantId:'staff-consultant',nextFollowUpAt:'2026-07-16T06:00:00.000Z',expectedAmount:42000,probability:65,lastNote:'客户等待装修建议与设备标准版报价。',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};

const defaultHash=hashPassword('123456');
export const demoStaff:StaffAccount[]=[
  {id:'staff-admin',email:'admin@jianheng.com',passwordHash:defaultHash,name:'管理员',role:'admin',title:'系统管理员',phone:'13800000001',active:true,createdAt:new Date().toISOString()},
  {id:'staff-consultant',email:'consultant@jianheng.com',passwordHash:defaultHash,name:'李顾问',role:'consultant',title:'高级顾问',phone:'13800000002',active:true,createdAt:new Date().toISOString()}
];
