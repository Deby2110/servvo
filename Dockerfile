# ---------- Stage 1: build client ----------
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- Stage 2: runtime (API + sajian client) ----------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci && npx prisma generate

COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist

EXPOSE 5000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/index.js"]
