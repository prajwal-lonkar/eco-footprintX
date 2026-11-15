import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ContractManufacturingActivityType } from '../enums/contract-manufacturing-activity-type-enum';

@Schema({ _id: false })
export class ContractManufacturerSection {
  @Prop({
    type: [String],
    enum: ContractManufacturingActivityType,
    required: true,
  })
  manufacturingActivityTypes: ContractManufacturingActivityType[];

  @Prop({ required: false })
  activityDescription: string;
}

export const ContractManufacturerSectionSchema = SchemaFactory.createForClass(
  ContractManufacturerSection,
);
