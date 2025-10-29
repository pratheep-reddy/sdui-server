import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template, TemplateType } from './entities/template.entity';
import { DynamicSetting } from './entities/dynamic-setting.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @InjectRepository(DynamicSetting)
    private dynamicSettingRepository: Repository<DynamicSetting>,
  ) {}

  async getAllTemplates(): Promise<Template[]> {
    return this.templateRepository.find({
      relations: ['dynamicSetting'],
    });
  }

  async getTemplateById(templateId: string): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { templateId },
      relations: ['dynamicSetting'],
    });

    if (!template) {
      throw new NotFoundException(`Template with templateId "${templateId}" not found`);
    }

    return template;
  }

  async createTemplate(data: {
    templateName: string;
    templateJson: any;
  }): Promise<Template> {
    // Auto-generate UUID for templateId using crypto
    const crypto = require('crypto');
    const templateId = crypto.randomUUID();
    
    const template = this.templateRepository.create({
      templateId,
      templateName: data.templateName,
      templateType: TemplateType.STATIC,
      staticTemplateJson: data.templateJson,
      dynamicTemplateJson: data.templateJson,
    });
    return this.templateRepository.save(template);
  }

  async updateTemplate(templateId: string, updateData: {
    templateName?: string;
    templateType?: TemplateType;
    staticTemplateJson?: any;
    dynamicTemplateJson?: any;
  }): Promise<Template> {
    const template = await this.getTemplateById(templateId);
    
    if (updateData.templateName) {
      template.templateName = updateData.templateName;
    }
    if (updateData.templateType) {
      template.templateType = updateData.templateType;
    }
    if (updateData.staticTemplateJson) {
      template.staticTemplateJson = updateData.staticTemplateJson;
    }
    if (updateData.dynamicTemplateJson !== undefined) {
      template.dynamicTemplateJson = updateData.dynamicTemplateJson;
    }
    
    return this.templateRepository.save(template);
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const template = await this.getTemplateById(templateId);
    await this.templateRepository.remove(template);
  }

  async getDynamicSetting(templateId: string): Promise<DynamicSetting | null> {
    const template = await this.getTemplateById(templateId);
    const setting = await this.dynamicSettingRepository.findOne({
      where: { templateId: template.id },
    });
    return setting;
  }

  async saveDynamicSetting(params: {
    templateId: string;
    endpoint: string;
    httpMethod: string;
    requestJson: any;
  }): Promise<DynamicSetting> {
    const { templateId, endpoint, httpMethod, requestJson } = params;
    const template = await this.getTemplateById(templateId);

    // Check if dynamic setting already exists
    let setting = await this.dynamicSettingRepository.findOne({
      where: { templateId: template.id },
    });

    if (setting) {
      // Update existing setting
      setting.endpoint = endpoint;
      setting.httpMethod = httpMethod;
      setting.requestJson = requestJson;
    } else {
      // Create new setting
      setting = this.dynamicSettingRepository.create({
        templateId: template.id,
        endpoint,
        httpMethod,
        requestJson,
      });
    }

    return this.dynamicSettingRepository.save(setting);
  }

}

