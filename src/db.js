/* eslint-disable class-methods-use-this */
const ESClient = require('@elastic/elasticsearch').Client;
const { Sequelize } = require('sequelize');
const C = require('chalk');

const initModels = require('./models/index.js');

let Models;

const ES_INDEX_NAME = 'music-storage';
const ES_MAPPING = {
  index: ES_INDEX_NAME,
  body: {
    properties: {
      id: {
        type: 'keyword',
        // index: 'not_analyzed',
      },
      ext: {
        type: 'keyword',
        // index: 'not_analyzed',
      },
      name: {
        type: 'text',
      },
      author: {
        type: 'text',
      },
      lyrics: {
        type: 'text',
      },
    },
  },
};

let DBG_A; let
  DBG_B;

module.exports = class {
  async init(credentials) {
    console.log(C`[ES] {yellow Started initializing of ES}`);
    this.es = new ESClient({ node: credentials.esnodeAddr });

    // await this.es.indices.delete({ index: ES_INDEX_NAME });
    await this.es.indices.create({
      index: ES_INDEX_NAME,
    }).catch(() => console.log(C`[ES] {cyan Index found}`));
    await this.es.indices.putMapping(ES_MAPPING);
    await this.es.indices.refresh({ index: ES_INDEX_NAME });

    console.log(C`[ES] {green Elasticsearch connected}`);


    console.log(C`[DB] {yellow Started initializing of DB}`);
    this.sequelize = new Sequelize(credentials.mysqlConn);
    await this.sequelize.authenticate();
    Models = initModels(this.sequelize);
    await this.sequelize.sync({ force: process.env.FORCE_DB_SYNC });

    console.log(C`[MYSQL] {green DB connected}`);


    DBG_A = '420f5fbc-e7a1-499e-a5b1-bcaaf6eba330';
    DBG_B = '420f5fbc-e7a1-499e-a5b1-bcaaf6eba330';
    await this.addUser({ id: DBG_A, name: 'test' });
    await this.addSong({ id: DBG_B, ext: '.mp3' });
    await this.appendToPlaylist(DBG_A, DBG_B);
    // console.log(await this.getSong(DBG_A));

    // console.log(await this.getPlaylist(DBG_A));
  }

  async addUser(userData) {
    return Models.User.create(userData);
  }

  async getUser(userId) {
    return Models.User.findOne({ where: { id: userId }, include: 'songs' });
  }

  async getAllSongs() {
    return Models.Song.findAll({});
  }

  async appendToPlaylist(userId, songId) {
    return (await Models.User.findByPk(userId)).addSong(await Models.Song.findByPk(songId));
  }

  async removeFromPlaylist(userId, songId) {
    return (await Models.User.findByPk(userId)).removeSong(await Models.Song.findByPk(songId));
  }

  async getPlaylist(userId) {
    return (await Models.User.findByPk(userId)).getSongs();
  }

  async addSong(songData) {
    return Promise.all([Models.Song.create(songData), this.indexSong(songData)]);
  }

  async indexSong(body) {
    return this.es.index({
      index: ES_INDEX_NAME,
      body,
    });
  }

  async esSearch(body) {
    try {
      return (await this.es.search({
        index: ES_INDEX_NAME,
        body,
      })).body.hits.hits;
    } catch (ex) {
      console.log(C`[ES] {red} Search failed: ${ex.message}`);
      return [];
    }
  }

  async getSong(id) {
    const res = await this.esSearch({
      query: {
        match: { id },
      },
    });
    // eslint-disable-next-line no-underscore-dangle
    return res[0] ? res[0]._source : undefined;
  }

  async searchSong(query) {
    return this.es.search({
      index: ES_INDEX_NAME,
      body: {
        query: {
          match: { name: query },
        },
      },
    });
  }

  async exists(songData) {
    return (await this.getSong(songData.id))
      || (await this.esSearch({

      }));
  }
};
