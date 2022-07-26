FROM node 

WORKDIR /src
COPY package.json .
RUN npm install

COPY . .

RUN npm run test
RUN npm run build

EXPOSE 8080 

CMD ["npm", "start"]
