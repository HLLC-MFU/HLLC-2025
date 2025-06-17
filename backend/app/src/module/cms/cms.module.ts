import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CMS, CmsSchema } from './schema/cms.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CMS.name, schema: CmsSchema }
    ]),
  ],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [MongooseModule, CmsService]
})
export class CmsModule { }
