import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Template } from '../templates/entities/template.entity';
import { DynamicSetting } from '../templates/entities/dynamic-setting.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_DATABASE', 'sdui_db'),
  entities: [Template, DynamicSetting],
  synchronize: true, // Auto-create tables
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl: false, // Disable SSL for local development
});

