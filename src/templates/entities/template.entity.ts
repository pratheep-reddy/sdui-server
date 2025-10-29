import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import type { DynamicSetting } from './dynamic-setting.entity';

export enum TemplateType {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
}

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  templateId: string;

  @Column()
  templateName: string;

  @Column({
    type: 'enum',
    enum: TemplateType,
    default: TemplateType.STATIC,
  })
  templateType: TemplateType;

  @Column('jsonb')
  staticTemplateJson: any;

  @Column('jsonb', { nullable: true })
  dynamicTemplateJson: any;

  @OneToOne('DynamicSetting', (dynamicSetting: DynamicSetting) => dynamicSetting.template, { cascade: true })
  dynamicSetting: DynamicSetting;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

