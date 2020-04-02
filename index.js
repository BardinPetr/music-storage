const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const { Router } = require('express');
const uuid = require('uuid').v4;

const Store = require('./src/store');

module.exports = class {
  constructor(express, awsParams) {
    this.awsParams = awsParams;
    this.express = express;
  }

  setSIO(socketio) {
    this.sio = socketio;
  }

  async init() {
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(fileUpload());
    this.initRouter();

    this.store = new Store();
    await this.store.init(this.awsParams);
  }

  initRouter() {
    this.router = new Router();
    this.router.post('/upload', async (req, res) => {
      if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send('No files were specified');
        return;
      }
      try {
        await this.processUpload({
          ...req.body,
          id: uuid(),
          ext: (/\.[\d\w]+$/).exec(req.files.song.name)[0],
        }, req.files.song.data);
        res.status(200).send();
      } catch (ex) {
        res.status(500).send(`Failed to save: ${ex.message}`);
      }
    });
    this.express.use(this.router);
  }

  async processUpload(data, file) {
    await this.store.save(data.id, file);
  }
};