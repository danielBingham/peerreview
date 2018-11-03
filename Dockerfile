FROM mhart/alpine-node

WORKDIR /src
COPY . .

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
