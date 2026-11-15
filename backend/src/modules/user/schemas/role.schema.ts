import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/schemas/base.schema';

@Schema({ timestamps: true, collection: 'roles' })
export class Role extends BaseSchema {
  @Prop({ type: String, required: true })
  roleName: string;

  @Prop({
    type: String,
    required: true,
    enum: ['supplier_user', 'company_user', 'admin_user'],
  })
  roleSlug: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
