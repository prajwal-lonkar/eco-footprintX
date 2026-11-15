// src/modules/user/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../shared/schemas/base.schema';
import { CompanyType } from './companyType.schema';
import { IndustryType } from './industryType.schema';
import { Role } from './role.schema';

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: Types.ObjectId, ref: Role.name, required: true })
  role: Types.ObjectId;

  @Prop({
    type: {
      name: { type: String, required: true },
      website: { type: String, default: null },
      address: { type: String, required: true },
      industryType: {
        type: Types.ObjectId,
        ref: IndustryType.name, // "IndustryType"
        required: true,
      },
      companyType: {
        type: Types.ObjectId,
        ref: CompanyType.name, // "CompanyType"
        required: true,
      },
      registrationNumber: { type: String, required: true },
      dunsNumber: { type: String, default: null },
    },
    required: true,
  })
  companyDetails: {
    name: string;
    website?: string;
    address: string;
    industryType: Types.ObjectId;
    companyType: Types.ObjectId;
    registrationNumber: string;
    dunsNumber?: string;
  };

  @Prop({ type: String, default: null })
  invitedBy?: string;

  @Prop({ type: Boolean, default: false })
  isEmailVerified: boolean;
}
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1 });
UserSchema.index({ role: 1, name: 1 });
UserSchema.index({ role: 1, 'companyDetails.name': 1 });
UserSchema.index({ invitedBy: 1 });
UserSchema.index(
  { 'companyDetails.registrationNumber': 1 },
  { partialFilterExpression: { deletedAt: null } },
);
UserSchema.index({ 'companyDetails.name': 1 });
UserSchema.index({ isEmailVerified: 1 });
