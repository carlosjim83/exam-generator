# Despliegue en Railway

Railway ofrece $5 de créditos mensuales gratuitos (suficiente para este proyecto pequeño).

## Estructura de Servicios

En Railway desplegaremos:

1. **PostgreSQL** (servicio gestionado por Railway)
2. **Redis** (servicio gestionado por Railway)
3. **Backend** (tu API Fastify)
4. **Frontend** (Next.js)

## Paso 1: Crear cuenta e instalar CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login
```

## Paso 2: Inicializar proyecto

```bash
# Desde la raíz del proyecto
railway init
```

Elige "Create a new project" y nombra el proyecto `exam-generator`.

## Paso 3: Crear servicios

### 3.1 Base de datos PostgreSQL

```bash
railway add --database postgres
```

Railway creará automáticamente la variable `DATABASE_URL`.

### 3.2 Redis

```bash
railway add --database redis
```

Railway creará automáticamente la variable `REDIS_URL`.

## Paso 4: Desplegar Backend

```bash
cd backend

# Crear Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
EOF

# Subir a Railway
railway up
```

## Paso 5: Configurar variables de entorno

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET="tu-jwt-secret"
railway variables set JWT_REFRESH_SECRET="tu-refresh-secret"

# Ollama Cloud (recomendado para no consumir recursos)
railway variables set OLLAMA_HOST="https://api.ollama.com"
railway variables set OLLAMA_API_KEY="sk-tu-api-key"
railway variables set OLLAMA_MODEL="llama3.2"
railway variables set OLLAMA_EMBEDDING_MODEL="nomic-embed-text"

# OAuth (opcional)
railway variables set GOOGLE_CLIENT_ID=""
railway variables set GOOGLE_CLIENT_SECRET=""
```

## Paso 6: Desplegar Frontend

```bash
cd ../frontend

# Crear Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Subir a Railway
railway up
```

## Paso 7: Obtener URLs

```bash
railway status
```

Esto mostrará las URLs de cada servicio.

## Costos

Railway es **gratis** hasta $5/mes:

- PostgreSQL: ~$2/mes (para uso ligero)
- Redis: ~$1/mes
- Backend + Frontend: ~$1-2/mes

**Total: ~$4-5/mes** (dentro del Free Tier)

## Comandos útiles

```bash
# Ver logs
railway logs

# Ver variables
railway variables

# Abrir en navegador
railway open

# Redesplegar
railway up
```

## Alternativa: Docker Compose (más simple)

Railway también soporta `railway.toml` con múltiples servicios:

```toml
[build]
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node dist/index.js"
```

Pero para este proyecto, la configuración por servicio es más flexible.

## Documentación

- [Railway Docs](https://docs.railway.app/)
- [Railway Pricing](https://railway.app/pricing)
