const LyricsSearch = require('@penfoldium/lyrics-search');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const { Router } = require('express');
const uuid = require('uuid').v4;
const C = require('chalk');

const Store = require('./src/store');
const DB = require('./src/db');

const AVAILABLE_TYPES = ['.mp3'];

module.exports = class {
  constructor(express, credentials) {
    this.credentials = credentials;
    this.express = express;

    this.lyricsSearch = new LyricsSearch(this.credentials.LSApikey);
    this.store = new Store();
    this.db = new DB();
  }

  /**
   * Initializes all submodules
   */
  async init() {
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(fileUpload());
    this.initRouter();

    await Promise.all([this.store.init(this.credentials), this.db.init(this.credentials)]);
  }

  initRouter() {
    // TODO Implement your own user authorization algorithm
    this.router = new Router();

    // Currently supporting only mp3
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
        if (!AVAILABLE_TYPES.includes(songData.ext)) {
          res.status(400).send('Failed to fill missing information automaticly. Please, retry with filled author name or lyrics');
        }
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
        console.log(C`{blue Starting song processing}`);
        songData.title = `${songData.name} - ${songData.author}`;
        if (await this.db.exists(songData)) {
          res.status(400).send('This song already exists in the storage');
          console.log(C`{red Found duplicate}`);
        } else {
          await Promise.all([
            this.db.addSong(songData),
            this.store.save(songData.id, req.files.song.data)]);
          res.status(200).send(songData);
        }
      } catch (ex) {
        console.log(C`{red.bold ${ex.message}}`);
        res.status(500).send(`Failed to save: ${ex.message}`);
      }
    });

    this.router.get('/search', async (req, res) => {
      try {
        res.send(await this.db.searchSong(req.query.text));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.router.get('/play.mp3', async (req, res) => {
      const songInfo = await this.db.getSong(req.query.id);
      if (!songInfo || songInfo.ext !== '.mp3') {
        res.status(400).send('Not found such song in requested format');
        return;
      }
      try {
        res.send(await this.store.load(req.query.id));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    // uid - user id, sid - song id
    this.router.post('/appendToPlaylist', async (req, res) => {
      try {
        res.send(await this.db.appendToPlaylist(req.body.uid, req.body.sid));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.router.post('/removeFromPlaylist', async (req, res) => {
      try {
        await this.db.removeFromPlaylist(req.body.uid, req.body.sid);
        res.sendStatus(200);
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.router.get('/getPlaylist', async (req, res) => {
      try {
        res.send(await this.db.getPlaylist(req.query.uid));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.router.get('/getUser', async (req, res) => {
      try {
        res.send(await this.db.getUser(req.query.id));
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.router.post('/createUser', async (req, res) => {
      try {
        res.send((await this.db.addUser(req.body)).id);
      } catch (ex) {
        res.status(500).send(`Failed: ${ex.message}`);
      }
    });

    this.express.use(this.router);
  }
};