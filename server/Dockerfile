FROM node:20-alpine

WORKDIR /app

# Copy root workspace configurations
COPY package.json package-lock.json ./
COPY server/package.json ./server/

# Install only production dependencies for the server workspace
RUN npm ci -w incident-command-server --omit=dev

# Copy server code
COPY server/ ./server/

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start", "-w", "incident-command-server"]
