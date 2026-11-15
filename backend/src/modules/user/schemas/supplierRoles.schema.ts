import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from 'src/shared/schemas/base.schema';

export type SupplierDocument = HydratedDocument<SupplierRoles>;
@Schema({ collection: 'supplierRoles' })
export class SupplierRoles extends BaseSchema {
  @Prop({ required: true, type: String })
  role: string;

  @Prop({ required: true, type: String })
  supplierRoleSlug: string;
}

export const SupplierRolesSchema = SchemaFactory.createForClass(SupplierRoles);