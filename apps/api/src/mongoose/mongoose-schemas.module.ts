import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OISnapshot, OISnapshotSchema } from './oi-snapshot.schema';
import { AiConversation, AiConversationSchema } from './ai-conversation.schema';
import { DailySummary, DailySummarySchema } from './daily-summary.schema';

const schemas = MongooseModule.forFeature([
  { name: OISnapshot.name, schema: OISnapshotSchema },
  { name: AiConversation.name, schema: AiConversationSchema },
  { name: DailySummary.name, schema: DailySummarySchema },
]);

@Global()
@Module({
  imports: [schemas],
  exports: [schemas],
})
export class MongooseSchemasModule {}
