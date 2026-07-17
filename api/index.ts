import 'reflect-metadata';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';

const server=express();
const ready=NestFactory.create(AppModule,new ExpressAdapter(server),{logger:['error','warn']}).then(async app=>{
  app.enableCors({origin:true,exposedHeaders:['content-disposition']});
  app.setGlobalPrefix('api');
  await app.init();
  return server;
});

export default async function handler(req:any,res:any){
  const app=await ready;
  return app(req,res);
}
