/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
const ESClient = require('@elastic/elasticsearch').Client;
const { Sequelize } = require('sequelize');
const C = require('chalk');

const initModels = require('./models/index.js');

const ES_SETTINGS = require('./es_settings');
const ES_MAPPING = require('./es_mapping');

const ES_INDEX_NAME = 'music-storage';
let Models;

module.exports = class {
  async init(credentials) {
    console.log(C`[ES] {yellow Started initializing of ES}`);
    this.es = new ESClient({ node: credentials.esnodeAddr });

    if (process.env.FORCE_DB_SYNC) await this.es.indices.delete({ index: ES_INDEX_NAME });
    await this.es.indices
      .create({ index: ES_INDEX_NAME })
      .catch(() => console.log(C`[ES] {cyan Index found}`));
    await this.es.indices.close({ index: ES_INDEX_NAME });
    await this.es.indices.putSettings(ES_SETTINGS);
    await this.es.indices.open({ index: ES_INDEX_NAME });
    await this.es.indices.putMapping(ES_MAPPING);
    await this.es.indices.refresh({ index: ES_INDEX_NAME });
    console.log(C`[ES] {green Elasticsearch connected}`);

    console.log(C`[DB] {yellow Started initializing of DB}`);
    this.sequelize = new Sequelize(credentials.mysqlConn);
    await this.sequelize.authenticate();
    Models = initModels(this.sequelize);
    await this.sequelize.sync({ force: process.env.FORCE_DB_SYNC });
    console.log(C`[MYSQL] {green DB connected}`);
  }

  /**
   * Create new use in MYSQL
   * @param {{name: string}} userData - user metadata
   */
  async addUser(userData) {
    return Models.User.create(userData);
  }

  /**
   * Get user from MYSQL (includes it's own playlist)
   * @param {string} userId - uuidv4 user id
   */
  async getUser(userId) {
    return Models.User.findOne({ where: { id: userId }, include: 'songs' });
  }

  /**
   * Get all songs in MYSQL - only IDs, no metadata
   */
  async getAllSongs() {
    return Models.Song.findAll({});
  }

  /**
   * Appends song to user's playlist in MYSQL
   * @param {string} userId - uuidv4 user id
   * @param {string} songId - uuidv4 song id
   */
  async appendToPlaylist(userId, songId) {
    return (await Models.User.findByPk(userId)).addSong(await Models.Song.findByPk(songId));
  }

  /**
   * Removes song from user's playlist in MYSQL
   * @param {string} userId - uuidv4 user id
   * @param {string} songId - uuidv4 song id
   */
  async removeFromPlaylist(userId, songId) {
    return (await Models.User.findByPk(userId)).removeSong(await Models.Song.findByPk(songId));
  }

  /**
   * Get playlist of user
   * @param {string} userId - uuidv4 user id
   * @returns array of getSong() result
   */
  async getPlaylist(userId) {
    const data = await (await Models.User
      .findByPk(userId))
      .getSongs();
    return Promise.all(data.map((x) => this.getSong(x.id)));
  }

  /**
   * Stores song into MYSQL and ES
   * @param {{id: string, name: string, author: string, title: string, text: string, ext: String}} songData - song metadata
   */
  async addSong(songData) {
    return Promise.all([Models.Song.create(songData), this.indexSong(songData)]);
  }

  /**
   * Stores song into ES
   * @param {%as in addSong%} body - song metadata
   */
  async indexSong(body) {
    return this.es.index({
      index: ES_INDEX_NAME,
      body,
    });
  }

  /**
   * Run multiple Elasticsearch.js search queries and combines results
   * @param  {...any} args - Elasticsearch.js search requests
   * @returns {%es search query result%._source}
   */
  async esSearch(...args) {
    try {
      const { body } = await this.es.msearch({
        body: args.reduce((p, c) => p.concat({ index: ES_INDEX_NAME }, c), []),
      });
      return body
        .responses
        .reduce((p, c) => p.concat(c.hits.hits), [])
        .reduce((p, c) => {
          if (!p[0].includes(c._source.id)) {
            p[0] = p[0].concat(c._source.id);
            p[1] = p[1].concat({ ...c._source, score: c._score });
          }
          return p;
        }, [[], []])[1]
        .sort((a, b) => b.score - a.score);
    } catch (ex) {
      console.log(C`[ES] {red Search failed: ${ex}}`);
      return [];
    }
  }

  /**
   * Get song metadata from ES by id
   * @param {string} id  - uuidv4 song in
   */
  async getSong(id) {
    return (await this.esSearch({
      query: {
        match: { id },
      },
    }))[0];
  }

  /**
   * Execute ES search
   * @param {string} query - query for lyrics/name/author
   */
  async searchSong(query) {
    return this.esSearch({
      query: {
        match_phrase_prefix: {
          title: query,
        },
      },
    }, {
      query: {
        match_phrase_prefix: {
          text: query,
        },
      },
    });
  }

  /**
   * Check if song with specified name+author already exists in ES
   * @param {{id: string, title: string}} songData - minimum song data
   */
  async exists(songData) {
    return (await this.getSong(songData.id))
      || (await this.esSearch({
        query: {
          match: {
            title: {
              query: songData.title,
              operator: 'and',
            },
          },
        },
      })).length !== 0;
  }
};
