import Taro from'@tarojs/taro';const base='http://localhost:3000/api';
export async function api<T>(path:string,method:'GET'|'POST'='GET',data?:unknown):Promise<T>{const res=await Taro.request({url:base+path,method,data,header:{'x-role':'customer','x-user-id':'customer-1'}});if(res.statusCode>=400)throw new Error((res.data as any).message||'请求失败');return res.data as T}
