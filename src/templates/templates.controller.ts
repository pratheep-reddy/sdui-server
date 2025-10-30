import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplateType } from './entities/template.entity';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async getAllTemplates() {
    const templates = await this.templatesService.getAllTemplates();
    return templates.map((template) => ({
      templateId: template.templateId,
      templateName: template.templateName,
      templateType: template.templateType,
      staticTemplateJson: template.staticTemplateJson,
      dynamicTemplateJson: template.dynamicTemplateJson,
    }));
  }

  @Get(':templateId')
  async getTemplateById(@Param('templateId') templateId: string) {
    const template = await this.templatesService.getTemplateById(templateId);
    return {
      success: true,
      data: {
        templateId: template.templateId,
        templateName: template.templateName,
        templateType: template.templateType,
        staticTemplateJson: template.staticTemplateJson,
        dynamicTemplateJson: template.dynamicTemplateJson,
      },
    };
  }

  @Post()
  async createTemplate(@Body() body: {
    templateName: string;
    templateJson: any;
  }) {
    const template = await this.templatesService.createTemplate(body);
    return {
      success: true,
      message: 'Template created successfully',
      data: {
        templateId: template.templateId,
        templateName: template.templateName,
        templateType: template.templateType,
        staticTemplateJson: template.staticTemplateJson,
        dynamicTemplateJson: template.dynamicTemplateJson,
      },
    };
  }

  @Put(':templateId')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() body: {
      templateName?: string;
      templateType?: TemplateType;
      staticTemplateJson?: any;
      dynamicTemplateJson?: any;
    },
  ) {
    const template = await this.templatesService.updateTemplate(templateId, body);
    return {
      success: true,
      message: `Template "${templateId}" updated successfully`,
      data: {
        templateId: template.templateId,
        templateName: template.templateName,
        templateType: template.templateType,
        staticTemplateJson: template.staticTemplateJson,
        dynamicTemplateJson: template.dynamicTemplateJson,
      },
    };
  }

  @Delete(':templateId')
  async deleteTemplate(@Param('templateId') templateId: string) {
    await this.templatesService.deleteTemplate(templateId);
    return {
      success: true,
      message: `Template "${templateId}" deleted successfully`,
    };
  }

  @Get(':templateId/dynamic-settings')
  async getDynamicSetting(@Param('templateId') templateId: string) {
    const setting = await this.templatesService.getDynamicSetting(templateId);
    if (!setting) {
      return {
        success: false,
        message: `No dynamic settings found for template "${templateId}"`,
        data: null,
      };
    }
    return {
      success: true,
      data: {
        endpoint: setting.endpoint,
        httpMethod: setting.httpMethod,
        requestJson: setting.requestJson,
      },
    };
  }

  @Post(':templateId/dynamic-settings')
  async saveDynamicSetting(
    @Param('templateId') templateId: string,
    @Body() body: {
      endpoint: string;
      httpMethod: string;
      requestJson: any;
      headerJson: any;
    },
  ) {
    const setting = await this.templatesService.saveDynamicSetting({
      templateId,
      ...body,
    });
    return {
      success: true,
      message: `Dynamic settings for template "${templateId}" saved successfully`,
      data: {
        endpoint: setting.endpoint,
        httpMethod: setting.httpMethod,
        requestJson: setting.requestJson,
        headerJson: setting.headerJson,
      },
    };
  }
}

