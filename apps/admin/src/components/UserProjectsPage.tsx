import{useEffect,useState}from'react';
import{Avatar,Button,Card,Space,Spin,Tag,Typography}from'antd';
import{ArrowLeftOutlined,EnvironmentOutlined}from'@ant-design/icons';
import type{OpeningProject,Role,UserAccount}from'@opening/shared';
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

  useEffect(()=>{
    const loadData=async()=>{
      setLoading(true);
      try{
        const[projectsData,userData]=await Promise.all([
          api(`/users/${customerId}/projects`) as any,
          api(`/users/${customerId}`) as any
        ]);
        setProjects(projectsData);
        setUser(userData);
      }catch(e){
        console.error(e);
      }finally{
        setLoading(false);
      }
    };
    loadData();
  },[customerId]);

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
                  <Text type="secondary">{user.phone.replace(/(\d{3})\d{4}(\d{4})/,'$1****$2')}</Text>
                  <Text type="secondary">|</Text>
                  <Text type="secondary">{user.email}</Text>
                </Space>
              </div>
            </Space>
          </Card>
        )}
      </div>

      <Card title="关联开馆项目" className="panel">
        {projects.length===0?(
          <div style={{textAlign:'center',padding:40,color:'#999'}}>暂无项目</div>
        ):(
          <div className="project-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
            {projects.map(p=>{
              const tag=getProjectStatusTag(p);
              return(
                <Card
                  key={p.id}
                  hoverable
                  onClick={()=>onOpenProject(p)}
                  size="small"
                  className="project-card"
                >
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                    <Tag color={tag.color}>{tag.text}</Tag>
                    <Text type="secondary">{p.area}㎡</Text>
                  </div>
                  <Title level={5} style={{margin:'0 0 8px'}}>{p.venueTypeName||'待定位'}</Title>
                  <Space direction="vertical" size={0} style={{width:'100%'}}>
                    <Text type="secondary">{p.city}</Text>
                    <Text type="secondary">预算 {Math.round(p.budget/10000)}万</Text>
                  </Space>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
