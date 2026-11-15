import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class RawMaterialSupplierSection {
  @Prop({ required: true })
  internalSku: string;

  @Prop()
  supplierSku?: string;

  @Prop({ required: true })
  casNumber: string;

  @Prop({ required: false })
  activityDescription: string;
}

export const RawMaterialSupplierSectionSchema = SchemaFactory.createForClass(
  RawMaterialSupplierSection,
);
