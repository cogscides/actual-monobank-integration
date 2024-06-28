FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE ${WEBHOOK_PORT}

CMD [ "node", "src/index.js" ]