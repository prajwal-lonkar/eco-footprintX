import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { EmailModuleOptions } from './sendgrid.types';
import { OtpSessionRepository } from 'src/modules/user/repositories/otpSessions.repository';
import { BaseError } from 'src/shared/errorResponse/base.error.response';
import { VerifyEmailDto } from 'src/modules/user/dto/verify-email.dto';
import { SendEmailDto } from 'src/modules/user/dto/send-email-otp.dto';
import { UserRepository } from 'src/modules/user/repositories/user.repository';
import { EmailConstants } from 'src/shared/constants/email.constants';
import { JwtService } from '@nestjs/jwt';
import { ResetSessionsRepository } from 'src/modules/user/repositories/resetSessions.repository';
import {
  ResetLinkCooldownError,
  UserNotFoundError,
} from 'src/shared/errorResponse/user.errors';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly options: EmailModuleOptions,
    private readonly otpSessionRepo: OtpSessionRepository,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly resetSessionsRepo: ResetSessionsRepository,
  ) {
    sgMail.setApiKey(options.apiKey);
  }

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async sendEmail(sendEmailDto: SendEmailDto, componentDetails?: any) {
    let userRecord;
    if (sendEmailDto.emailType != 'supplierPlatformInvite') {
      // 1. Check if user exists
      userRecord = await this.userRepository.findOne({
        email: sendEmailDto.toEmail,
      });
      if (!userRecord) throw new UserNotFoundError();
    }

    let msg;
    // Sending onboarding OTP email.
    if (sendEmailDto.emailType == 'register') {
      const otp = this.generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

      // Find if user email record exist
      const record = await this.otpSessionRepo.findOne({
        email: sendEmailDto.toEmail,
      });

      if (!record) {
        const otpData = {
          email: sendEmailDto.toEmail,
          otpCode: otp,
          emailType: sendEmailDto.emailType,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          userId: userRecord.id,
        };
        await this.otpSessionRepo.create(otpData);
      } else {
        await this.otpSessionRepo.update(
          { email: sendEmailDto.toEmail },
          {
            email: sendEmailDto.toEmail,
            otpCode: otp,
            emailType: sendEmailDto.emailType,
            expiresAt: expiresAt,
          },
        );
      }

      msg = {
        to: sendEmailDto.toEmail,
        from: {
          email: this.options.fromEmail,
          name: process.env.EMAIL_DISPLAY_NAME,
        },
        templateId: EmailConstants.SENDGRID_OTP_EMAIL_TEMPLATE!,
        dynamicTemplateData: {
          otp: otp,
          name: userRecord.name,
        },
      };
    }
    // Sending reset password email.
    else if (sendEmailDto.emailType == 'resetPassword') {
      // 2. Check cooldown (only allow 1 request every 5 minutes)
      const lastSession = await this.resetSessionsRepo.findOneWithSorting(
        { userId: userRecord._id },
        { requestedAt: -1 },
      );

      if (lastSession) {
        const diff = Date.now() - new Date(lastSession.requestedAt).getTime();
        if (diff < 5 * 60 * 1000) {
          throw new ResetLinkCooldownError();
        }
      }

      // 3. Invalidate all previous sessions for this user
      await this.resetSessionsRepo.deleteMany({
        userId: userRecord._id,
      });

      // 4. Create NEW reset session
      const newSession = await this.resetSessionsRepo.create({
        userId: userRecord._id.toString(),
        email: userRecord.email,
        isValid: true,
        requestedAt: new Date(),
      });

      const token = this.jwtService.sign(
        {
          userId: userRecord.id,
          resetSessionsId: newSession.id,
        },
        {
          expiresIn: '30m', // 30 minutes expiry
          secret: process.env.RESET_PASSWORD_SECRET,
        },
      );

      const resetLink = `${process.env.FRONTEND_URL}?token=${token}`;

      msg = {
        to: sendEmailDto.toEmail,
        from: {
          email: this.options.fromEmail,
          name: process.env.EMAIL_DISPLAY_NAME,
        },
        templateId: EmailConstants.SENDGRID_RESET_PASSWORD_EMAIL_TEMPLATE!,
        dynamicTemplateData: {
          link: resetLink,
          name: userRecord.name,
        },
      };
    } else if (sendEmailDto.emailType == 'supplierPlatformInvite') {
      msg = {
        to: sendEmailDto.toEmail,
        from: {
          email: this.options.fromEmail,
          name: process.env.EMAIL_DISPLAY_NAME,
        },
        templateId:
          EmailConstants.SENDGRID_SUPPLIER_PLATFORM_INVITE_EMAIL_TEMPLATE!,
        dynamicTemplateData: {
          companyName: componentDetails.companyName,
          productName: componentDetails.productName.name,
          componentName: componentDetails.componentName,
          supplierName: componentDetails.supplierName,
          link: process.env.FRONTEND_URL_FOR_SUPPLIER_SIGNUP_PAGE,
        },
      };
    } else if (
      sendEmailDto.emailType == 'requestImpactCategoryDataFromSupplier'
    ) {
      msg = {
        to: sendEmailDto.toEmail,
        from: {
          email: this.options.fromEmail,
          name: process.env.EMAIL_DISPLAY_NAME,
        },
        templateId:
          EmailConstants.SENDGRID_REQUEST_IMPACT_CATEGORY_DATA_FROM_SUPPLIER_EMAIL_TEMPLATE!,
        dynamicTemplateData: {
          companyName: componentDetails.companyName,
          productName: componentDetails.productName.name,
          componentName: componentDetails.componentName,
          supplierName: componentDetails.supplierName,
          link: process.env.FRONTEND_URL_FOR_SUPPLIER_LOGIN_PAGE,
        },
      };
    } else if (sendEmailDto.emailType == 'supplierSubmitImpactCategoryData') {
      const loginBaseUrl = process.env.FRONTEND_URL_FOR_SUPPLIER_LOGIN_PAGE;
      const redirectPath = `company-dashboard/products/${componentDetails.productId}/components/${componentDetails.componentId}/roles/${componentDetails.roleSlug}`;
      const dynamicLink = `${loginBaseUrl}?redirectTo=${redirectPath}`;

      msg = {
        to: sendEmailDto.toEmail,
        from: {
          email: this.options.fromEmail,
          name: process.env.EMAIL_DISPLAY_NAME,
        },
        templateId:
          EmailConstants.SENDGRID_SUPPLIER_SUBMITTED_IMPACT_CATEGORY_DATA!,
        dynamicTemplateData: {
          companyName: componentDetails.companyName,
          productName: componentDetails.productName,
          componentName: componentDetails.componentName,
          supplierName: componentDetails.supplierName,
          link: dynamicLink,
        },
      };
    }

    await sgMail.send(msg);
    return {
      success: true,
      statusCode: 200,
    };
  }

  async verifyEmailOtp(verifyEmailDto: VerifyEmailDto) {
    // fetching the email and the otp sent to verify with our db entry
    const email = verifyEmailDto.email;
    const session = await this.otpSessionRepo.findOne({ email });

    if (!session)
      throw new BaseError('No otp found for this email', 400, 'BAD_REQUEST');
    if (session.otpCode !== verifyEmailDto.otp)
      throw new BaseError('Invalid OTP', 400, 'BAD_REQUEST');
    if (session.expiresAt < new Date())
      throw new BaseError('OTP expired', 401, 'BAD_REQUEST');

    await this.otpSessionRepo.update(
      { email: verifyEmailDto.email },
      { isVerified: true },
    );

    await this.userRepository.update(
      { email: verifyEmailDto.email },
      { isEmailVerified: true },
    );
    return {
      success: true,
      statusCode: 200,
    };
  }
}
