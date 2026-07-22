import{useRef,useState}from'react';
import{Button,Card,Space,Tabs,Tag,Typography,App}from'antd';
import{ArrowLeftOutlined,FilePdfOutlined}from'@ant-design/icons';
import type{OpeningProject,Role}from'@opening/shared';
import{getProjectStatusTag}from'../utils/status';
import{api}from'../api';
import{exportElementToPdf}from'../utils/exportPdf';
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
  const{message}=App.useApp();
  const[project,setProject]=useState<OpeningProject>(onBackProject);
  const[loading,setLoading]=useState(false);
  const[activeTab,setActiveTab]=useState<string>('report');
  const[exporting,setExporting]=useState(false);
  const reportRef=useRef<HTMLDivElement>(null);
  const quoteRef=useRef<HTMLDivElement>(null);

  const statusTag=getProjectStatusTag(project);
  const canEdit=['consultant','admin'].includes(role||'');

  const handleExportPdf=async()=>{
    const contentRef=activeTab==='report'?reportRef:quoteRef;
    if(!contentRef.current||exporting)return;
    setExporting(true);
    try{
      const filename=activeTab==='report'
        ?`项目测算详情-${project.city}-${project.area}㎡`
        :`产品报价单-${project.city}-${project.area}㎡`;
      await exportElementToPdf(contentRef.current,filename);
      message.success('PDF导出成功');
    }catch(e){
      message.error('导出失败，请重试');
      console.error(e);
    }finally{
      setExporting(false);
    }
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
            <Button 
              icon={<FilePdfOutlined/>}
              loading={exporting}
              onClick={handleExportPdf}
            >
              导出 PDF
            </Button>
          </Space>
        </div>
      </div>

      {/* 内容区 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="项目测算详情" key="report">
            <div ref={reportRef}>
              <ReportView project={project}/>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab="产品报价单" key="quote">
            <div ref={quoteRef}>
              <ProductQuoteTab project={project} role={role}/>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
