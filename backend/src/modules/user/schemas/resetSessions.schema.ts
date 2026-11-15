import { Prop, SchemaFactory, Schema } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { BaseSchema } from "src/shared/schemas/base.schema";

export type ResetSessionsDocument = HydratedDocument<ResetSessions>;
@Schema({ collection: 'resetSessions', timestamps: true })
export class ResetSessions extends BaseSchema {
    @Prop({ type: String, required: true })
    email: string;

    @Prop({ type: String, required: true })
    userId: string;

    @Prop({ type: Boolean, default: true })
    isValid: boolean;

    @Prop({ type: Date, required: true })
    requestedAt: Date;
}

export const ResetSessionsSchema = SchemaFactory.createForClass(ResetSessions);
