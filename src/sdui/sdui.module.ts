import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SduiController } from './sdui.controller';
import { SduiService } from './sdui.service';
import { Template } from '../templates/entities/template.entity';
import { DynamicSetting } from '../templates/entities/dynamic-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Template, DynamicSetting])],
  controllers: [SduiController],
  providers: [SduiService],
  exports: [SduiService],
})
export class SduiModule {}

