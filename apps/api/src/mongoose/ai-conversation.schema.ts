import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AiConversationDocument = HydratedDocument<AiConversation>;

@Schema({ collection: 'ai_conversations', timestamps: true })
export class AiConversation {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  sessionId!: string;

  @Prop({
    type: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  messages!: Array<{ role: string; content: string; timestamp: Date }>;

  @Prop({ default: 0 })
  totalTokens!: number;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop()
  expiresAt!: Date;
}

export const AiConversationSchema =
  SchemaFactory.createForClass(AiConversation);

AiConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
