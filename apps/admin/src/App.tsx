import{useEffect,useMemo,useRef,useState}from'react';
import{App as AntApp,Avatar,Badge,Button,Card,Col,DatePicker,Descriptions,Drawer,Empty,Form,Input,InputNumber,Layout,Menu,Modal,Popconfirm,Progress,Radio,Row,Select,SelectProps,Space,Statistic,Switch,Table,Tag,Typography}from'antd';
import{AuditOutlined,BarChartOutlined,CheckCircleOutlined,CheckOutlined,CopyOutlined,DashboardOutlined,DeleteOutlined,DownloadOutlined,EditOutlined,FilePdfOutlined,HomeOutlined,LogoutOutlined,MoneyCollectOutlined,PhoneOutlined,PlusOutlined,ProductOutlined,ProjectOutlined,SearchOutlined,TeamOutlined,UserOutlined}from'@ant-design/icons';
import dayjs from'dayjs';
import ReactECharts from'echarts-for-react';
import type{CatalogItem,FollowUp,Lead,LeadStatus,OpeningProject,Recommendation,Role,StaffAccount,UserAccount}from'@opening/shared';
import{leadStatusLabels,normalizeProjectStatus,prototypeMeta,quadrantMeta}from'@opening/shared';
import{statusColor,projectStatusLabels}from'./utils/status';
import{exportElementToPdf}from'./utils/exportPdf';
import{api,clearToken,getToken}from'./api';
import LoginPage from'./LoginPage';
import UserProjectsPage from'./components/UserProjectsPage';
import ProjectDetailPage from'./components/ProjectDetailPage';
const{Sider,Header,Content}=Layout;const{Title,Text}=Typography;

const roleLabel:Record<Role,string>={admin:'管理员',consultant:'顾问',customer:'客户'};
const roleColor:Record<Role,string>={admin:'red',consultant:'blue',customer:'default'};
const identityLabels:Record<string,string>={investor:'投资人',therapist:'康复师创业者',partner:'合伙人',other:'其他'};
const stageLabels:Record<string,string>={exploring:'刚开始了解',site_selected:'已有选址/计划中',opening_soon:'马上要开业'};

function App(){const{message}=AntApp.useApp();
  const[staff,setStaff]=useState<StaffAccount|null>(null);
  const[page,setPage]=useState('projects');
  const[projects,setProjects]=useState<OpeningProject[]>([]);
  const[leads,setLeads]=useState<Lead[]>([]);
  const[catalog,setCatalog]=useState<CatalogItem[]>([]);
  const[users,setUsers]=useState<UserAccount[]>([]);
  const[staffList,setStaffList]=useState<StaffAccount[]>([]);
  const[dashboardStats,setDashboardStats]=useState<any>(null);
  const[selected,setSelected]=useState<OpeningProject>();
  const[selectedLead,setSelectedLead]=useState<Lead>();
  const[query,setQuery]=useState('');
  const[loading,setLoading]=useState(false);
  const[authChecked,setAuthChecked]=useState(false);
  const role:Role=staff?.role||'admin';

  // 新增状态：页面视图模式
  const[viewMode,setViewMode]=useState<'list'|'user-projects'|'project-detail'>('list');
  const[selectedCustomerId,setSelectedCustomerId]=useState<string>('');
  const[selectedProjectForDetail,setSelectedProjectForDetail]=useState<OpeningProject>();

  useEffect(()=>{const t=getToken();if(!t){setAuthChecked(true);return;}api('/auth/staff/me').then(function(s){setStaff(s);}).catch(function(){clearToken();}).finally(function(){setAuthChecked(true);});},[]);

  // 动态设置浏览器标签页标题
  useEffect(()=>{
    if(staff){
      const titleMap:Record<Role,string>={
        admin:'管理员工作台',
        consultant:'顾问工作台',
        customer:'客户工作台'
      };
      document.title=`开馆助手 · ${titleMap[staff.role]||'工作台'}`;
    }
  },[staff]);

  const load=async()=>{setLoading(true);try{const b=await api('/bootstrap') as any;setProjects(b.projects);if(['admin','consultant'].includes(role)){const c=await api('/catalog') as any;setCatalog(c);}if(['admin','consultant'].includes(role)){const l=await api('/leads') as any;setLeads(l);}if(role==='admin'){const[su,ss]=await Promise.all([api('/users')as any,api('/staff')as any]);setUsers(su);setStaffList(ss);}}catch(e){message.error((e as Error).message)}finally{setLoading(false)}};
  const loadStats=async(query:string)=>{try{const st=await api(`/stats${query?'?'+query:''}`) as any;setDashboardStats(st);}catch(e){message.error((e as Error).message)}};
  useEffect(()=>{if(staff){load();if(staff.role==='admin')loadStats('');}},[staff]);const stats=useMemo(()=>{const active=projects.filter(p=>!p.deletedAt&&p.status!=='completed').length;const pipeline=leads.reduce((s,l)=>s+(l.expectedAmount||l.quoteAmount||0),0);const unassignedLeads=leads.filter(l=>!l.assignedConsultantId).length;const myLeads=leads.filter(l=>l.assignedConsultantId===staff?.id&&l.status!=='won'&&l.status!=='lost').length;return{active,pipeline,unassignedLeads,myLeads};},[projects,leads,staff]);
  const action=async(path:string,body?:unknown,method='POST')=>{try{await api(path,{method,body:body?JSON.stringify(body):undefined});message.success('操作已完成');setSelected(undefined);setSelectedLead(undefined);load()}catch(e){message.error((e as Error).message)}};

  const canViewLeads=['admin','consultant'].includes(role);
  const canViewCatalog=['admin','consultant'].includes(role);
  const menuItems=[
    {key:'projects',icon:<HomeOutlined/>,label:'开馆项目'},
    ...(canViewLeads?[{key:'leads',icon:<TeamOutlined/>,label:'销售线索'}]:[]),
    ...(canViewCatalog?[{key:'catalog',icon:<ProductOutlined/>,label:'产品与价格'}]:[]),
    ...(role==='admin'?[{key:'dashboard',icon:<DashboardOutlined/>,label:'数据看板'},{key:'users',icon:<UserOutlined/>,label:'用户管理'},{key:'staff-mgmt',icon:<TeamOutlined/>,label:'员工管理'}]:[]),
  ];

  const handleLogout=()=>{clearToken();setStaff(null);setPage('projects');setViewMode('list');};
  const handleLogin=(s:StaffAccount)=>{setStaff(s);};

  // 页面视图切换处理
  const handleOpenUserProjects=(customerId:string)=>{
    setSelectedCustomerId(customerId);
    setViewMode('user-projects');
  };

  const handleOpenProjectDetail=(project:OpeningProject)=>{
    setSelectedProjectForDetail(project);
    setViewMode('project-detail');
  };

  const handleBackToUserProjects=()=>{
    setViewMode('user-projects');
    setSelectedProjectForDetail(undefined);
  };

  const handleBackToProjectList=()=>{
    setViewMode('list');
    setSelectedCustomerId('');
    setSelectedProjectForDetail(undefined);
  };

  if(!authChecked)return null;
  if(!staff)return <AntApp><LoginPage onLogin={handleLogin}/></AntApp>;

  const webUrl=(import.meta.env.VITE_WEB_URL as string|undefined)||window.location.origin;
  const inviteLink=staff.referralCode?`${webUrl}/?ref=${staff.referralCode}`:'';const copyInvite=()=>{if(!inviteLink)return;navigator.clipboard.writeText(inviteLink).then(()=>message.success('邀请链接已复制'));};const copyInviteCode=()=>{if(!staff.referralCode)return;navigator.clipboard.writeText(staff.referralCode).then(()=>message.success('推荐码已复制'));};

  // 角色对应的标题映射
  const headerTitleMap:Record<Role,string>={
    admin:'管理后台',
    consultant:'顾问工作台',
    customer:'客户中心'
  };

  return <Layout className="shell"><Sider width={248}className="sider"><div className="brand"><div className="brand-mark">衡</div><div><b>开馆助手</b><span>REHAB OPENING OS</span></div></div><Menu theme="dark"selectedKeys={[page]}onClick={e=>{setPage(e.key);setViewMode('list');}}items={menuItems}/><div className="side-foot"><span>当前工作空间</span><b>健衡开馆服务中心</b></div></Sider><Layout><Header className="topbar"><div><Text type="secondary">报价、审核与成交跟进</Text><Title level={4}>{headerTitleMap[role]||'工作台'}</Title></div><Space>{role==='consultant'&&staff.referralCode&&<><Button type="text"icon={<CopyOutlined/>}onClick={copyInvite}>复制邀请链接</Button><Button type="text"onClick={copyInviteCode}>推荐码: {staff.referralCode}</Button></>}<Tag color={roleColor[role]}>{roleLabel[role]}</Tag><Avatar className="avatar">{staff.name[0]}</Avatar><Button type="text"icon={<LogoutOutlined/>}onClick={handleLogout}>退出</Button></Space></Header><Content className="content">
  {page==='projects'&&viewMode==='list'&&<ProjectPage projects={projects}loading={loading}query={query}setQuery={setQuery}stats={stats}role={role}onOpenUserProjects={handleOpenUserProjects}onRefresh={load}/>}
  {page==='projects'&&viewMode==='user-projects'&&<UserProjectsPage customerId={selectedCustomerId}role={role}onBack={handleBackToProjectList}onOpenProject={handleOpenProjectDetail}/>}
  {page==='projects'&&viewMode==='project-detail'&&selectedProjectForDetail&&<ProjectDetailPage project={selectedProjectForDetail}role={role}onBack={handleBackToUserProjects}onAction={action}/>}
  {page==='leads'&&canViewLeads&&<LeadPage leads={leads}loading={loading}query={query}setQuery={setQuery}onOpen={setSelectedLead}/>} {page==='catalog'&&canViewCatalog&&<CatalogPage items={catalog}role={role}onSaved={load}/>}   {page==='dashboard'&&role==='admin'&&<DashboardPage stats={dashboardStats}staffList={staffList}loading={loading}onLoadStats={loadStats}/>} {page==='users'&&role==='admin'&&<UserPage users={users}projects={projects}loading={loading}onSaved={load}/>} {page==='staff-mgmt'&&role==='admin'&&<StaffPage staffList={staffList}loading={loading}onSaved={load}/>}
  </Content></Layout><LeadDrawer lead={selectedLead}projects={projects}role={role}onClose={()=>setSelectedLead(undefined)}onAction={action}/></Layout>}

function ProjectPage({projects,loading,query,setQuery,stats,role,onOpenUserProjects,onRefresh}:{projects:OpeningProject[];loading:boolean;query:string;setQuery:(x:string)=>void;stats:any;role:Role;onOpenUserProjects:(customerId:string)=>void;onRefresh:()=>void}){
  const[actingId,setActingId]=useState<string|null>(null);
  const[confirming,setConfirming]=useState<{id:string;action:'process'|'complete'}|null>(null);
  const canManage=['admin','consultant'].includes(role);
  const runTransition=async(id:string,action:'process'|'complete')=>{
    setActingId(id);
    try{await api(`/projects/${id}/${action}`,{method:'POST'});onRefresh();}catch(err){console.error(err);}
    finally{setActingId(null);}
  };
  const handleAction=(id:string,action:'process'|'complete',e:any)=>{
    e.stopPropagation();
    if(action==='complete'){
      setConfirming({id,action});
    }else{
      runTransition(id,action);
    }
  };
  return <><section className="intro"><div><span className="eyebrow">OPENING PIPELINE</span><Title>从门店定位，<em>走到正式成交。</em></Title><Text>四象限诊断、运营原型、装修建议和设备报价共享同一份客户档案。</Text></div><div className="trajectory"><div><span>注册</span><i style={{height:'88%'}}/></div><div><span>测算</span><i style={{height:'72%'}}/></div><div><span>报价</span><i style={{height:'55%'}}/></div><div><span>成交</span><i style={{height:'32%'}}/></div></div></section><Row gutter={14}className="stats"><Col span={6}><Card><Statistic title="进行中项目"value={stats.active}suffix="个"/></Card></Col>{role==='consultant'&&<><Col span={6}><Card><Statistic title="我的跟进中线索"value={stats.myLeads}suffix="条"/></Card></Col><Col span={6}><Card><Statistic title="销售管道"value={stats.pipeline/10000}precision={1}suffix="万元"/></Card></Col></>}</Row><Card className="panel"title="开馆项目"extra={<Input prefix={<SearchOutlined/>}placeholder="搜索客户、城市、定位"value={query}onChange={e=>setQuery(e.target.value)}allowClear/>}><Table loading={loading}rowKey="id"dataSource={projects.filter(p=>[p.customerName,p.city,p.venueTypeName].join('').includes(query))}onRow={r=>({onClick:()=>onOpenUserProjects(r.customerId)})}columns={[{title:'客户 / 项目',render:(_,p)=><div className="client"><Avatar>{p.customerName[0]}</Avatar><div><b>{p.customerName}</b><span>{p.city} · {p.venueTypeName}</span></div></div>},{title:'能力坐标',render:(_,p)=><Space><Tag color="geekblue">专业 {p.capabilityResult.technicalScore}</Tag><Tag color="green">商业 {p.capabilityResult.commercialScore}</Tag></Space>},{title:'规模',render:(_,p)=><><b>{p.area}㎡</b><div className="muted">预算 {(p.budget/10000).toFixed(0)} 万</div></>},{title:'标准版报价',render:(_,p)=>`¥${(p.quoteSummaries.find(x=>x.tier==='standard')?.total||0).toLocaleString()}`},{title:'当前阶段',dataIndex:'status',render:s=>{const ns=normalizeProjectStatus(s);return<Tag color={statusColor[ns]}>{projectStatusLabels[ns]}</Tag>}},{title:<span style={{color:'#1e293b'}}>操作</span>,render:(_,p)=>{const ns=normalizeProjectStatus(p.status);return canManage&&ns!=='completed'?(<Space>{ns==='pending'&&<Button type="default"size="small"style={{color:'#1e293b'}}loading={actingId===p.id}onClick={e=>handleAction(p.id,'process',e)}>开始跟进</Button>}{ns==='processing'&&<Button type="default"size="small"style={{color:'#1e293b'}}loading={actingId===p.id}onClick={e=>handleAction(p.id,'complete',e)}>标记已完成</Button>}</Space>):null}}]}/></Card><Modal title="确定完成该项目？" open={!!confirming} onOk={async()=>{if(confirming){await runTransition(confirming.id,confirming.action);setConfirming(null);}}} onCancel={()=>setConfirming(null)} okText="确定" cancelText="取消">确认后项目状态将更新为「已完成」。</Modal></>}

function LeadPage({leads,loading,query,setQuery,onOpen}:{leads:Lead[];loading:boolean;query:string;setQuery:(x:string)=>void;onOpen:(x:Lead)=>void}){return <Card className="panel"title="销售线索与跟进"extra={<Input prefix={<SearchOutlined/>}placeholder="搜索姓名、手机号、城市"value={query}onChange={e=>setQuery(e.target.value)}allowClear/>}><Table loading={loading}rowKey="id"dataSource={leads.filter(l=>[l.name,l.phone,l.city,l.email].join('').includes(query))}onRow={r=>({onClick:()=>onOpen(r)})}columns={[{title:'客户',render:(_,l)=><div className="client"><Avatar>{l.name[0]}</Avatar><div><b>{l.name}</b><span>{l.phone.replace(/(\d{3})\d{4}(\d{4})/,'$1****$2')} · {l.city}</span></div></div>},{title:'阶段',dataIndex:'status',render:s=><Tag color={s==='won'?'green':s==='lost'?'red':'blue'}>{leadStatusLabels[s as LeadStatus]}</Tag>},{title:'意向',render:(_,l)=><>{l.quadrant?<b>{quadrantMeta[l.quadrant].name}</b>:'待测算'}<div className="muted">{l.prototype?prototypeMeta[l.prototype].name:'未定位'}</div></>},{title:'计划投入',dataIndex:'budget',render:v=>v?`${v/10000}万`:'待填写'},{title:'报价',dataIndex:'quoteAmount',render:v=>v?`¥${v.toLocaleString()}`:'—'},{title:'下次跟进',dataIndex:'nextFollowUpAt',render:v=>v?new Date(v).toLocaleString('zh-CN'):'未安排'}]}/></Card>}

function LeadDrawer({lead,projects,role,onClose,onAction}:{lead?:Lead;projects:OpeningProject[];role:Role;onClose:()=>void;onAction:(p:string,b?:unknown,m?:string)=>void}){const[form]=Form.useForm();const[follow,setFollow]=useState<FollowUp[]>([]);useEffect(()=>{if(lead)api(`/leads/${lead.id}/follow-ups`).then(function(d){setFollow(d);}).catch(function(){setFollow([]);});},[lead]);if(!lead)return null;const linkedProject=projects.find(p=>p.id===lead.projectId);return <Drawer width={620}open onClose={onClose}title={<Space><PhoneOutlined/><span>{lead.name} · 顾问跟进</span></Space>}><Descriptions column={2}items={[{label:'手机号',children:lead.phone},{label:'邮箱',children:lead.email},{label:'城市',children:lead.city},{label:'联系授权',children:lead.marketingConsent?<Tag color="green">已授权</Tag>:<Tag color="red">不可营销联系</Tag>},{label:'计划投入',children:lead.budget?`${lead.budget/10000}万元`:'待填写'},{label:'当前报价',children:lead.quoteAmount?`¥${lead.quoteAmount.toLocaleString()}`:'—'}]}/>{linkedProject&&<><Title level={5}>关联开馆方案</Title><Card size="small"style={{marginBottom:16}}><Space><Tag color={statusColor[linkedProject.status]}>{projectStatusLabels[linkedProject.status]||linkedProject.status}</Tag><Text>{linkedProject.customerName} · {linkedProject.area}㎡ · {(linkedProject.budget/10000).toFixed(0)}万</Text></Space></Card></>}<Title level={4}>更新销售阶段</Title><Space wrap><Select value={lead.status}style={{width:150}}onChange={v=>onAction(`/leads/${lead.id}`,{status:v},'PATCH')}options={Object.entries(leadStatusLabels).map(([value,label])=>({value,label}))}/></Space><Title level={4}style={{marginTop:28}}>添加跟进记录</Title><Form form={form}layout="vertical"onFinish={v=>onAction(`/leads/${lead.id}/follow-ups`,v)}><Form.Item name="channel"label="渠道"initialValue="phone"><Select options={[['phone','电话'],['wechat','微信'],['email','邮件'],['meeting','面谈']].map(([value,label])=>({value,label}))}/></Form.Item><Form.Item name="note"label="备注"><Input.TextArea rows={3}/></Form.Item><Form.Item name="nextAt"label="下次跟进时间"><Input type="datetime-local"/></Form.Item><Form.Item><Button type="primary"htmlType="submit">保存跟进记录</Button></Form.Item></Form><Title level={4}style={{marginTop:28}}>历史跟进记录</Title>{follow.length===0?<Empty description="暂无跟进记录"style={{margin:'16px 0'}}/>:follow.map(f=><Card key={f.id}size="small"style={{marginBottom:8}}><Space><Tag>{f.channel==='phone'?'电话':f.channel==='wechat'?'微信':f.channel==='email'?'邮件':'面谈'}</Tag><Text type="secondary">{new Date(f.at).toLocaleString('zh-CN')}</Text></Space><p style={{margin:'8px 0 0'}}>{f.note}</p>{f.nextAt&&<p style={{margin:'4px 0 0',color:'#666'}}>下次跟进：{new Date(f.nextAt).toLocaleString('zh-CN')}</p>}</Card>)}</Drawer>}

function CatalogPage({items,role,onSaved}:{items:CatalogItem[];role:Role;onSaved:()=>void}){const{message}=AntApp.useApp();const isAdmin=role==='admin';const[open,setOpen]=useState(false);const[editing,setEditing]=useState<CatalogItem|null>(null);const[form]=Form.useForm();const save=async()=>{const v=await form.validateFields();if(editing){await api(`/catalog/${editing.id}`,{method:'PUT',body:JSON.stringify({...editing,...v})});message.success('产品已更新');}else{await api('/catalog',{method:'POST',body:JSON.stringify({...v,id:`item-${Date.now()}`,active:true,minArea:v.minArea||0,minBudget:v.minBudget||0,serviceTags:[],audienceTags:[],description:v.description||'',venueTypeIds:[],prototypeIds:v.prototypeIds||[]})});}setOpen(false);setEditing(null);form.resetFields();onSaved()};const openEdit=(item:CatalogItem)=>{setEditing(item);form.setFieldsValue(item);setOpen(true);};const del=async(id:string)=>{await api(`/catalog/${id}`,{method:'DELETE'});message.success('产品已删除');onSaved()};return <Card className="panel"title="产品规格与价格主表"extra={isAdmin&&<Button type="primary"icon={<PlusOutlined/>}onClick={()=>{setEditing(null);form.resetFields();setOpen(true)}}>新增规格</Button>}><Table rowKey="id"dataSource={items.filter(x=>x.kind==='equipment')}columns={[{title:'产品 / 规格',render:(_,x)=><><b>{x.name}</b><div className="muted">{x.specification||x.variantId}</div></>},{title:'分类',dataIndex:'category'},{title:'画册价',dataIndex:'catalogPrice',render:v=>v?`¥${v}`:'—'},{title:'历史价',dataIndex:'historicalPrice',render:v=>v?`¥${v}`:'—'},{title:'标准报价',dataIndex:'approvedPrice',render:v=>v?`¥${v}`:'—'},{title:'价格状态',dataIndex:'priceStatus',render:s=><Tag color={s==='approved'?'green':s==='conflict'?'red':'orange'}>{s==='approved'?'已审核':s==='conflict'?'冲突':'询价'}</Tag>},{title:'来源',dataIndex:'source'},...(isAdmin?[{title:'操作',render:(_:any,x:CatalogItem)=><Space><Button type="link"icon={<EditOutlined/>}onClick={()=>openEdit(x)}>编辑</Button><Popconfirm title="确定删除？"onConfirm={()=>del(x.id)}><Button type="link"danger>删除</Button></Popconfirm></Space>}]:[])]}/><Modal open={open}onCancel={()=>{setOpen(false);setEditing(null);form.resetFields();}}onOk={save}title={editing?'编辑产品':'新增产品'}><Form form={form}layout="vertical"><Form.Item name="name"label="产品名称"rules={[{required:true}]}><Input/></Form.Item><Form.Item name="specification"label="规格"><Input/></Form.Item><Form.Item name="category"label="分类"><Input/></Form.Item><Form.Item name="catalogPrice"label="画册价"><InputNumber style={{width:'100%'}}/></Form.Item><Form.Item name="approvedPrice"label="标准报价"><InputNumber style={{width:'100%'}}/></Form.Item><Form.Item name="source"label="来源"><Input/></Form.Item></Form></Modal></Card>}

function DashboardPage({stats,staffList,loading,onLoadStats}:{stats:any;staffList:StaffAccount[];loading:boolean;onLoadStats:(query:string)=>void}){
  const dashboardRef=useRef<HTMLDivElement>(null);
  const[exporting,setExporting]=useState(false);
  const[dateRange,setDateRange]=useState<'all'|'month'|'quarter'|'year'|'custom'>('all');
  const[customRange,setCustomRange]=useState<any>(null);
  const handleExportPdf=async()=>{
    if(!dashboardRef.current||exporting)return;
    setExporting(true);
    try{await exportElementToPdf(dashboardRef.current,'数据统计表');}finally{setExporting(false);}
  };
  const handleDateChange=(key:'all'|'month'|'quarter'|'year'|'custom')=>{
    setDateRange(key);
    if(key==='all'){onLoadStats('');return;}
    const now=dayjs();
    const end=now.format('YYYY-MM-DD');
    let start='';
    if(key==='month')start=now.startOf('month').format('YYYY-MM-DD');
    else if(key==='quarter')start=(now as any).startOf('quarter').format('YYYY-MM-DD');
    else if(key==='year')start=now.startOf('year').format('YYYY-MM-DD');
    onLoadStats(`start=${start}&end=${end}`);
  };
  const handleCustomRange=(dates:any)=>{
    setCustomRange(dates);
    if(dates&&dates[0]&&dates[1]){
      setDateRange('custom');
      onLoadStats(`start=${dates[0].format('YYYY-MM-DD')}&end=${dates[1].format('YYYY-MM-DD')}`);
    }
  };
  if(!stats)return <Card className="panel"loading={loading}><Empty description="加载中..."/></Card>;

  // 专业ECharts配置 - 营收趋势
  const revenueOption={
    tooltip:{
      trigger:'axis',
      backgroundColor:'rgba(255,255,255,0.95)',
      borderColor:'#e8ecf1',
      borderWidth:1,
      textStyle:{color:'#1e293b',fontSize:12},
      formatter:(params:any)=>{
        const item=params[0];
        return `<div style="font-weight:500">${item.name}</div><div style="margin-top:4px;color:#1677ff">营收: ${(item.value/10000).toFixed(2)}万元</div>`;
      }
    },
    xAxis:{
      type:'category',
      data:(stats.monthlyRevenue||[]).map((m:any)=>m.month),
      axisLine:{lineStyle:{color:'#e8ecf1'}},
      axisTick:{show:false},
      axisLabel:{color:'#64748b',fontSize:11}
    },
    yAxis:{
      type:'value',
      name:'万元',
      nameTextStyle:{color:'#94a3b8',fontSize:11,padding:[0,40,0,0]},
      axisLine:{show:false},
      axisTick:{show:false},
      splitLine:{lineStyle:{color:'#f1f5f9',type:'dashed'}},
      axisLabel:{color:'#94a3b8',fontSize:11,formatter:(v:number)=>`${(v/10000).toFixed(0)}`}
    },
    grid:{left:50,right:16,top:28,bottom:24},
    series:[{
      name:'营收',
      type:'line',
      data:(stats.monthlyRevenue||[]).map((m:any)=>m.revenue),
      smooth:true,
      symbol:'circle',
      symbolSize:6,
      itemStyle:{color:'#1677ff',borderWidth:2,borderColor:'#fff'},
      lineStyle:{width:3,color:{type:'linear',x:0,y:0,x2:1,y2:0,colorStops:[{offset:0,color:'#1677ff'},{offset:1,color:'#4096ff'}]}},
      areaStyle:{
        color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(22,119,255,0.25)'},{offset:1,color:'rgba(22,119,255,0.02)'}]}
      },
      animationDuration:1000,
      animationEasing:'cubicOut'
    }]
  };

  // 专业ECharts配置 - 设备销售柱状图
  const equipmentOption={
    tooltip:{
      trigger:'axis',
      axisPointer:{type:'shadow',shadowStyle:{color:'rgba(22,119,255,0.06)'}},
      backgroundColor:'rgba(255,255,255,0.95)',
      borderColor:'#e8ecf1',
      borderWidth:1,
      textStyle:{color:'#1e293b',fontSize:12}
    },
    xAxis:{
      type:'category',
      data:(stats.equipmentSales||[]).map((e:any)=>e.name),
      axisLine:{lineStyle:{color:'#e8ecf1'}},
      axisTick:{show:false},
      axisLabel:{color:'#64748b',fontSize:11,rotate:25}
    },
    yAxis:{
      type:'value',
      name:'万元',
      nameTextStyle:{color:'#94a3b8',fontSize:11,padding:[0,40,0,0]},
      axisLine:{show:false},
      axisTick:{show:false},
      splitLine:{lineStyle:{color:'#f1f5f9',type:'dashed'}},
      axisLabel:{color:'#94a3b8',fontSize:11,formatter:(v:number)=>`${(v/10000).toFixed(0)}`}
    },
    grid:{left:50,right:16,top:28,bottom:60},
    series:[{
      name:'销售额',
      type:'bar',
      barWidth:20,
      data:(stats.equipmentSales||[]).map((e:any,i:number)=>({
        value:e.revenue,
        itemStyle:{
          color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:i<3?'#1677ff':'#69b1ff'},{offset:1,color:i<3?'#4096ff':'#bae0ff'}]},
          borderRadius:[4,4,0,0]
        }
      })),
      label:{show:true,position:'top',fontSize:10,color:'#64748b',formatter:(p:any)=>`${(p.value/10000).toFixed(1)}万`},
      animationDelay:(idx:number)=>idx*80
    }]
  };

  // 专业ECharts配置 - 销售漏斗
  const funnelColors=['#1677ff','#4096ff','#69b1ff','#91caff','#bae0ff'];
  const funnelOption={
    tooltip:{
      trigger:'item',
      backgroundColor:'rgba(255,255,255,0.95)',
      borderColor:'#e8ecf1',
      borderWidth:1,
      textStyle:{color:'#1e293b',fontSize:12},
      formatter:(p:any)=>`<div style="font-weight:500">${p.name}</div><div style="margin-top:4px">${p.value} 个</div>`
    },
    series:[{
      name:'销售漏斗',
      type:'funnel',
      left:'8%',
      top:16,
      bottom:16,
      width:'84%',
      min:0,
      max:(stats.funnel||[]).length>0?Math.max(...(stats.funnel||[]).map((f:any)=>f.count),1):100,
      minSize:'20%',
      maxSize:'100%',
      sort:'descending',
      gap:4,
      label:{show:true,position:'inside',fontSize:12,color:'#fff',fontWeight:500},
      itemStyle:{borderColor:'#fff',borderWidth:2,shadowBlur:4,shadowColor:'rgba(0,0,0,0.1)'},
      emphasis:{label:{fontSize:14}},
      data:(stats.funnel||[]).map((f:any,i:number)=>({
        name:f.label,
        value:f.count,
        itemStyle:{color:funnelColors[i]||funnelColors[funnelColors.length-1]}
      })),
      animationDuration:800,
      animationEasing:'cubicOut'
    }]
  };

  // 专业ECharts配置 - 项目状态饼图
  const pieColors=['#1677ff','#52c41a','#faad14','#ff4d4f','#722ed1','#13c2c2'];
  const statusData=stats.projectsByStatus?Object.entries(stats.projectsByStatus).map(([k,v]:any)=>({name:projectStatusLabels[k]||k,value:v})):[];
  const pieOption={
    tooltip:{
      trigger:'item',
      backgroundColor:'rgba(255,255,255,0.95)',
      borderColor:'#e8ecf1',
      borderWidth:1,
      textStyle:{color:'#1e293b',fontSize:12},
      formatter:(p:any)=>`<div style="font-weight:500">${p.name}</div><div style="margin-top:4px">${p.value} 个 (${p.percent}%)</div>`
    },
    legend:{
      orient:'vertical',
      right:12,
      top:'center',
      textStyle:{color:'#64748b',fontSize:11},
      itemWidth:10,
      itemHeight:10,
      itemGap:8
    },
    series:[{
      name:'项目状态',
      type:'pie',
      radius:['45%','70%'],
      center:['35%','50%'],
      avoidLabelOverlap:false,
      label:{show:false},
      emphasis:{label:{show:true,fontSize:14,fontWeight:'bold'}},
      labelLine:{show:false},
      data:statusData.map((d:any,i:number)=>({...d,itemStyle:{color:pieColors[i%pieColors.length]}})),
      animationType:'scale',
      animationDuration:800,
      animationEasing:'elasticOut'
    }]
  };

  return(
    <div ref={dashboardRef}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <Space>
          <Radio.Group value={dateRange}onChange={e=>handleDateChange(e.target.value)}size="small"optionType="button"buttonStyle="solid">
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="month">本月</Radio.Button>
            <Radio.Button value="quarter">本季</Radio.Button>
            <Radio.Button value="year">本年</Radio.Button>
          </Radio.Group>
          <DatePicker.RangePicker size="small"value={customRange}onChange={handleCustomRange}placeholder={['开始日期','结束日期']}allowClear/>
        </Space>
        <Button icon={<FilePdfOutlined/>}loading={exporting}onClick={handleExportPdf}>导出 PDF</Button>
      </div>

      {/* 统计卡片 */}
      <div className="stat-row">
        <div className="stat-card stat-card-blue">
          <div className="stat-card-content">
            <div className="stat-card-label">总用户数</div>
            <div className="stat-card-value">{stats.totalUsers}<span className="stat-card-suffix">人</span></div>
          </div>
          <div className="stat-card-icon"><UserOutlined/></div>
        </div>
        <div className="stat-card stat-card-cyan">
          <div className="stat-card-content">
            <div className="stat-card-label">进行中项目</div>
            <div className="stat-card-value">{stats.totalProjects}<span className="stat-card-suffix">个</span></div>
          </div>
          <div className="stat-card-icon"><ProjectOutlined/></div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-card-content">
            <div className="stat-card-label">已成交数</div>
            <div className="stat-card-value">{stats.totalWon}<span className="stat-card-suffix">单</span></div>
          </div>
          <div className="stat-card-icon"><CheckCircleOutlined/></div>
        </div>
        <div className="stat-card stat-card-orange">
          <div className="stat-card-content">
            <div className="stat-card-label">总营收</div>
            <div className="stat-card-value">{(stats.totalRevenue/10000).toFixed(1)}<span className="stat-card-suffix">万元</span></div>
          </div>
          <div className="stat-card-icon"><MoneyCollectOutlined/></div>
        </div>
      </div>

      {/* 图表区域 - 2x2网格 */}
      <div className="dashboard-grid">
        <div className="chart-card">
          <div className="chart-card-header">月度营收趋势</div>
          <div className="chart-card-body">
            {stats.monthlyRevenue?.length>0 ? <ReactECharts option={revenueOption} style={{height:240}}/> : <Empty description="暂无数据"/>}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-card-header">设备销售 Top 10</div>
          <div className="chart-card-body">
            {stats.equipmentSales?.length>0 ? <ReactECharts option={equipmentOption} style={{height:240}}/> : <Empty description="暂无数据"/>}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-card-header">销售转化漏斗</div>
          <div className="chart-card-body">
            {stats.funnel?.length>0 ? <ReactECharts option={funnelOption} style={{height:240}}/> : <Empty description="暂无数据"/>}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-card-header">项目状态分布</div>
          <div className="chart-card-body">
            {statusData.length>0 ? <ReactECharts option={pieOption} style={{height:240}}/> : <Empty description="暂无数据"/>}
          </div>
        </div>
      </div>

      {/* 顾问业绩排行 - 全宽 */}
      <div className="chart-card" style={{marginTop:12}}>
        <div className="chart-card-header">顾问业绩排行</div>
        <div className="chart-card-body">
          <Table
            rowKey="id"
            dataSource={stats.consultantStats||[]}
            pagination={false}
            size="small"
            columns={[
              {title:'排名',width:60,render:(_,__,i)=><span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:20,height:20,borderRadius:'50%',background:i<3?['#1677ff','#4096ff','#69b1ff'][i]:'#e8ecf1',color:i<3?'#fff':'#64748b',fontSize:12,fontWeight:500}}>{i+1}</span>},
              {title:'顾问',dataIndex:'name',render:(v:string)=><span style={{fontWeight:500}}>{v}</span>},
              {title:'项目数',dataIndex:'projectCount',render:(v:number)=><span style={{color:'#1677ff',fontWeight:500}}>{v}</span>},
              {title:'成交',dataIndex:'wonCount',render:(v:number)=><span style={{color:'#52c41a',fontWeight:500}}>{v}</span>},
              {title:'营收',dataIndex:'revenue',render:(v:number)=><span style={{color:'#fa8c16',fontWeight:500}}>{(v/10000).toFixed(1)}万</span>}
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function UserPage({users,projects,loading,onSaved}:{users:UserAccount[];projects:OpeningProject[];loading:boolean;onSaved:()=>void}){const{message}=AntApp.useApp();const[query,setQuery]=useState('');const[editing,setEditing]=useState<UserAccount|null>(null);const[open,setOpen]=useState(false);const[form]=Form.useForm();const save=async()=>{const v=await form.validateFields();await api(`/users/${editing!.id}`,{method:'PATCH',body:JSON.stringify(v)});message.success('用户信息已更新');setOpen(false);setEditing(null);onSaved()};const openEdit=(u:UserAccount)=>{setEditing(u);form.setFieldsValue(u);setOpen(true);};return <><Card className="panel"title="用户管理"extra={<Input prefix={<SearchOutlined/>}placeholder="搜索姓名、手机、邮箱、城市"value={query}onChange={e=>setQuery(e.target.value)}allowClear/>}><Table loading={loading}rowKey="id"dataSource={users.filter(u=>!query||[u.name,u.phone,u.email,u.city].join('').toLowerCase().includes(query.toLowerCase()))}columns={[{title:'姓名',dataIndex:'name'},{title:'手机号',dataIndex:'phone'},{title:'邮箱',dataIndex:'email'},{title:'城市',dataIndex:'city'},{title:'身份',dataIndex:'identity',render:v=><Tag>{identityLabels[v]||v}</Tag>},{title:'项目数',render:(_,u)=>projects.filter(p=>p.customerId===u.id).length},{title:'注册时间',dataIndex:'createdAt',render:v=>new Date(v).toLocaleDateString('zh-CN')},{title:'操作',render:(_,u)=><Button type="link"icon={<EditOutlined/>}onClick={()=>openEdit(u)}>编辑</Button>}]}/></Card><Modal open={open}onCancel={()=>{setOpen(false);setEditing(null);}}onOk={save}title="编辑用户信息"><Form form={form}layout="vertical"><Form.Item name="name"label="姓名"><Input/></Form.Item><Form.Item name="phone"label="手机号"><Input/></Form.Item><Form.Item name="email"label="邮箱"><Input/></Form.Item><Form.Item name="city"label="城市"><Input/></Form.Item><Form.Item name="identity"label="身份"><Select options={Object.entries(identityLabels).map(([value,label])=>({value,label}))}/></Form.Item><Form.Item name="stage"label="创业阶段"><Select options={Object.entries(stageLabels).map(([value,label])=>({value,label}))}/></Form.Item></Form></Modal></>}

function StaffPage({staffList,loading,onSaved}:{staffList:StaffAccount[];loading:boolean;onSaved:()=>void}){const{message}=AntApp.useApp();const[open,setOpen]=useState(false);const[editing,setEditing]=useState<StaffAccount|null>(null);const[form]=Form.useForm();const save=async()=>{const v=await form.validateFields();if(editing){await api(`/staff/${editing.id}`,{method:'PATCH',body:JSON.stringify(v)});message.success('员工信息已更新');}else{await api('/staff',{method:'POST',body:JSON.stringify(v)});message.success('员工已创建');}setOpen(false);setEditing(null);form.resetFields();onSaved()};const openEdit=(s:StaffAccount)=>{setEditing(s);form.setFieldsValue(s);setOpen(true);};const toggleActive=async(s:StaffAccount)=>{await api(`/staff/${s.id}/toggle-active`,{method:'POST'});message.success(s.active?'已停用':'已启用');onSaved()};return <><Card className="panel"title="员工管理"extra={<Button type="primary"icon={<PlusOutlined/>}onClick={()=>{setEditing(null);form.resetFields();setOpen(true)}}>新增员工</Button>}><Table loading={loading}rowKey="id"dataSource={staffList}columns={[{title:'姓名',dataIndex:'name'},{title:'邮箱',dataIndex:'email'},{title:'角色',dataIndex:'role',render:(v:Role)=><Tag color={roleColor[v]}>{roleLabel[v]}</Tag>},{title:'职位',dataIndex:'title'},{title:'手机',dataIndex:'phone'},{title:'推荐码',dataIndex:'referralCode',render:v=>v||'未生成'},{title:'状态',dataIndex:'active',render:v=><Tag color={v?'green':'red'}>{v?'启用':'停用'}</Tag>},{title:'操作',render:(_,s)=><Space><Button type="link"icon={<EditOutlined/>}onClick={()=>openEdit(s)}>编辑</Button><Popconfirm title={`确定${s.active?'停用':'启用'}？`}onConfirm={()=>toggleActive(s)}><Button type="link"danger={s.active}>{s.active?'停用':'启用'}</Button></Popconfirm></Space>}]}/></Card><Modal open={open}onCancel={()=>{setOpen(false);setEditing(null);form.resetFields();}}onOk={save}title={editing?'编辑员工':'新增员工'}><Form form={form}layout="vertical"><Form.Item name="name"label="姓名"rules={[{required:true}]}><Input/></Form.Item><Form.Item name="email"label="邮箱"rules={[{required:true}]}><Input/></Form.Item>{!editing&&<Form.Item name="password"label="密码"rules={[{required:true}]}><Input.Password/></Form.Item>}<Form.Item name="role"label="角色"rules={[{required:true}]}><Select options={[{value:'admin',label:'管理员'},{value:'consultant',label:'顾问'}]}/></Form.Item><Form.Item name="title"label="职位"><Input/></Form.Item><Form.Item name="phone"label="手机"><Input/></Form.Item></Form></Modal></>}

export default()=> <AntApp><App/></AntApp>;