# ---------- BUILD STAGE ----------
FROM node:20-slim AS builder

WORKDIR /app

# Instala deps (usa lockfile pra ficar estável)
COPY package*.json ./
RUN npm ci

# Copia o resto do projeto
COPY . .

# Faz o build (vai rodar: tsx script/build.ts)
RUN npm run build


# ---------- RUNTIME STAGE ----------
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copia apenas o necessário pro runtime
COPY package*.json ./

# Instala só deps de produção
RUN npm ci --omit=dev

# Copia o dist gerado no build + arquivos que seu runtime pode precisar
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080

# Roda: cross-env NODE_ENV=production node dist/index.cjs
CMD ["npm", "run", "start"]
