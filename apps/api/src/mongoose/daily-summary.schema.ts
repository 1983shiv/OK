import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DailySummaryDocument = HydratedDocument<DailySummary>;

@Schema({ collection: 'daily_summaries', timestamps: true })
export class DailySummary {
  @Prop({ required: true })
  symbol!: string;

  @Prop({ required: true })
  date!: string;

  @Prop()
  openPcr!: number;

  @Prop()
  closePcr!: number;

  @Prop()
  highPcr!: number;

  @Prop()
  lowPcr!: number;

  @Prop()
  maxPainOpen!: number;

  @Prop()
  maxPainClose!: number;

  @Prop()
  spotOpen!: number;

  @Prop()
  spotClose!: number;

  @Prop()
  spotHigh!: number;

  @Prop()
  spotLow!: number;

  @Prop()
  totalCallOiChange!: number;

  @Prop()
  totalPutOiChange!: number;

  @Prop({ type: [Object] })
  unusualActivities!: Record<string, unknown>[];

  @Prop()
  aiSummary!: string;
}

export const DailySummarySchema = SchemaFactory.createForClass(DailySummary);

DailySummarySchema.index({ symbol: 1, date: -1 }, { unique: true });
