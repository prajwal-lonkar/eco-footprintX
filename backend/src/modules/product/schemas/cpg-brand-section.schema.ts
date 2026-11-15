import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { StorageType } from '../enums/storage-type.enum';

@Schema({ _id: false })
export class CpgBrandSection {
  @Prop({ required: true, enum: StorageType })
  storageType: StorageType;

  @Prop({ required: false })
  activityDescription: string;
}

export const CpgBrandSectionSchema =
  SchemaFactory.createForClass(CpgBrandSection);
