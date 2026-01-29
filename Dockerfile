# ---------- BUILD ----------
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# garante que o build não dependa de env inexistente
ENV NODE_ENV=production
ENV VITE_ENV=production

RUN npm run build


# ---------- RUNTIME ----------
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080

CMD ["node", "dist/index.cjs"]
