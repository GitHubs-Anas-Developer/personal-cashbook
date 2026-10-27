FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies required for PDFKit and native builds
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose API port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
