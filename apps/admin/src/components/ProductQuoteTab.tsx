import{useState}from'react';
import{Button,Form,Input,InputNumber,Modal,Popconfirm,Space,Table,Tag,Typography,App}from'antd';
import{EditOutlined,DeleteOutlined,PlusOutlined}from'@ant-design/icons';
import type{OpeningProject,Recommendation,Role}from'@opening/shared';
import{api}from'../api';

const{Title,Text}=Typography;

interface ProductQuoteTabProps{
  project:OpeningProject;
  role?:Role;
}

export default function ProductQuoteTab({project,role}:ProductQuoteTabProps){
  const{message}=App.useApp();
  const{quoteSummaries}=project;
  const[recommendations,setRecommendations]=useState<Recommendation[]>(project.recommendations);
  const[eqModalOpen,setEqModalOpen]=useState(false);
  const[editingEq,setEditingEq]=useState<Recommendation|null>(null);
  const[eqForm]=Form.useForm();
  const canEdit=['consultant','admin'].includes(role||'');

  const equipmentList=recommendations.filter(r=>r.kind==='equipment');

  const openAddEq=()=>{
    setEditingEq(null);
    eqForm.setFieldsValue({name:'',quantity:1,unitPrice:0,note:''});
    setEqModalOpen(true);
  };

  const openEditEq=(item:Recommendation)=>{
    setEditingEq(item);
    eqForm.setFieldsValue({name:item.name,quantity:item.quantity,unitPrice:item.unitPrice||0,note:item.note||''});
    setEqModalOpen(true);
  };

  const saveEq=async()=>{
    const v=await eqForm.validateFields();
    let next:Recommendation[];
    if(editingEq){
      next=recommendations.map(r=>r.id===editingEq.id?{...r,...v}:r);
    }else{
      next=[...recommendations,{
        id:`eq-custom-${Date.now()}`,kind:'equipment' as const,name:v.name,
        reason:'',required:false,quantity:v.quantity,unitPrice:v.unitPrice||0,
        note:v.note||'',priority:'recommended' as const
      }];
    }
    setRecommendations(next);
    try{
      await api(`/projects/${project.id}/equipment`,{method:'PATCH',body:JSON.stringify({recommendations:next})});
      message.success(editingEq?'设备已更新':'设备已添加');
      setEqModalOpen(false);
      setEditingEq(null);
      eqForm.resetFields();
    }catch(e){message.error((e as Error).message);}
  };

  const deleteEq=async(id:string)=>{
    const next=recommendations.filter(r=>r.id!==id);
    setRecommendations(next);
    try{
      await api(`/projects/${project.id}/equipment`,{method:'PATCH',body:JSON.stringify({recommendations:next})});
      message.success('设备已删除');
    }catch(e){message.error((e as Error).message);}
  };

  const columns=[
    {
      title:'产品名称',
      dataIndex:'name',
      key:'name',
      render:(text:string,record:Recommendation)=>(
        <div>
          <Text strong>{text}</Text>
          {record.note&&<div><Text type="secondary" style={{fontSize:12}}>{record.note}</Text></div>}
        </div>
      )
    },
    {
      title:'数量',
      dataIndex:'quantity',
      key:'quantity',
      width:80,
      render:(quantity:number)=>`${quantity}台`
    },
    {
      title:'单价',
      dataIndex:'unitPrice',
      key:'unitPrice',
      width:120,
      render:(price:number)=>price?`¥${price.toLocaleString()}`:'—'
    },
    {
      title:'小计',
      key:'subtotal',
      width:120,
      render:(_:any,record:Recommendation)=>{
        if(!record.unitPrice)return'—';
        return`¥${(record.unitPrice*record.quantity).toLocaleString()}`;
      }
    },
    {
      title:'优先级',
      dataIndex:'priority',
      key:'priority',
      width:100,
      render:(priority:string)=>{
        const colorMap:Record<string,string>={
          essential:'red',recommended:'orange',upgrade:'blue',defer:'default'
        };
        const labelMap:Record<string,string>={
          essential:'必需',recommended:'推荐',upgrade:'升级',defer:'暂缓'
        };
        return <Tag color={colorMap[priority]||'default'}>{labelMap[priority]||priority}</Tag>;
      }
    },
    ...(canEdit?[
      {
        title:'操作',
        key:'action',
        width:120,
        render:(_:any,record:Recommendation)=>(
          <Space size="small">
            <Button type="link"size="small"icon={<EditOutlined/>}onClick={()=>openEditEq(record)}>编辑</Button>
            <Popconfirm title="确定删除该设备？"onConfirm={()=>deleteEq(record.id)}>
              <Button type="link"size="small"danger icon={<DeleteOutlined/>}>删除</Button>
            </Popconfirm>
          </Space>
        )
      }
    ]:[])
  ];

  return(
    <div className="product-quote-tab">
      {/* 三档报价汇总 */}
      {quoteSummaries.length>0&&(
        <section className="quote-summary-section">
          <Title level={5}>三档报价汇总</Title>
          <div className="quote-cards">
            {quoteSummaries.map((q,i)=>(
              <div key={q.tier} className={`quote-card ${i===1?'featured':''}`}>
                <Text type="secondary">{q.label}</Text>
                <Title level={4} style={{margin:'8px 0'}}>¥{q.total.toLocaleString()}</Title>
                <Text type="secondary" style={{fontSize:12}}>
                  {q.itemCount}项配置 · {q.inquiryCount}项待询价
                </Text>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 设备报价明细表 */}
      <section className="equipment-table-section">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <Title level={5}style={{margin:0}}>设备报价明细</Title>
          {canEdit&&<Button type="primary"size="small"icon={<PlusOutlined/>}onClick={openAddEq}>新增产品</Button>}
        </div>
        <Table
          dataSource={equipmentList}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          summary={()=>{
            const total=equipmentList.reduce((sum,r)=>{
              const subtotal=r.unitPrice?r.unitPrice*r.quantity:0;
              return sum+subtotal;
            },0);
            return(
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={canEdit?3:3}>
                  <Text strong>合计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <Text strong>¥{total.toLocaleString()}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} colSpan={canEdit?2:1}/>
              </Table.Summary.Row>
            );
          }}
        />
      </section>

      {/* 新增/编辑设备弹窗 */}
      <Modal
        open={eqModalOpen}
        onCancel={()=>{setEqModalOpen(false);setEditingEq(null);eqForm.resetFields();}}
        onOk={saveEq}
        title={editingEq?'编辑设备':'新增设备'}
      >
        <Form form={eqForm}layout="vertical">
          <Form.Item name="name"label="产品名称"rules={[{required:true,message:'请输入产品名称'}]}>
            <Input placeholder="如：三段式电动手法PT床"/>
          </Form.Item>
          <Form.Item name="quantity"label="数量"rules={[{required:true,message:'请输入数量'}]}>
            <InputNumber min={1}precision={0}style={{width:'100%'}}/>
          </Form.Item>
          <Form.Item name="unitPrice"label="单价（元）">
            <InputNumber min={0}precision={0}style={{width:'100%'}}/>
          </Form.Item>
          <Form.Item name="note"label="备注">
            <Input.TextArea rows={2}placeholder="规格、型号等备注信息"/>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
