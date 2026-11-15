import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PackagingManufacturerSection {
  @Prop({ required: false })
  activityDescription: string;
}

export const PackagingManufacturerSectionSchema =
  SchemaFactory.createForClass(PackagingManufacturerSection);
