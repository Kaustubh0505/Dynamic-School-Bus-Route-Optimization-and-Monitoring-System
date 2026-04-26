import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class MailService {
  private transporter;

  constructor() {
    console.log(`[MailService] Initializing with user: ${process.env.SMTP_USER || 'UNDEFINED'}`);
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"School Bus System" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log('Message sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendBoardingNotification(parentEmail: string, studentName: string, status: string) {
    const subject = `School Bus Update: ${studentName} has ${status === 'BOARDED' ? 'Boarded' : 'not boarded'}`;
    const text = `Hello, your student ${studentName} has been marked as ${status} for today's bus route.`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4f46e5;">Bus Boarding Update</h2>
        <p>Hello,</p>
        <p>This is to inform you that your student, <strong>${studentName}</strong>, has been marked as <strong>${status === 'BOARDED' ? 'BOARDED' : 'NOT BOARDED'}</strong> for today's school bus route.</p>
        <p>You can track the live bus location in your Parent Portal.</p>
        <br/>
        <p style="font-size: 12px; color: #666;">This is an automated message from the Dynamic School Bus System.</p>
      </div>
    `;

    return this.sendEmail(parentEmail, subject, text, html);
  }
}

export const mailService = new MailService();
