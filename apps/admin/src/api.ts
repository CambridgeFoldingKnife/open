const base=import.meta.env.VITE_API_URL||'';
let token:string=localStorage.getItem('staff_token')||'';
export const setToken=(t:string)=>{token=t;localStorage.setItem('staff_token',t)};
export const getToken=()=>token;
export const clearToken=()=>{token='';localStorage.removeItem('staff_token');localStorage.removeItem('staff_info')};

function authHeaders():Record<string,string>{return token?{'Authorization':'Bearer '+token}:{};}

export async function api(path:string,options:RequestInit={}):Promise<any>{
  const res=await fetch(base+'/api'+path,{
    ...options,
    headers:{'content-type':'application/json',...authHeaders(),...(options.headers||{})}
  });
  if(!res.ok){const e=await res.json().catch(()=>({message:'请求失败'}));throw new Error(e.message||'请求失败');}
  return res.json();
}


