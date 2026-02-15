# Stage 1: Build TypeScript
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source files needed for the API
COPY tsconfig.json ./
COPY lib/ ./lib/
COPY utils/ ./utils/
COPY docker/manim-api-server.ts ./docker/

# Build TypeScript to JavaScript
RUN npx tsc \
    --outDir dist \
    --esModuleInterop \
    --module commonjs \
    --target ES2020 \
    --moduleResolution node \
    --skipLibCheck \
    --resolveJsonModule \
    --baseUrl . \
    --paths '{"@/*":["./*"]}' \
    docker/manim-api-server.ts \
    lib/*.ts \
    utils/manim-generator.ts \
    utils/manim-executor.ts

# Stage 2: Production image with Manim + Node.js
FROM manimcommunity/manim:stable

USER root

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install LaTeX packages required by Manim for math rendering
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-latex-recommended \
    texlive-science \
    texlive-fonts-recommended \
    dvisvgm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Copy production node_modules (only production dependencies)
COPY package.json package-lock.json ./
RUN npm ci --production

# Create necessary directories
RUN mkdir -p /tmp/manim_render /app/public/animations

# Manim user has UID 1000 by default in manimcommunity/manim image
# Give ownership to manimuser
RUN chown -R manimuser:manimuser /app /tmp/manim_render

# Switch to non-root user for security
USER manimuser

# Expose port
EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the server
CMD ["node", "dist/docker/manim-api-server.js"]
