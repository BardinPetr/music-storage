const Express = require('express');
const MS = require('./index');
require('dotenv').config();

const app = Express();

app.use(Express.static('static'));

const musicStorage = new MS(app, {
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  LSApikey: process.env.LS_ACCESS_KEY,
  mysqlConn: process.env.MYSQL_CONN,
  esnodeAddr: process.env.ES_NODE_ADDR,
});

(async () => {
  await musicStorage.init();
  app.listen(3000, () => console.log('Server started'));
})();