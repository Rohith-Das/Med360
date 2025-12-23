FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Compile TypeScript
RUN npx tsc --skipLibCheck || true

EXPOSE 5000

# Start server
CMD ["npm", "run", "start"]
