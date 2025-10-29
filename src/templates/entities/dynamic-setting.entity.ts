import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import type { Template } from './template.entity';

@Entity('dynamic_settings')
export class DynamicSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  templateId: string;

  @OneToOne('Template', (template: Template) => template.dynamicSetting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: Template;

  @Column()
  endpoint: string;

  @Column()
  httpMethod: string;

  @Column('jsonb', { nullable: true })
  requestJson: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

