# Peer Review 

Peer Review is an open access, reputation based scientific publishing system.

## Development

After pulling the github repo, you can run the development server by first running the MySql docker
container and then running nodemon and the react dev server.

From the root project directory, build the postgres docker container:

```
$ cd database
$ docker build -t peer-sql .
```

Navigate back to the root directory and run the Postgres docker container:

```
$ cd ..
$ docker run -d -p 5432:5432--name peer-sql peer-sql
```

Run ``npm install`` to install project dependencies:

```
$ npm install
```

Run the development server for react and node to allow hot reloading while you develop:

```
$ npm run dev
```

When you're ready to test your project in a more production like context, kill the development
server and build the app docker container.

From the root project directory:

```
$ docker build -t peer .
$ docker run -d -p 3000:3000 --name peer peer 
```

When you're done, make sure to clean up the two docker containers:

```
$ docker stop peer
$ docker stop peer-sql
$ docker rm peer
$ docker rm peer-sql
```
