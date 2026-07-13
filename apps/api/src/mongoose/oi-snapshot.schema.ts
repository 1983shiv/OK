import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OISnapshotDocument = HydratedDocument<OISnapshot>;

@Schema({ collection: 'oi_snapshots', timestamps: true })
export class OISnapshot {
  @Prop({ required: true, index: true })
  index!: string;

  @Prop({ required: true })
  spotPrice!: number;

  @Prop({ type: [{ type: Object }] })
  strikes!: Array<{
    strikePrice: number;
    expiryDate: string;
    callOI: number;
    callOIChange: number;
    callLTP: number;
    callVolume: number;
    putOI: number;
    putOIChange: number;
    putLTP: number;
    putVolume: number;
    callIV: number;
    putIV: number;
  }>;

  @Prop({ required: true })
  expiryDate!: string;

  @Prop({ type: [String] })
  availableExpiries!: string[];

  @Prop({ required: true })
  pcr!: number;

  @Prop({ required: true })
  maxPain!: number;

  @Prop()
  fetchedAt!: Date;
}

export const OISnapshotSchema = SchemaFactory.createForClass(OISnapshot);
OISnapshotSchema.index({ index: 1, fetchedAt: -1 });
