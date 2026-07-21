import{useState,useEffect}from'react';
import{Avatar,Button,Card,Col,Empty,Modal,Row,Space,Spin,Tag,Typography}from'antd';
import{ArrowLeftOutlined,EnvironmentOutlined,CalendarOutlined}from'@ant-design/icons';
import type{OpeningProject,Role,UserAccount}from'@opening/shared';
import{normalizeProjectStatus}from'@opening/shared';
import{getProjectStatusTag}from'../utils/status';
import{api}from'../api';

const{Title,Text}=Typography;

interface UserProjectsPageProps{
  customerId:string;
  role:Role;
  onBack:()=>void;
  onOpenProject:(project:OpeningProject)=>void;
}

export default function UserProjectsPage({customerId,role,onBack,onOpenProject}:UserProjectsPageProps){
  const[projects,setProjects]=useState<OpeningProject[]>([]);
  const[user,setUser]=useState<UserAccount|null>(null);
  const[loading,setLoading]=useState(true);
  const[actingId,setActingId]=useState<string|null>(null);
  const[confirming,setConfirming]=useState<{id:string;action:'process'|'complete'}|null>(null);

  const canManage=['admin','consultant'].includes(role);

  const loadData=async()=>{
    setLoading(true);
    try{
      const[projectsData,userData]=await Promise.all([
        api(`/users/${customerId}/projects`) as any,
        api(`/users/${customerId}`) as any
      ]);
      setProjects((projectsData as OpeningProject[]).filter(p => !p.deletedAt));
      setUser(userData);
    }catch(e){
      console.error(e);
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    loadData();
  },[customerId]);

  const runTransitionProject=async(id:string,action:'process'|'complete')=>{
    setActingId(id);
    try{
      await api(`/projects/${id}/${action}`,{method:'POST'});
      await loadData();
    }catch(e){
      console.error(e);
    }finally{
      setActingId(null);
    }
  };

  const handleActionProject=(id:string,action:'process'|'complete',e:React.MouseEvent)=>{
    e.stopPropagation();
    if(action==='complete'){
      setConfirming({id,action});
    }else{
      runTransitionProject(id,action);
    }
  };

  if(loading)return<Spin size="large"style={{display:'block',margin:'100px auto'}}/>;

  return(
    <div>
      <div style={{marginBottom:24}}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined/>} 
          onClick={onBack}
          style={{padding:0,marginBottom:16}}
        >
          返回项目列表
        </Button>
        
        {user&&(
          <Card size="small">
            <Space size="large">
              <Avatar size={48}>{user.name[0]}</Avatar>
              <div>
                <Title level={4} style={{margin:0}}>{user.name}</Title>
                <Space style={{marginTop:4}}>
                  <Text type="secondary"><EnvironmentOutlined/> {user.city}</Text>
                  <Text type="secondary">|</Text>
                  <Text type="secondary">{user.identity==='investor'?'投资人':user.identity==='therapist'?'康复师创业者':user.identity}</Text>
                  <Text type="secondary">|</Text>
                  <Text type="secondary"><CalendarOutlined/> {new Date(user.createdAt).toLocaleDateString('zh-CN')}</Text>
                </Space>
              </div>
            </Space>
          </Card>
        )}
      </div>

      <div style={{marginBottom:16}}>
        <Title level={4} style={{margin:0}}>项目列表（{projects.length}）</Title>
      </div>

      {projects.length===0?(
        <Empty description="暂无项目"/>
      ):(
        <Row gutter={[16,16]}>
          {projects.map(p=>{
            const statusTag=getProjectStatusTag(p);
            const currentStatus=normalizeProjectStatus(p.status);
            return(
              <Col xs={24} sm={12} lg={8} key={p.id}>
                <Card 
                  hoverable
                  onClick={()=>onOpenProject(p)}
                  style={{height:'100%'}}
                >
                  <div style={{marginBottom:12}}>
                    <Tag color={statusTag.color}>{statusTag.text}</Tag>
                  </div>
                  <div style={{marginBottom:16}}>
                    <Space size="small">
                      <EnvironmentOutlined/>
                      <Text strong>{p.city}</Text>
                      <Text type="secondary">·</Text>
                      <Text>{p.venueTypeName||'待定位'}</Text>
                    </Space>
                  </div>
                  <div style={{marginBottom:16}}>
                    <Text style={{fontSize:24,fontWeight:600}}>{p.area}</Text>
                    <Text type="secondary">㎡</Text>
                    <Text style={{marginLeft:16,fontSize:24,fontWeight:600}}>{Math.round(p.budget/10000)}</Text>
                    <Text type="secondary">万</Text>
                  </div>
                  <div style={{marginBottom:12}}>
                    <Space>
                      <Text type="secondary">专业</Text>
                      <Text strong>{p.capabilityResult.technicalScore}</Text>
                      <Text type="secondary">商业</Text>
                      <Text strong>{p.capabilityResult.commercialScore}</Text>
                    </Space>
                  </div>
                  <div>
                    <Text type="secondary" style={{fontSize:12}}>
                      创建于 {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                    </Text>
                  </div>
                  {canManage&&currentStatus!=='completed'&&(
                    <div style={{marginTop:12}}>
                      {currentStatus==='pending'&&(
                        <Button
                          type="default"
                          size="small"
                          style={{color:'#1e293b'}}
                          loading={actingId===p.id}
                          onClick={e=>handleActionProject(p.id,'process',e)}
                        >
                          开始跟进
                        </Button>
                      )}
                      {currentStatus==='processing'&&(
                        <Button
                          type="default"
                          size="small"
                          style={{color:'#1e293b'}}
                          loading={actingId===p.id}
                          onClick={e=>handleActionProject(p.id,'complete',e)}
                        >
                          标记已完成
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
      <Modal
        title="确定完成该项目？"
        open={!!confirming}
        onOk={async()=>{
          if(confirming){
            await runTransitionProject(confirming.id,confirming.action);
            setConfirming(null);
          }
        }}
        onCancel={()=>setConfirming(null)}
        okText="确定"
        cancelText="取消"
      >
        确认后项目状态将更新为「已完成」。
      </Modal>
    </div>
  );
}
