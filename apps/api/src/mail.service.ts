import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtpdm.aliyun.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    if (process.env.SMTP_USER) {
      this.transporter.verify().catch((err) => {
        this.logger.warn(`SMTP 连接预热失败: ${err.message}`);
      });
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const appName = '运动康复馆开馆助手';

    const html = `
      <div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #0891b2; border-radius: 12px; line-height: 48px; font-size: 24px; color: white; font-weight: bold;">衡</div>
        </div>
        <h2 style="color: #164e63; font-size: 20px; text-align: center; margin-bottom: 24px;">邮箱验证码</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.8; margin-bottom: 24px;">
          你正在注册 <strong>${appName}</strong>，以下是你的验证码：
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: bold; color: #0891b2; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.6;">
          验证码 5 分钟内有效，请勿泄露给他人。<br/>
          如果这不是你的操作，请忽略此邮件。
        </p>
        <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 16px; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px;">© ${new Date().getFullYear()} ${appName}</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${from}>`,
        to: email,
        subject: `【${appName}】邮箱验证码 - ${code}`,
        html,
      });
      this.logger.log(`验证码邮件已发送至 ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(`邮件发送失败: ${error.message}`);
      throw error;
    }
  }
}
