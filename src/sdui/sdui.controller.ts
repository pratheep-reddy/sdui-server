import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SduiService } from './sdui.service';

@ApiTags('sdui')
@Controller('sdui')
export class SduiController {
  constructor(private readonly sduiService: SduiService) {}

  @Get('component/:templateId')
  @ApiOperation({ 
    summary: 'Get SDUI component', 
    description: 'Retrieve a server-driven UI component by template ID. For dynamic templates, this will fetch data from the configured API endpoint and merge it with the template.' 
  })
  @ApiParam({ 
    name: 'templateId', 
    description: 'The unique template identifier', 
    example: 'template-123' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Component data retrieved and merged successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { 
          type: 'object',
          description: 'DivKit-compatible JSON template with merged API data'
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 500, description: 'Error fetching or merging data' })
  async getSduiComponent(@Param('templateId') templateId: string): Promise<any> {
    console.log('=== SDUI Controller called ===');
    console.log('Received templateId:', templateId);
    const result = await this.sduiService.getSduiComponent(templateId);
    console.log('=== SDUI Controller response ===');
    console.log('Response success:', result?.success);
    console.log('Response has data:', !!result?.data);
    console.log('Full response:', JSON.stringify(result, null, 2));
    return result;
  }
}

