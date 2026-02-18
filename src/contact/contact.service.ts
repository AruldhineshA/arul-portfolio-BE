import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Contact } from './contact.schema';
import { CreateContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async create(createContactDto: CreateContactDto): Promise<{ message: string }> {
    // Save to MongoDB
    const contact = new this.contactModel(createContactDto);
    await contact.save();

    // Send email notification
    try {
      await this.transporter.sendMail({
        from: `"Portfolio Contact" <${this.configService.get('MAIL_USER')}>`,
        to: this.configService.get('MAIL_USER'),
        subject: `New Portfolio Message from ${createContactDto.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            <div style="margin: 20px 0;">
              <p><strong>Name:</strong> ${createContactDto.name}</p>
              <p><strong>Email:</strong> ${createContactDto.email}</p>
              <p><strong>Message:</strong></p>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                ${createContactDto.message}
              </div>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0;" />
            <p style="color: #94a3b8; font-size: 12px;">Sent from your Portfolio website</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Email sending failed:', error.message);
    }

    return { message: 'Message sent successfully!' };
  }
}
