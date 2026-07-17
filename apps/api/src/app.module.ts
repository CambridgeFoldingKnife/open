import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { RolesGuard } from './auth';
import { ExcelService } from './excel.service';
import { MailService } from './mail.service';
import { RulesService } from './rules.service';
import { StoreService } from './store.service';
@Module({controllers:[AppController],providers:[StoreService,RulesService,ExcelService,MailService,{provide:APP_GUARD,useClass:RolesGuard}]})
export class AppModule{}
