import { Controller, Get, Param } from '@nestjs/common';
import { SduiService } from './sdui.service';

@Controller('sdui')
export class SduiController {
  constructor(private readonly sduiService: SduiService) {}

  @Get('component/:templateId')
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

