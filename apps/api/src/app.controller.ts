import { Body, Controller, Get, Header, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { CatalogItem, Lead, OpeningProject, SalesFollowUp, ServiceOffering, UserAccount, VenueType } from '@opening/shared';
import { createToken, CurrentActor, Roles, RolesGuard, type Actor } from './auth';
import { StoreService } from './store.service';
import { ExcelService } from './excel.service';

@Controller()
@UseGuards(RolesGuard)
export class AppController {
  constructor(private store:StoreService,private excel:ExcelService){}
  @Get('health') health(){return {ok:true,mode:process.env.DATABASE_URL?'postgres':'demo'};}
  @Post('auth/send-code') sendCode(@Body('phone') phone:string){return this.store.sendCode(phone);}
  @Post('auth/send-email-code') async sendEmailCode(@Body('email') email:string){return this.store.sendEmailCode(email);}
  @Post('auth/register') register(@Body() body:Partial<UserAccount>&{code:string}){const user=this.store.register(body);return{user,token:createToken({id:user.id,role:'customer'})};}
  @Post('auth/register-email') registerByEmail(@Body() body:Partial<UserAccount>&{code:string;password:string}){const user=this.store.registerByEmail(body);return{user,token:createToken({id:user.id,role:'customer'})};}
  @Post('auth/login-email-code') loginByEmailCode(@Body('email') email:string,@Body('code') code:string){const user=this.store.loginByEmailCode(email,code);return{user,token:createToken({id:user.id,role:'customer'})};}
  @Post('auth/login-email-password') loginByEmailPassword(@Body('email') email:string,@Body('password') password:string){const user=this.store.loginByEmailPassword(email,password);return{user,token:createToken({id:user.id,role:'customer'})};}
  @Post('auth/set-password') @Roles('customer') async setPassword(@CurrentActor() actor:Actor,@Body('password') password:string){return this.store.setEmailPassword(actor,password);}
  @Get('auth/me') @Roles('customer') me(@CurrentActor() actor:Actor){return this.store.user(actor);}
  @Get('bootstrap') bootstrap(@CurrentActor() actor:Actor){return {venues:this.store.venues.filter(v=>v.active),projects:this.store.list(actor),status:'ready'};}
  @Get('projects') projects(@CurrentActor() actor:Actor,@Query('q') q=''){return this.store.list(actor,q);}
  @Get('projects/:id') project(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.get(id,actor);}
  @Post('projects/draft') @Roles('customer') draft(@CurrentActor() actor:Actor,@Body() body:Partial<OpeningProject>){return this.store.saveDraft(actor,body);}
  @Post('projects/:id/submit') @Roles('customer') submit(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.transition(id,actor,'submitted');}
  @Post('projects/:id/assign') @Roles('admin') assign(@CurrentActor() actor:Actor,@Param('id') id:string,@Body('consultantId') consultantId:string){return this.store.assign(id,actor,consultantId);}
  @Patch('projects/:id/plan') @Roles('consultant','admin') plan(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:Partial<OpeningProject>){return this.store.updatePlan(id,actor,body);}
  @Post('projects/:id/services') @Roles('customer','consultant','admin') services(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:{services:ServiceOffering[]}){return this.store.updateServices(id,actor,body.services);}
  @Post('projects/:id/review') @Roles('consultant','admin') review(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.transition(id,actor,'review');}
  @Post('projects/:id/return') @Roles('admin') returnPlan(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.transition(id,actor,'planning','管理员退回修改');}
  @Post('projects/:id/publish') @Roles('admin') publish(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.transition(id,actor,'published');}
  @Post('projects/:id/confirm-foundation') @Roles('customer','admin') confirmFoundation(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.transition(id,actor,'foundation_confirmed');}
  @Post('projects/:id/activate-growth') @Roles('customer','admin') activateGrowth(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.transition(id,actor,'growth_active');}
  @Get('projects/:id/export') @Roles('customer','sales','consultant','admin') async export(@CurrentActor() actor:Actor,@Param('id') id:string,@Res() res:Response){const p=this.store.get(id,actor);if(!['published','foundation_confirmed','growth_active'].includes(p.status)&&actor.role==='customer')return res.status(403).json({message:'方案发布后才可下载'});const data=await this.excel.generate(p);res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition',`attachment; filename="opening-plan-${p.id}.xlsx"`);res.send(data);}
  @Get('catalog') @Roles('consultant','admin') catalog(){return this.store.catalog;}
  @Post('catalog') @Roles('admin') saveCatalog(@CurrentActor() actor:Actor,@Body() item:CatalogItem){return this.store.upsertCatalog(actor,item);}
  @Post('venues') @Roles('admin') saveVenue(@CurrentActor() actor:Actor,@Body() item:VenueType){return this.store.upsertVenue(actor,item);}
  @Get('audit/:projectId') @Roles('consultant','admin') audit(@Param('projectId') id:string){return this.store.audits.filter(a=>a.projectId===id);}
  @Get('leads') @Roles('sales','admin') leads(@CurrentActor() actor:Actor,@Query('q') q=''){return this.store.listLeads(actor,q);}
  @Post('leads/:id/assign') @Roles('admin') assignLead(@CurrentActor() actor:Actor,@Param('id') id:string,@Body('salesId') salesId:string){return this.store.assignLead(id,actor,salesId);}
  @Patch('leads/:id') @Roles('sales','admin') updateLead(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:Partial<Lead>){return this.store.updateLead(id,actor,body);}
  @Get('leads/:id/follow-ups') @Roles('sales','admin') followUps(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.leadFollowUps(id,actor);}
  @Post('leads/:id/follow-ups') @Roles('sales','admin') addFollowUp(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:Pick<SalesFollowUp,'channel'|'note'|'nextAt'>){return this.store.addFollowUp(id,actor,body);}
}
