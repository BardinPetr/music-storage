const LyricsSearch = require('@penfoldium/lyrics-search');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const { Router } = require('express');
const uuid = require('uuid').v4;

const Store = require('./src/store');
const DB = require('./src/db');


module.exports = class {
  constructor(express, credentials) {
    this.credentials = credentials;
    this.express = express;

    this.lyricsSearch = new LyricsSearch(this.credentials.LSApikey);
    this.store = new Store();
    this.db = new DB();
  }

  setSIO(socketio) {
    this.sio = socketio;
  }

  async init() {
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(fileUpload());
    this.initRouter();

    await this.store.init(this.credentials);
    await this.db.init(this.credentials);
  }

  initRouter() {
    // TODO Implement your own user authorization algorithm
    this.router = new Router();

    this.router.post('/upload', async (req, res) => {
      if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send('No files were specified');
        return;
      }
      if (!req.body.name) {
        res.status(400).send('No song name specified');
        return;
      }
      try {
        const songData = {
          ...req.body,
          id: uuid(),
          ext: (/\.[\d\w]+$/).exec(req.files.song.name)[0],
        };
        // await this.store.save(res.id, req.files.song.data);
        try {
          const text = await this.lyricsSearch.search(encodeURI(songData.name));
          songData.text = text.lyrics.replace(/\[.*\]/, '');
          songData.author = songData.author || text.primary_artist.name;
        } catch (ex) {
          if (!songData.author) {
            res.status(400).send('Failed to fill missing information automaticly. Please, retry with filled author name or lyrics');
            return;
          }
        }
        res.status(200).send();
      } catch (ex) {
        res.status(500).send(`Failed to save: ${ex.message}`);
      }
    });

    this.router.get('/search', async (req, res) => {
      try {
        res.status(200).send(await this.db.searchComposition(req.query.text));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    // uid - user id, sid - song id
    this.router.post('/appendPlaylist', async (req, res) => {
      try {
        res.status(200).send(await this.db.appendPlaylist(req.query.uid, req.query.sid));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.router.post('/removePlaylist', async (req, res) => {
      try {
        res.status(200).send(await this.db.removeFromPlaylist(req.query.uid, req.query.sid));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.router.get('/getUser', async (req, res) => {
      try {
        res.status(200).send(await this.db.getUser(req.query.id));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.router.get('/createUser', async (req, res) => {
      try {
        res.status(200).send(await this.db.createUser(req.body));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.express.use(this.router);
  }
};