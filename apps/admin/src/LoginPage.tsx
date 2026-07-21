import{useState}from'react';
import{App as AntApp,Button,Card,Form,Input,Typography}from'antd';
import{LockOutlined,MailOutlined}from'@ant-design/icons';
import{api,setToken}from'./api';
import type{StaffAccount}from'@opening/shared';
const{Title,Text}=Typography;

interface Props{onLogin:(staff:StaffAccount)=>void;}
export default function LoginPage({onLogin}:Props){
  const{message}=AntApp.useApp();
  const[loading,setLoading]=useState(false);
  const onFinish=async(values:{email:string;password:string})=>{
    setLoading(true);
    try{
      const{staff,token}=await api('/auth/staff/login',{method:'POST',body:JSON.stringify(values)}) as any;
      setToken(token);
      onLogin(staff);
    }catch(e){message.error((e as Error).message);}
    finally{setLoading(false);}
  };
  return(
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#f0f2f5'}}>
      <Card style={{width:400,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:16,background:'#1d7664',color:'#fff',fontSize:28,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>衡</div>
          <Title level={3} style={{margin:0}}>开馆助手</Title>
          <Text type="secondary">REHAB OPENING OS · 工作台登录</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="email" rules={[{required:true,message:'请输入邮箱'},{type:'email',message:'邮箱格式不正确'}]}>
            <Input prefix={<MailOutlined/>} placeholder="登录邮箱" size="large"/>
          </Form.Item>
          <Form.Item name="password" rules={[{required:true,message:'请输入密码'}]}>
            <Input.Password prefix={<LockOutlined/>} placeholder="密码" size="large"/>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">登 录</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
