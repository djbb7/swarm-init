FROM node:4.8.4-slim

WORKDIR app
ADD server.js .
ADD package.json .

RUN npm install

ENV PORT 3000
EXPOSE 3000

CMD ["node","server.js"]
