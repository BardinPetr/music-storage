const { createServer } = require('http');
const Express = require('express');
const SIO = require('socket.io');
const MS = require('./index');
require('dotenv').config();

const app = Express();

app.use(Express.static('static'));

const musicStorage = new MS(app, {
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
});

(async () => {
  await musicStorage.init();

  const server = createServer(app);
  const io = SIO(server);

  musicStorage.setSIO(io);

  server.listen(3000);
})();