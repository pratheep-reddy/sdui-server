import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { Template } from './entities/template.entity';
import { DynamicSetting } from './entities/dynamic-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Template, DynamicSetting])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}

