import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://sdui-mapper-web.vercel.app',  // Explicit production domain
      /\.vercel\.app$/,  // Allow all Vercel preview deployments
      /\.vercel\.com$/,  // Allow Vercel domains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('SDUI Server API')
    .setDescription('Server-Driven UI Template Management and Dynamic Component API')
    .setVersion('1.0')
    .addTag('templates', 'Template management endpoints')
    .addTag('sdui', 'Server-Driven UI component endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  await app.listen(process.env.PORT ?? 3001);
  
  console.log(`🚀 Server is running on http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`📚 Swagger documentation available at http://localhost:${process.env.PORT ?? 3001}/api-docs`);
}
bootstrap();
