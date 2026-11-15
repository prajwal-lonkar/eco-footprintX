import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Component, ComponentSchema } from './schemas/component.schema';
import {
  SupplierRoles,
  SupplierRolesSchema,
} from '../user/schemas/supplierRoles.schema';
import { S3Service } from '../../config/aws/s3.service';
import { UserRepository } from '../user/repositories/user.repository';
import { ProductRepository } from './repositories/product.repository';
import { UserModule } from '../user/user.module';
import { Product, ProductSchema } from './schemas/product.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { ComponentRepository } from './repositories/component.repository';
import { SupplierRolesRepository } from '../user/repositories/supplierRoles.repository';
import {
  ImpactCategoryData,
  ImpactCategoryDataSchema,
} from './schemas/impact-category-data.schema';
import { ImpactCategoryDataRepository } from './repositories/impact-category-repository';
import { EmailModule } from 'src/utils/sendgrid/email.module';
import { InvitationRepository } from '../user/repositories/invitation.repository';
import {
  Invitation,
  InvitationSchema,
} from '../user/schemas/invitation.schema';
import { UnitConversionsModule } from 'src/utils/unitConversions/unitConversions.module';
import { OpenAIModule } from 'src/utils/openai/openai.module';
import { ImpactCategoryRecordRepository } from './repositories/impact-category-record.repository';
import { ImpactCategoryRequestRepository } from './repositories/impact-category-request.repository';
import { ImpactCategoryVersionRepository } from './repositories/impact-category-version.respository';
import {
  ImpactCategoryRecord,
  ImpactCategoryRecordSchema,
} from './schemas/impact-category-record.schema';
import {
  ImpactCategoryRequest,
  ImpactCategoryRequestSchema,
} from './schemas/impact-category-request.schema';
import {
  ImpactCategoryVersion,
  ImpactCategoryVersionSchema,
} from './schemas/impact-category-version.schema';
import { RolesGuard } from '../auth/jwt-helper/roles.guard';
import { DatahubHeadersService } from 'src/utils/datahub/datahub-headers.util';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: Component.name, schema: ComponentSchema },
      { name: SupplierRoles.name, schema: SupplierRolesSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: SupplierRoles.name, schema: SupplierRolesSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: ImpactCategoryData.name, schema: ImpactCategoryDataSchema },
      { name: Invitation.name, schema: InvitationSchema },
      { name: ImpactCategoryRecord.name, schema: ImpactCategoryRecordSchema },
      { name: ImpactCategoryRequest.name, schema: ImpactCategoryRequestSchema },
      { name: ImpactCategoryVersion.name, schema: ImpactCategoryVersionSchema },
    ]),
    EmailModule.forRoot(),
    UnitConversionsModule.forRoot(),
    OpenAIModule.forRoot(),
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    S3Service,
    UserRepository,
    ProductRepository,
    UserModule,
    ComponentRepository,
    SupplierRolesRepository,
    ImpactCategoryDataRepository,
    InvitationRepository,
    ImpactCategoryRecordRepository,
    ImpactCategoryRequestRepository,
    ImpactCategoryVersionRepository,
    RolesGuard,
    DatahubHeadersService,
  ],
  exports: [UserRepository],
})
export class ProductModule {}
