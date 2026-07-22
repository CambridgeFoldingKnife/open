import{useState,useEffect}from'react';
import{App,Button,Card,Empty,Modal,Select,Space,Spin,Tabs,Tag,Typography}from'antd';
import{ArrowLeftOutlined,DownloadOutlined}from'@ant-design/icons';
import type{OpeningProject,Role}from'@opening/shared';
import{normalizeProjectStatus}from'@opening/shared';
import{getProjectStatusTag}from'../utils/status';
import{api,getToken}from'../api';
import ReportView from'./ReportView';
import ProductQuoteTab from'./ProductQuoteTab';

const{Title,Text}=Typography;

interface ProjectDetailPageProps{
  project:OpeningProject;
  role?:Role;
  onBack:()=>void;
}

export default function ProjectDetailPage({project:onBackProject,role,onBack}:ProjectDetailPageProps){
  const{message}=App.useApp();
  const[project,setProject]=useState<OpeningProject>(onBackProject);
  const[loading,setLoading]=useState(false);
  const[confirming,setConfirming]=useState(false);

  const statusTag=getProjectStatusTag(project);
  const canManage=['admin','consultant'].includes(role||'');

  const refreshProject=async()=>{
    setLoading(true);
    try{const p=await api(`/projects/${project.id}`);setProject(p);}catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  const processProject=async()=>{
    setLoading(true);
    try{await api(`/projects/${project.id}/process`,{method:'POST'});message.success('已开始跟进');await refreshProject();}catch(e){message.error((e as Error).message);}
    finally{setLoading(false);}
  };

  const completeProject=()=>{
    setConfirming(true);
  };

  const confirmComplete=async()=>{
    setConfirming(false);
    setLoading(true);
    try{await api(`/projects/${project.id}/complete`,{method:'POST'});message.success('已标记为已完成');await refreshProject();}catch(e){message.error((e as Error).message);}
    finally{setLoading(false);}
  };

  const downloadFormat=(fmt:string)=>{
    const token=getToken();
    if(!token)return;
    const a=document.createElement('a');
    a.href=`${import.meta.env.VITE_API_URL||''}/projects/${project.id}/export?format=${fmt}&token=${token}`;
    a.download=`opening-plan-${project.id}.${fmt}`;
    a.click();
  };

  return(
    <div className="project-detail-page">
      {/* 顶部导航 */}
      <div className="detail-header">
        <div className="header-left">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined/>} 
            onClick={onBack}
            style={{padding:0}}
          >
            返回用户项目列表
          </Button>
        </div>
        <div className="header-center">
          <Space size="middle">
            <Title level={4} style={{margin:0}}>
              {project.city}·{project.venueTypeName||'待定位'}
            </Title>
            <Tag color={statusTag.color}>{statusTag.text}</Tag>
            {canManage&&!project.deletedAt&&normalizeProjectStatus(project.status)==='pending'&&<Button type="primary"loading={loading}onClick={processProject}>开始跟进</Button>}
            {canManage&&!project.deletedAt&&normalizeProjectStatus(project.status)==='processing'&&<Button type="primary"loading={loading}onClick={completeProject}>标记已完成</Button>}
          </Space>
          <Text type="secondary">{project.area}㎡ · 预算{Math.round(project.budget/10000)}万</Text>
        </div>
        <div className="header-right">
          <Select 
            defaultValue="" 
            className="export-select"
            style={{width:120}}
            placeholder="导出 PDF"
            onChange={(value)=>value&&downloadFormat(value)}
            options={[
              {value:'pdf',label:'PDF'}
            ]}
            optionLabelProp="label"
          />
        </div>
      </div>

      {/* 内容区 */}
      <Card>
        <Tabs defaultActiveKey="report">
          <Tabs.TabPane tab="项目测算详情" key="report">
            <ReportView project={project}/>
          </Tabs.TabPane>
          <Tabs.TabPane tab="产品报价单" key="quote">
            <ProductQuoteTab project={project} role={role}/>
          </Tabs.TabPane>
        </Tabs>
      </Card>
      <Modal
        title="确定完成该项目？"
        open={confirming}
        onOk={confirmComplete}
        onCancel={()=>setConfirming(false)}
        okText="确定"
        cancelText="取消"
      >
        确认后项目状态将更新为「已完成」。
      </Modal>
    </div>
  );
}
