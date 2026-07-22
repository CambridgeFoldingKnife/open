import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { CatalogItem, FollowUp, Lead, OpeningProject, Recommendation, ServiceOffering, UserAccount, VenueType } from '@opening/shared';
import { createToken, CurrentActor, Roles, RolesGuard, type Actor } from './auth';
import { StoreService } from './store.service';
import { ExcelService } from './excel.service';

@Controller()
@UseGuards(RolesGuard)
export class AppController {
  constructor(private store:StoreService,private excel:ExcelService){}
  @Get('health') health(){return {ok:true};}
  @Post('auth/send-code') sendCode(@Body('phone') phone:string){return this.store.sendCode(phone);}
  @Post('auth/send-email-code') async sendEmailCode(@Body('email') email:string){return this.store.sendEmailCode(email);}
  @Post('auth/register') register(@Body() body:Partial<UserAccount>&{code:string}){const user=this.store.register(body);return{user,token:createToken({id:user.id,role:'customer'})};}
  @Post('auth/register-email') registerByEmail(@Body() body:Partial<UserAccount>&{code:string;password:string;ref?:string}){const user=this.store.registerByEmail(body);return{user,token:createToken({id:user.id,role:'customer'})};}
  @Post('auth/login-email-code') loginByEmailCode(@Body('email') email:string,@Body('code') code:string){const user=this.store.loginByEmailCode(email,code);return{user,token:createToken({id:user.id,role:'customer'})};}
  @Post('auth/login-email-password') loginByEmailPassword(@Body('email') email:string,@Body('password') password:string){const user=this.store.loginByEmailPassword(email,password);return{user,token:createToken({id:user.id,role:'customer'})};}
  @Post('auth/set-password') @Roles('customer') async setPassword(@CurrentActor() actor:Actor,@Body('password') password:string){return this.store.setEmailPassword(actor,password);}
  @Get('auth/me') @Roles('customer') me(@CurrentActor() actor:Actor){return this.store.user(actor);}
  @Post('auth/staff/login') staffLogin(@Body('email') email:string,@Body('password') password:string){const s=this.store.staffLogin(email,password);return{staff:s,token:createToken({id:s.id,role:s.role})};}
  @Get('auth/staff/me') staffMe(@CurrentActor() actor:Actor){return this.store.staffMe(actor);}
  @Get('bootstrap') bootstrap(@CurrentActor() actor:Actor){return {venues:this.store.venues.filter(v=>v.active),projects:this.store.list(actor),status:'ready'};}
  @Get('projects') projects(@CurrentActor() actor:Actor,@Query('q') q=''){return this.store.list(actor,q);}
  @Get('projects/:id') project(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.get(id,actor);}
  @Post('projects/preview') @Roles('customer') preview(@CurrentActor() actor:Actor,@Body() body:Partial<OpeningProject>){return this.store.preview({...body,customerId:actor.id});}
  @Post('projects/draft') @Roles('customer') draft(@CurrentActor() actor:Actor,@Body() body:Partial<OpeningProject>){return this.store.saveDraft(actor,body);}
  @Patch('projects/:id/plan') @Roles('consultant','admin') plan(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:Partial<OpeningProject>){return this.store.updatePlan(id,actor,body);}
  @Post('projects/:id/services') @Roles('customer','consultant','admin') services(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:{services:ServiceOffering[]}){return this.store.updateServices(id,actor,body.services);}
  @Patch('projects/:id/equipment') @Roles('consultant','admin') updateEquipment(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:{recommendations:Recommendation[]}){return this.store.updateEquipment(id,actor,body.recommendations);}

  @Post('projects/:id/process') @Roles('consultant','admin') process(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.transition(id,actor,'processing');}
  @Post('projects/:id/complete') @Roles('consultant','admin') complete(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.transition(id,actor,'completed');}
  @Get('projects/:id/export') @Roles('customer','consultant','admin') async export(@CurrentActor() actor:Actor,@Param('id') id:string,@Query('format') format='excel',@Res() res:Response){const p=this.store.get(id,actor);if(p.status==='pending'&&actor.role==='customer')return res.status(403).json({message:'顾问介入后才可下载'});if(format==='pdf'){const data=await this.excel.generatePdf(p);res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="opening-plan-${p.id}.pdf"`);return res.send(data);}if(format==='md'){const data=this.excel.generateMd(p);res.setHeader('Content-Type','text/markdown; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="opening-plan-${p.id}.md"`);return res.send(data);}const data=await this.excel.generate(p);res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition',`attachment; filename="opening-plan-${p.id}.xlsx"`);res.send(data);}
  @Get('catalog') @Roles('consultant','admin') catalog(){return this.store.catalog;}
  @Post('catalog') @Roles('admin') saveCatalog(@CurrentActor() actor:Actor,@Body() item:CatalogItem){return this.store.upsertCatalog(actor,item);}
  @Post('venues') @Roles('admin') saveVenue(@CurrentActor() actor:Actor,@Body() item:VenueType){return this.store.upsertVenue(actor,item);}
  @Get('audit/:projectId') @Roles('consultant','admin') audit(@Param('projectId') id:string){return this.store.audits.filter(a=>a.projectId===id);}
  @Get('leads') @Roles('consultant','admin') leads(@CurrentActor() actor:Actor,@Query('q') q=''){return this.store.listLeads(actor,q);}
  /** @deprecated 分配顾问功能已移除，保留接口兼容性 */
  @Post('leads/:id/assign') @Roles('admin') assignLead(@CurrentActor() actor:Actor,@Param('id') id:string,@Body('consultantId') consultantId:string){return this.store.assignLead(id,actor,consultantId);}
  @Patch('leads/:id') @Roles('consultant','admin') updateLead(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:Partial<Lead>){return this.store.updateLead(id,actor,body);}
  @Get('leads/:id/follow-ups') @Roles('consultant','admin') followUps(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.leadFollowUps(id,actor);}
  @Post('leads/:id/follow-ups') @Roles('consultant','admin') addFollowUp(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:Pick<FollowUp,'channel'|'note'|'nextAt'>){return this.store.addFollowUp(id,actor,body);}
  @Delete('projects/:id') @Roles('customer','admin') deleteProject(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.softDeleteProject(id,actor);}
  @Get('users') @Roles('consultant','admin') listUsers(@CurrentActor() actor:Actor,@Query('q') q=''){return this.store.listUsers(actor,q);}
  @Get('users/:id') @Roles('admin','consultant') getUser(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.getUser(actor,id);}
  @Patch('users/:id') @Roles('admin') updateUser(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:Partial<UserAccount>){return this.store.updateUser(actor,id,body);}
  @Patch('users/me/profile') @Roles('customer') updateMyProfile(@CurrentActor() actor:Actor,@Body() body:Partial<UserAccount>){return this.store.updateMyProfile(actor,body);}
  @Get('users/:id/projects') @Roles('admin','consultant') getUserProjects(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.getUserProjects(actor,id);}
  @Get('staff') @Roles('admin') listStaff(@CurrentActor() actor:Actor){return this.store.listStaff(actor);}
  @Post('staff') @Roles('admin') createStaff(@CurrentActor() actor:Actor,@Body() body:{email:string;password:string;name:string;role:'admin'|'consultant';title:string;phone:string}){return this.store.createStaff(actor,body);}
  @Patch('staff/:id') @Roles('admin') updateStaff(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() body:Partial<import('@opening/shared').StaffAccount>){return this.store.updateStaff(actor,id,body);}
  @Post('staff/:id/toggle-active') @Roles('admin') toggleStaff(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.toggleStaffActive(actor,id);}
  @Put('catalog/:id') @Roles('admin') updateCatalog(@CurrentActor() actor:Actor,@Param('id') id:string,@Body() item:CatalogItem){return this.store.upsertCatalog(actor,{...item,id});}
  @Delete('catalog/:id') @Roles('admin') deleteCatalog(@CurrentActor() actor:Actor,@Param('id') id:string){return this.store.deleteCatalog(actor,id);}
  @Get('stats') @Roles('admin') stats(@CurrentActor() actor:Actor,@Query('start') start?:string,@Query('end') end?:string){return this.store.getStats(actor,{start,end});}
}
