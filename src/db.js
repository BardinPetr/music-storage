/* eslint-disable class-methods-use-this */
const ESClient = require('@elastic/elasticsearch').Client;
const { Sequelize } = require('sequelize');
const C = require('chalk');

const { User, Composition } = require('./models');

const ES_INDEX_NAME = 'music-storage';
const ES_MAPPING = {
  index: 'x',
  body: {
    properties: {
      id: {
        type: 'keyword',
        index: false,
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

module.exports = class {
  async init(credentials) {
    this.es = new ESClient({ node: credentials.esnodeAddr });

    await this.es.indices.create({
      index: ES_INDEX_NAME,
    }).catch(() => console.log(C`[ES] {cyan Index found}`));
    await this.es.indices.putMapping(ES_MAPPING);
    await this.es.indices.refresh({ index: ES_INDEX_NAME });
    console.log(C`[ES] {green Elasticsearch connected}`);

    this.sequelize = new Sequelize(credentials.mysqlConn);
    await this.sequelize.authenticate();
    await this.sequelize.sync();
    console.log(C`[MYSQL] {green DB connected}`);
  }

  async createUser(userData) {
    return User.create(userData);
  }

  async getUser(userId) {
    return User.findOne({ where: { id: userId }, include: Composition });
  }

  async appendPlaylist(userId, songId) {
    return User.findByPk(userId).addComposition(Composition.findByPk(songId));
  }

  async removeFromPlaylist(userId, songId) {
    return User.findByPk(userId).removeComposition(Composition.findByPk(songId));
  }

  async addComposition(songData) {
    return Composition.create(songData);
  }

  async indexComposition(body) {
    return this.es.index({
      index: ES_INDEX_NAME,
      body,
    });
  }

  async getCompositionFromIndex(id) {
    return this.es.search({
      index: ES_INDEX_NAME,
      body: {
        query: {
          match: { id },
        },
      },
    });
  }

  async searchComposition(query) {
    return this.es.search({
      index: ES_INDEX_NAME,
      body: {
        query: {
          match: { name: query },
        },
      },
    });
  }
};
