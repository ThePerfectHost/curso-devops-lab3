# ETAPA 1: Build (Usamos Node 24 completo)
FROM node:24 AS builder
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
RUN npm run build

# ETAPA 2: Run (Imagen liviana con Alpine) 
FROM node:24-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm install --only=production

EXPOSE 3000

CMD ["node", "dist/main"]