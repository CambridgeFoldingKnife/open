import type{Role}from'@opening/shared';
const base=import.meta.env.VITE_API_URL||'';let role:Role=(localStorage.getItem('role')as Role)||'admin';
export const setRole=(r:Role)=>{role=r;localStorage.setItem('role',r)};
const actorId=()=>role==='consultant'?'consultant-1':role==='sales'?'sales-1':'admin-1';
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{const res=await fetch(`${base}/api${path}`,{...options,headers:{'content-type':'application/json','x-role':role,'x-user-id':actorId(),...(options.headers||{})}});if(!res.ok){const e=await res.json().catch(()=>({message:'请求失败'}));throw new Error(e.message||'请求失败')}return res.json()}
export async function downloadExcel(id:string){const res=await fetch(`${base}/api/projects/${id}/export`,{headers:{'x-role':role,'x-user-id':actorId()}});if(!res.ok)throw new Error('下载失败');const blob=await res.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`开馆方案-${id}.xlsx`;a.click();URL.revokeObjectURL(url)}
