import{Tag,Typography}from'antd';
const{Title,Text}=Typography;
import type{OpeningProject}from'@opening/shared';
import{quadrantMeta,prototypeMeta}from'@opening/shared';

interface ReportViewProps{
  project:OpeningProject;
}

export default function ReportView({project}:ReportViewProps){
  const p=project;
  const meta=quadrantMeta[p.quadrant];
  const primary=prototypeMeta[p.prototype.primary];
  const alt=prototypeMeta[p.prototype.alternative];

  return(
    <div className="report-view">
      {/* 覆盖区 */}
      <section className="report-cover">
        <div className="report-cover-content">
          <div className="quadrant-info">
            <span className="kicker">{meta.name}</span>
            <Title level={2}>{primary.name}</Title>
            <Text type="secondary">{p.founderRole==='investor'?'投资人＋技术团队模式':'康复师创业模式'} · 计划投入 {Math.round(p.budget/10000)} 万元</Text>
            <div className="result-tags">
              <span>{p.founderRole==='investor'?'团队专业':'本人专业'} {p.capabilityResult.technicalScore}</span>
              <span>经营 {p.capabilityResult.commercialScore}</span>
              <span>准备度 {p.readinessScore}</span>
            </div>
          </div>
          <div className="quadrant-chart">
            <QuadrantView p={p}/>
          </div>
        </div>
      </section>

      {/* 诊断结果 */}
      <section className="report-section">
        <Title level={4}>诊断结果</Title>
        <div className="diagnosis-grid">
          <div className="diagnosis-card">
            <Text type="secondary">首选定位</Text>
            <Title level={5}>{meta.name} / {primary.name}</Title>
            <Text>{p.prototype.primaryReason}</Text>
          </div>
          <div className="diagnosis-card">
            <Text type="secondary">备选原型</Text>
            <Title level={5}>{alt.name}</Title>
            <Text>{p.prototype.alternativeReason}</Text>
          </div>
          <div className="diagnosis-card">
            <Text type="secondary">升级重点</Text>
            <Title level={5}>{p.capabilityResult.gaps.join('、')||'继续标准化'}</Title>
            <Text>{meta.upgrade}</Text>
          </div>
        </div>
      </section>

      {/* 三档报价摘要 */}
      <section className="report-section">
        <Title level={4}>三档设备报价</Title>
        <div className="quote-summary">
          {p.quoteSummaries.map((q,i)=>(
            <div key={q.tier} className={`quote-card ${i===1?'featured':''}`}>
              <Text type="secondary">{q.label}</Text>
              <Title level={3}>¥{q.total.toLocaleString()}</Title>
              <Text type="secondary">{q.itemCount} 项配置 · {q.inquiryCount} 项待询价</Text>
            </div>
          ))}
        </div>
      </section>

      {/* 盈亏平衡看板 */}
      {p.breakEven&&(
        <section className="report-section">
          <Title level={4}>盈亏平衡分析</Title>
          <BreakEvenView p={p}/>
        </section>
      )}

      {/* 开业甘特图 */}
      {p.openingTasks&&p.openingTasks.length>0&&(
        <section className="report-section">
          <Title level={4}>60天开业甘特图</Title>
          <GanttView p={p}/>
        </section>
      )}

      {/* 装修方案 */}
      {p.renovation&&p.renovation.zoneRatios.length>0&&(
        <section className="report-section">
          <Title level={4}>装修方案</Title>
          <RenovationView p={p}/>
        </section>
      )}

      {/* 证照清单 */}
      {p.licenses&&p.licenses.length>0&&(
        <section className="report-section">
          <Title level={4}>证照清单</Title>
          <LicenseView p={p}/>
        </section>
      )}

      {/* 招聘计划 */}
      {p.staffing&&p.staffing.length>0&&(
        <section className="report-section">
          <Title level={4}>招聘计划</Title>
          <JobView p={p}/>
        </section>
      )}
    </div>
  );
}

function QuadrantView({p}:{p:OpeningProject}){
  return(
    <div className="quadrant-simple">
      <div className="q-label tl">专家型</div>
      <div className="q-label tr">系统型</div>
      <div className="q-label bl">起步型</div>
      <div className="q-label br">流量增长型</div>
      <span 
        className="q-point" 
        style={{
          left:`${8+p.capabilityResult.commercialScore*.84}%`,
          bottom:`${8+p.capabilityResult.technicalScore*.84}%`
        }}
      >
        <b>{p.customerName[0]}</b>
      </span>
      <i className="x">商业能力 →</i>
      <i className="y">专业能力 →</i>
    </div>
  );
}

function BreakEvenView({p}:{p:OpeningProject}){
  const b=p.breakEven!;
  return(
    <div className="be-board">
      <section className="be-hero">
        <Text type="secondary">月度盈亏平衡点</Text>
        <Title level={3}>¥{b.breakEvenRevenue.toLocaleString()}</Title>
        <Text type="secondary">安全营业额 ¥{b.safetyRevenue.toLocaleString()}</Text>
        <Text type="secondary">贡献毛利率 {(b.contributionMarginRate*100).toFixed(1)}%</Text>
      </section>
      <section className="be-costs">
        <Title level={5}>每月固定成本</Title>
        {[
          ['人员基础工资',b.staffCost],
          ['房租/场地占用',b.occupancyCost],
          ['水电网络',b.utilitiesCost],
          ['软件行政',b.adminCost],
          ['设备折旧',b.depreciationCost]
        ].map(([n,v])=>(
          <div key={String(n)} className="cost-row">
            <Text>{n}</Text>
            <Text strong>¥{Number(v).toLocaleString()}</Text>
          </div>
        ))}
        <div className="cost-row total">
          <Text strong>合计</Text>
          <Text strong>¥{b.monthlyFixedCost.toLocaleString()}</Text>
        </div>
      </section>
    </div>
  );
}

function GanttView({p}:{p:OpeningProject}){
  return(
    <div className="gantt-simple">
      <div className="gantt-axis">
        <span>D-60</span>
        <span>D-45</span>
        <span>D-30</span>
        <span>D-15</span>
        <span>开业日</span>
      </div>
      {(p.openingTasks||[]).map(t=>(
        <div className="gantt-row" key={t.id}>
          <div className="gantt-task">
            <Text type="secondary">{t.stage}</Text>
            <Text strong>{t.title}</Text>
          </div>
          <div className="gantt-bar">
            <div 
              className="gantt-bar-inner"
              style={{
                left:`${Math.max(0,(t.startDay+60)/60*100)}%`,
                width:`${Math.max(2,(t.endDay-t.startDay+1)/60*100)}%`
              }}
            >
              {t.startDay===0?'D0':`D${t.startDay}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RenovationView({p}:{p:OpeningProject}){
  let cursor=0;
  return(
    <div className="renovation-simple">
      <div className="zone-chart">
        {p.renovation.zoneRatios.map((z,i)=>{
          const x=cursor;
          cursor+=z.percent*6;
          return(
            <div 
              key={z.zone} 
              className="zone-bar"
              style={{
                left:`${x}px`,
                width:`${z.percent*6}px`,
                backgroundColor:['#d7e7df','#b8d5c8','#7fb6a5','#315c83','#e8a47f'][i%5]
              }}
            >
              <Text style={{color:i===3?'white':'#173630'}}>{z.zone}</Text>
              <Text style={{color:i===3?'white':'#173630'}}>{z.percent}%</Text>
            </div>
          );
        })}
      </div>
      <div className="circulation">
        <Text type="secondary">客户主服务动线</Text>
      </div>
    </div>
  );
}

function LicenseView({p}:{p:OpeningProject}){
  return(
    <div className="license-list">
      {p.licenses.map(x=>(
        <div key={x.id} className="license-item">
          <Tag color={x.status==='verify'?'orange':'default'}>
            {x.status==='verify'?'属地核验':'待办理'}
          </Tag>
          <div className="license-content">
            <Text strong>{x.name}</Text>
            <Text type="secondary">时间：{x.timing} · 负责人：{x.owner}</Text>
            <Text type="secondary">材料：{x.materials}</Text>
          </div>
        </div>
      ))}
    </div>
  );
}

function JobView({p}:{p:OpeningProject}){
  return(
    <div className="job-list">
      {p.staffing.map(x=>(
        <div key={x.id} className="job-item">
          <div className="job-header">
            <Text strong>{x.name}</Text>
            <Text type="secondary">{x.count||'储备'}人</Text>
            <Text type="secondary">{x.monthlySalary?`¥${x.monthlySalary.toLocaleString()}/月`:'兼任/储备'}</Text>
          </div>
          <div className="job-detail">
            <Text type="secondary">岗位任务：{x.responsibilities}</Text>
            {x.kpis&&x.kpis.length>0&&(
              <Text type="secondary">考核指标：{x.kpis.join('、')}</Text>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
