# Deploying SDUI Server to Render

This guide explains how to deploy your NestJS server to Render.

## Prerequisites

1. A [Render account](https://render.com) (free tier available)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Push your code to Git**
   ```bash
   cd sdui-server
   git add .
   git commit -m "Add Render deployment configuration"
   git push
   ```

2. **Create New Blueprint on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your Git repository
   - Render will automatically detect `render.yaml`
   - Click "Apply" to create the services

3. **Wait for Deployment**
   - Render will create:
     - PostgreSQL database (free tier)
     - Web service for your API
   - First deployment takes 5-10 minutes

### Option 2: Manual Setup

#### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `sdui-db`
   - **Database**: `sdui_db`
   - **User**: `postgres`
   - **Region**: Choose closest to you
   - **Plan**: Free
3. Click "Create Database"
4. Save the connection details (you'll need them)

#### Step 2: Create Web Service

1. Go to Render Dashboard → "New +" → "Web Service"
2. Connect your Git repository
3. Configure:

   **Basic Settings:**
   - **Name**: `sdui-server`
   - **Region**: Same as database
   - **Branch**: `main` (or your branch)
   - **Root Directory**: `sdui-server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

   **Environment Variables:**
   Add these environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   DB_TYPE=postgres
   DB_HOST=[Your Database Host from Step 1]
   DB_PORT=[Your Database Port]
   DB_USERNAME=[Your Database User]
   DB_PASSWORD=[Your Database Password]
   DB_DATABASE=sdui_db
   ```

4. Click "Create Web Service"

### Step 3: Update Frontend URLs

Once deployed, update your frontend to use the Render URL:

**In `sdui-map-web` files:**
Replace `http://localhost:3001` with your Render URL (e.g., `https://sdui-server.onrender.com`)

Files to update:
- `src/components/VariableEditor.tsx`
- `src/components/TemplateCard.tsx`
- `src/app/mapper/page.tsx`
- Any other files making API calls

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Server port | `3001` |
| `DB_TYPE` | Database type | `postgres` |
| `DB_HOST` | Database hostname | From Render dashboard |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database username | From Render dashboard |
| `DB_PASSWORD` | Database password | From Render dashboard |
| `DB_DATABASE` | Database name | `sdui_db` |

## Accessing Your Deployed API

Once deployed, your API will be available at:
```
https://your-service-name.onrender.com
```

Test endpoints:
- `GET /templates` - List all templates
- `GET /sdui/component/:templateId` - Get merged template
- `POST /templates` - Create new template

## Important Notes

⚠️ **Free Tier Limitations:**
- Service spins down after 15 minutes of inactivity
- First request after spindown takes 30-60 seconds (cold start)
- Database limited to 90 days, then deleted

💡 **Tips:**
- Use Render's paid plan ($7/month) to avoid cold starts
- Set up health check pings to keep service warm
- Database automatically backed up on paid plans

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### Database Connection Error
- Verify environment variables are set correctly
- Check database is in same region as web service
- Ensure database is active (not paused)

### Service Won't Start
- Check start logs in Render dashboard
- Verify `npm run start:prod` works locally
- Check for missing environment variables

## Monitoring

- **Logs**: View in Render Dashboard → Your Service → Logs
- **Metrics**: View in Render Dashboard → Your Service → Metrics
- **Events**: View in Render Dashboard → Your Service → Events

## Updating Your Deployment

When you push changes to your Git repository:
1. Render automatically detects the push
2. Triggers a new build
3. Deploys the new version
4. Zero-downtime deployment

## Cost Estimation

**Free Tier:**
- Web Service: Free (with limitations)
- PostgreSQL: Free for 90 days
- Total: $0/month

**Recommended Production:**
- Web Service: $7/month (no cold starts)
- PostgreSQL: $7/month (persistent, backups)
- Total: $14/month

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Update frontend with Render URL
3. ✅ Deploy frontend to Vercel/Netlify
4. ✅ Set up custom domain (optional)
5. ✅ Configure CORS for production
6. ✅ Set up monitoring/alerts

## Support

- [Render Documentation](https://render.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Render Community](https://community.render.com)

