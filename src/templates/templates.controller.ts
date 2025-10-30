import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { TemplateType } from './entities/template.entity';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all templates', description: 'Retrieve a list of all templates' })
  @ApiResponse({ status: 200, description: 'List of templates retrieved successfully' })
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
  @ApiOperation({ summary: 'Get template by ID', description: 'Retrieve a specific template by its ID' })
  @ApiParam({ name: 'templateId', description: 'The unique template identifier', example: 'template-123' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
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
  @ApiOperation({ summary: 'Create a new template', description: 'Create a new template with the provided configuration' })
  @ApiBody({
    description: 'Template creation payload',
    schema: {
      type: 'object',
      properties: {
        templateName: { type: 'string', example: 'My Template' },
        templateJson: { type: 'object', example: { card: { log_id: 'example_card' } } },
      },
      required: ['templateName', 'templateJson'],
    },
  })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
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
  @ApiOperation({ summary: 'Update a template', description: 'Update an existing template with new data' })
  @ApiParam({ name: 'templateId', description: 'The unique template identifier', example: 'template-123' })
  @ApiBody({
    description: 'Template update payload',
    schema: {
      type: 'object',
      properties: {
        templateName: { type: 'string', example: 'Updated Template Name' },
        templateType: { type: 'string', enum: ['static', 'dynamic'], example: 'dynamic' },
        staticTemplateJson: { type: 'object', example: { card: { log_id: 'example_card' } } },
        dynamicTemplateJson: { type: 'object', example: { card: { log_id: 'example_card' } } },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
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
  @ApiOperation({ summary: 'Delete a template', description: 'Delete a template by its ID' })
  @ApiParam({ name: 'templateId', description: 'The unique template identifier', example: 'template-123' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async deleteTemplate(@Param('templateId') templateId: string) {
    await this.templatesService.deleteTemplate(templateId);
    return {
      success: true,
      message: `Template "${templateId}" deleted successfully`,
    };
  }

  @Get(':templateId/dynamic-settings')
  @ApiOperation({ summary: 'Get dynamic settings', description: 'Retrieve dynamic API settings for a template' })
  @ApiParam({ name: 'templateId', description: 'The unique template identifier', example: 'template-123' })
  @ApiResponse({ status: 200, description: 'Dynamic settings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Dynamic settings not found' })
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
  @ApiOperation({ summary: 'Save dynamic settings', description: 'Create or update dynamic API settings for a template' })
  @ApiParam({ name: 'templateId', description: 'The unique template identifier', example: 'template-123' })
  @ApiBody({
    description: 'Dynamic settings configuration',
    schema: {
      type: 'object',
      properties: {
        endpoint: { type: 'string', example: 'https://api.example.com/data' },
        httpMethod: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], example: 'GET' },
        requestJson: { type: 'object', example: { key: 'value' } },
        headerJson: { type: 'object', example: { Authorization: 'Bearer token' } },
      },
      required: ['endpoint', 'httpMethod'],
    },
  })
  @ApiResponse({ status: 200, description: 'Dynamic settings saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
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

