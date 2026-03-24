# ── Stage 1: build React frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build          # outputs to /app/dist


# ── Stage 2: production image ───────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only server deps
COPY server/package.json ./server/
RUN cd server && npm install --omit=dev

# Copy server source
COPY server/ ./server/

# Copy built frontend (served as static files by Express in production)
COPY --from=frontend-build /app/dist ./dist

# Serve static files from Express when SERVE_STATIC=true
COPY server/index.js ./server/

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server/index.js"]
