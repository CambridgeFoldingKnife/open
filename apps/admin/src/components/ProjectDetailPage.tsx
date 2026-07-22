import{useState}from'react';
import{Button,Card,Select,Space,Tabs,Tag,Typography}from'antd';
import{ArrowLeftOutlined,DownloadOutlined}from'@ant-design/icons';
import type{OpeningProject,Role}from'@opening/shared';
import{getProjectStatusTag}from'../utils/status';
import{api,getToken}from'../api';
import ReportView from'./ReportView';
import ProductQuoteTab from'./ProductQuoteTab';

const{Title,Text}=Typography;

interface ProjectDetailPageProps{
  project:OpeningProject;
  role?:Role;
  onBack:()=>void;
  onAction?:(path:string,body?:unknown,method?:string)=>Promise<void>;
}

export default function ProjectDetailPage({project:onBackProject,role,onBack,onAction}:ProjectDetailPageProps){
  const[project,setProject]=useState<OpeningProject>(onBackProject);
  const[loading,setLoading]=useState(false);

  const statusTag=getProjectStatusTag(project);
  const canEdit=['consultant','admin'].includes(role||'');

  const downloadFormat=(fmt:string)=>{
    const token=getToken();
    if(!token)return;
    const a=document.createElement('a');
    a.href=`${import.meta.env.VITE_API_URL||''}/projects/${project.id}/export?format=${fmt}&token=${token}`;
    a.download=`opening-plan-${project.id}.${fmt}`;
    a.click();
  };

  const transition=async(next:'process'|'complete')=>{
    if(!onAction)return;
    setLoading(true);
    try{
      await onAction(`/projects/${project.id}/${next}`);
      const fresh=await api(`/projects/${project.id}`) as OpeningProject;
      setProject(fresh);
    }catch(e){
      console.error(e);
    }finally{
      setLoading(false);
    }
  };

  const renderActionButton=()=>{
    if(!canEdit)return null;
    if(project.status==='pending'){
      return(
        <Button type="primary"loading={loading}onClick={()=>transition('process')}>
          开始处理
        </Button>
      );
    }
    if(project.status==='processing'){
      return(
        <Button type="primary"loading={loading}onClick={()=>transition('complete')}>
          标记完成
        </Button>
      );
    }
    return(
      <Button disabled>
        已完成
      </Button>
    );
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
          </Space>
          <Text type="secondary">{project.area}㎡ · 预算{Math.round(project.budget/10000)}万</Text>
        </div>
        <div className="header-right">
          <Space>
            {renderActionButton()}
            <Select 
              defaultValue="" 
              className="export-select"
              style={{width:120}}
              placeholder="导出"
              onChange={(value)=>value&&downloadFormat(value)}
              options={[
                {value:'excel',label:'Excel'},
                {value:'pdf',label:'PDF'},
                {value:'md',label:'Markdown'}
              ]}
              optionLabelProp="label"
            />
          </Space>
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
    </div>
  );
}
