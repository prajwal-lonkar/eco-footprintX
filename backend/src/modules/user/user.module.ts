import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyType, CompanyTypeSchema } from './schemas/companyType.schema';
import {
  IndustryType,
  IndustryTypeSchema,
} from './schemas/industryType.schema';
import { IndustryTypeRepository } from './repositories/industryType.repository';
import { CompanyTypeRepository } from './repositories/companyType.repository';
import { OtpSession, OtpSessionSchema } from './schemas/otpSessions.schema';
import { OtpSessionRepository } from './repositories/otpSessions.repository';
import { EmailModule } from 'src/utils/sendgrid/email.module';
import { User, UserSchema } from './schemas/user.schema';
import { UserRepository } from './repositories/user.repository';
import { Role, RoleSchema } from './schemas/role.schema';
import { Invitation, InvitationSchema } from './schemas/invitation.schema';
import {
  WhitelistedEmail,
  WhitelistedEmailSchema,
} from './schemas/whitelistedEmail.schema';
import { WhitelistedEmailRepository } from './repositories/whitelistedEmail.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { RoleRepository } from './repositories/role.repository';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from '../auth/jwt-helper/roles.guard';
import {
  ResetSessions,
  ResetSessionsSchema,
} from './schemas/resetSessions.schema';
import { ResetSessionsRepository } from './repositories/resetSessions.repository';
import { SupplierRolesRepository } from './repositories/supplierRoles.repository';
import {
  SupplierRoles,
  SupplierRolesSchema,
} from './schemas/supplierRoles.schema';
import { ImpactCategoryDataRepository } from '../product/repositories/impact-category-repository';
import { ComponentRepository } from '../product/repositories/component.repository';
import {
  ImpactCategoryData,
  ImpactCategoryDataSchema,
} from '../product/schemas/impact-category-data.schema';
import {
  Component,
  ComponentSchema,
} from '../product/schemas/component.schema';
import {
  CompanySubscription,
  CompanySubscriptionSchema,
} from './schemas/company-subscription.schema';
import { CompanySubscriptionRepository } from './repositories/company-subscription.repository';
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from './schemas/subscription-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanyType.name, schema: CompanyTypeSchema },
      { name: IndustryType.name, schema: IndustryTypeSchema },
      { name: OtpSession.name, schema: OtpSessionSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Invitation.name, schema: InvitationSchema },
      { name: WhitelistedEmail.name, schema: WhitelistedEmailSchema },
      { name: ResetSessions.name, schema: ResetSessionsSchema },
      { name: SupplierRoles.name, schema: SupplierRolesSchema },
      { name: ImpactCategoryData.name, schema: ImpactCategoryDataSchema },
      { name: Component.name, schema: ComponentSchema },
      { name: CompanySubscription.name, schema: CompanySubscriptionSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
    ]),
    EmailModule.forRoot(),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    CompanyTypeRepository,
    IndustryTypeRepository,
    OtpSessionRepository,
    WhitelistedEmailRepository,
    InvitationRepository,
    RoleRepository,
    UserRepository,
    JwtService,
    ResetSessionsRepository,
    SupplierRolesRepository,
    ImpactCategoryDataRepository,
    ComponentRepository,
    CompanySubscriptionRepository,
    SubscriptionPlanRepository,
    CompanySubscriptionRepository,
    RolesGuard,
  ],
  exports: [
    OtpSessionRepository,
    UserModule,
    UserService,
    UserRepository,
    RoleRepository,
    ResetSessionsRepository,
    InvitationRepository,
    SubscriptionPlanRepository,
    CompanySubscriptionRepository,
  ],
})
export class UserModule {}
