FROM node:20-alpine

WORKDIR /app

# Copy root workspace configurations
COPY package.json package-lock.json ./
COPY worker/package.json ./worker/

# Install only production dependencies for the worker workspace
RUN npm ci -w incident-command-worker --omit=dev

# Copy worker code
COPY worker/ ./worker/

EXPOSE 5001

ENV NODE_ENV=production

CMD ["npm", "start", "-w", "incident-command-worker"]
