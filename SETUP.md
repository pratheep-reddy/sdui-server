# SDUI Server - PostgreSQL Setup

## Database Schema

### Tables

#### `templates`
- `id` (uuid, primary key)
- `templateId` (string, unique) - Unique identifier for the template
- `templateName` (string) - Name of the template
- `staticTemplateJson` (jsonb) - Static template configuration
- `dynamicTemplateJson` (jsonb, nullable) - Dynamically merged template data
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### `dynamic_settings`
- `id` (uuid, primary key)
- `templateId` (uuid, foreign key to templates.id)
- `endpoint` (string) - API endpoint URL
- `httpMethod` (string) - HTTP method (GET, POST, etc.)
- `requestJson` (jsonb, nullable) - Request payload
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Start PostgreSQL (if not using Docker)

4. Run the application:
```bash
npm run start:dev
```

The server will start on `http://localhost:3001`

## Docker Deployment

### Start with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- NestJS application on port 3001

### Stop services

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs -f app
```

## API Endpoints

### Templates

- `GET /templates` - Get all templates
- `GET /templates/:templateId` - Get template by ID
- `POST /templates` - Create new template
- `PUT /templates/:templateId` - Update template
- `DELETE /templates/:templateId` - Delete template

### Dynamic Settings

- `GET /templates/:templateId/dynamic-settings` - Get dynamic settings
- `POST /templates/:templateId/dynamic-settings` - Save dynamic settings

### Merged Component

- `GET /templates/:templateId/merged` - Get merged template with dynamic data

## Example: Create Template

```bash
curl -X POST http://localhost:3001/templates \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "featured_offers",
    "templateName": "Featured Offers",
    "staticTemplateJson": {
      "card": {
        "log_id": "featured_offers",
        "states": []
      }
    }
  }'
```

## Database Migration

The application uses TypeORM with `synchronize: true` in development mode, which automatically creates/updates tables based on entities.

For production, you should:
1. Set `synchronize: false` in production
2. Use TypeORM migrations for schema changes

