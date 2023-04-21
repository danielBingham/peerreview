FROM node:18.16.0

ARG TOKEN

WORKDIR /src

COPY package.json .
COPY .npmrc .
RUN npm install

# Copy only the files and directories we need, one per command, from least
# likely to change to most likely to change.  This maximizes layer caching in
# our rebuilds and minimizes build times.  It also saves space - we don't need
# the tests in the image.  We probably shouldn't be building the production
# image if we haven't already run the tests.
#
# TODO In the future, allow for the construction of development images that
# include the tests, among other things, and can load code on a volume to allow
# development to happen in a docker image.
COPY babel.config.js .
COPY webpack.config.js .
COPY public public 
COPY server server 
COPY client client 

RUN npm run build

EXPOSE 8080 

ENTRYPOINT ["node", "./server/bin/www"]
