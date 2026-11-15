import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Put,
  Param,
  UseGuards,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UserService } from './user.service';
import { BaseError } from 'src/shared/errorResponse/base.error.response';
import { memoryStorage } from 'multer';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SendEmailDto } from './dto/send-email-otp.dto';
import { EmailService } from 'src/utils/sendgrid/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CheckUserEligibilityDto } from './dto/check-user-eligibility.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetResponse } from 'src/shared/successResponse/get.response';
import { CreateResponse } from 'src/shared/successResponse/create.response';
import { UpdateCompanyDetailsDto } from './dto/update-company-details.dto';
import { UpdateResponse } from 'src/shared/successResponse/update.response';
import { JwtAuthGuard } from '../auth/jwt-helper/jwt-auth.guard';
import { RolesGuard } from '../auth/jwt-helper/roles.guard';
import { Roles, RoleSlug } from '../auth/jwt-helper/roles.decorator';
import { SubscriptionTier } from './enums/subscription-tier.enums';

@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  @Get('company-types')
  async getAllCompanyTypes() {
    return await this.userService.getAllCompanyTypes();
  }

  @Get('industry-types')
  async getAllIndustryTypes() {
    return await this.userService.getAllIndustryTypes();
  }

  @Post('send-otp')
  async sendUserOnboardingOtpEmail(@Body() sendOtpEmailDto: SendEmailDto) {
    return await this.emailService.sendEmail(sendOtpEmailDto);
  }

  @Post('resetPasswordEmail')
  @HttpCode(200)
  async sendUserResetPasswordLinkEmail(
    @Body() sendResetPasswordEmailDto: SendEmailDto,
  ) {
    return await this.emailService.sendEmail(sendResetPasswordEmailDto);
  }

  @Post('verify-otp')
  async verifyUserOnboardingOtpEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.emailService.verifyEmailOtp(verifyEmailDto);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return new CreateResponse(user);
  }

  @Post('check-eligibility')
  @HttpCode(HttpStatus.OK)
  async checkEligibility(
    @Body() dto: CheckUserEligibilityDto,
    @Query('flow') flow?: string,
  ) {
    const result = await this.userService.checkEligibility(dto, flow);
    return new GetResponse(result);
  }

  @Post('resetPassword')
  @HttpCode(200)
  async resetUserPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.userService.resetUserPassword(resetPasswordDto);
  }

  @Get('suppliers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.ADMIN, RoleSlug.COMPANY)
  async getSuppliers(@Query('limit') limit = 10, @Query('skip') skip = 0) {
    const result = await this.userService.getSuppliers(+limit, +skip);
    return new GetResponse(result, 'Suppliers fetched successfully');
  }

  @Post('companies/import-csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  async importCompaniesIsActiveCsv(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BaseError('No file uploaded', 400, 'FILE_REQUIRED');
    }
    const result = await this.userService.importCompaniesIsActiveFromCsv(
      file.buffer,
    );
    return new UpdateResponse(result);
  }

  @Get('companies/export-csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.ADMIN)
  async exportCompaniesSubscriptionCsv(@Res() res: Response) {
    const csv = await this.userService.exportCompaniesSubscriptionCsv();
    const now = new Date();
    const filename = `companies-subscription-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get('companies')
  async getCompanies(@Query('limit') limit = 10, @Query('skip') skip = 0) {
    const result = await this.userService.getCompanies(+limit, +skip);
    return new GetResponse(result, 'Companies fetched successfully');
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(@Req() req, @Body() payload: UpdateCompanyDetailsDto) {
    const userId = req.user.payload.userId;
    const result = await this.userService.updateCompanyDetails(userId, payload);
    return new UpdateResponse(result);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getMyProfileDetails(
    @Req() req,
    @Query('userId') profileUserId?: string,
  ) {
    const userId = profileUserId ?? req.user.payload.userId;
    const data = await this.userService.getMyProfileDetails(userId);
    return new GetResponse(data, 'Profile details fetched successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:id')
  async getCompanyDetailsById(@Param('id') id: string) {
    const result = await this.userService.fetchCompanyDetails(id);
    return new GetResponse(result, 'Company details fetched successfully');
  }

  @Get('supplier-roles')
  @UseGuards(JwtAuthGuard)
  async supplierRoles() {
    const data = await this.userService.fetchSupplierRoles();
    return new GetResponse(data);
  }

  // Check registration no exist or not
  @Get('check-registration-number')
  async checkRegistrationNumberExists(
    @Query('registrationNumber') registrationNumber: string,
  ) {
    const result =
      await this.userService.isRegistrationNumberExists(registrationNumber);
    return new GetResponse(result);
  }

  // Get components list for supplier
  @Get('supplier/impact-category-request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.ADMIN, RoleSlug.SUPPLIER)
  async getComponentDataRequests(
    @Req() req,
    @Query('supplierUserId') supplierUserId?: string,
    @Query('limit') limit?,
    @Query('page') page?,
    @Query('search') search?,
  ) {
    const { userId, userRoleSlug } = req.user.payload;
    let effectiveUserId;

    if (userRoleSlug === 'admin_user') {
      effectiveUserId = supplierUserId;
    } else {
      effectiveUserId = userId;
    }

    const result = await this.userService.getComponentDataRequests(
      effectiveUserId,
      userRoleSlug,
      +limit,
      +page,
      search,
    );
    return new GetResponse(result);
  }

  // Upgrade user subcription
  @Post('subscription')
  @UseGuards(JwtAuthGuard)
  async assignOrUpgradeSubscription(
    @Req() req,
    @Body('slug') slug: SubscriptionTier,
  ) {
    const userId = req.user.payload.userId;
    const result = await this.userService.assignOrUpgradeSubscription(
      userId,
      slug,
    );

    return new GetResponse(result);
  }

  // Get user's current subscription with all other plans
  @Get('subscriptions')
  @UseGuards(JwtAuthGuard)
  async getSubscriptions(@Req() req) {
    const userId = req.user.payload.userId;
    const result = await this.userService.getSubscriptions(userId);
    return new GetResponse(result);
  }
}
