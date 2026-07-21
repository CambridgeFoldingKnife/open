import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHmac, timingSafeEqual, randomBytes, scryptSync } from 'node:crypto';
import type { Role } from '@opening/shared';

export interface Actor { id:string; role:Role; }
export const Roles=(...roles:Role[])=>SetMetadata('roles',roles);
const secret=()=>process.env.AUTH_SECRET||'opening-assistant-local-secret';
export function createToken(actor:Actor){const payload=Buffer.from(JSON.stringify({...actor,exp:Date.now()+30*24*3600_000})).toString('base64url');const sig=createHmac('sha256',secret()).update(payload).digest('base64url');return`${payload}.${sig}`;}
export function actorFromRequest(req:any):Actor{const auth=String(req.headers.authorization||'');if(auth.startsWith('Bearer ')){const [payload,sig]=auth.slice(7).split('.');if(payload&&sig){const expected=createHmac('sha256',secret()).update(payload).digest();const actual=Buffer.from(sig,'base64url');if(actual.length===expected.length&&timingSafeEqual(actual,expected)){const data=JSON.parse(Buffer.from(payload,'base64url').toString());if(data.exp>Date.now())return{id:data.id,role:data.role};}}}throw new ForbiddenException('请先登录');}
export const CurrentActor=createParamDecorator((_data,ctx):Actor=>actorFromRequest(ctx.switchToHttp().getRequest()));
@Injectable()export class RolesGuard implements CanActivate{constructor(private reflector:Reflector){}canActivate(context:ExecutionContext){const allowed=this.reflector.getAllAndOverride<Role[]>('roles',[context.getHandler(),context.getClass()]);if(!allowed?.length)return true;const role=actorFromRequest(context.switchToHttp().getRequest()).role;if(!allowed.includes(role))throw new ForbiddenException('当前身份无权执行此操作');return true;}}

export function hashPassword(password:string):string{const salt=randomBytes(16).toString('hex');const hash=scryptSync(password,salt,64).toString('hex');return`$scrypt$${salt}$${hash}`;}
export function verifyPassword(password:string,stored:string):boolean{if(!stored.startsWith('$scrypt$'))return false;const parts=stored.split('$');if(parts.length!==4)return false;const salt=parts[2];const hash=parts[3];const verify=scryptSync(password,salt,64).toString('hex');return timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(verify,'hex'));}
