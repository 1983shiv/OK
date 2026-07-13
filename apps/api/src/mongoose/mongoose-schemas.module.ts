import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OISnapshot, OISnapshotSchema } from './oi-snapshot.schema';

const schemas = MongooseModule.forFeature([
  { name: OISnapshot.name, schema: OISnapshotSchema },
]);

@Global()
@Module({
  imports: [schemas],
  exports: [schemas],
})
export class MongooseSchemasModule {}
