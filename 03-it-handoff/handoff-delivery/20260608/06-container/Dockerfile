FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=uat
ENV PORT=8080
ENV UPLOAD_ROOT=/var/lib/mva-procurement/uploads

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /var/lib/mva-procurement/uploads

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
