const S3 = require('aws-sdk/clients/s3');
const C = require('chalk');
const {
  Credentials,
} = require('aws-sdk');

const bucketDefault = {
  Bucket: 'music.store',
};


module.exports = class {
  async init(awsParams = {}) {
    if (!awsParams.accessKeyId || !awsParams.secretAccessKey) throw new Error('No YC credentials specified');
    console.log(C`[STORE] {yellow Started initializing of S3 store}`);

    this.s3 = new S3({
      credentials: new Credentials(awsParams.accessKeyId, awsParams.secretAccessKey),
      endpoint: 'storage.yandexcloud.net',
      region: 'ru-central1',
    });
    try {
      await this.s3.createBucket(bucketDefault).promise();
    } catch (BucketAlreadyOwnedByYou) {
      console.log(C`[STORE] {cyan Bucket already created}`);
    }
  }

  async save(Key, Body) {
    await this.s3.upload({
      ...bucketDefault,
      Body,
      Key,
    }).promise();
    console.log(C`[STORE] {green Saved file ${Key}}`);
  }

  async load(Key) {
    const res = await this.s3.getObject({
      ...bucketDefault,
      Key,
    }).promise();
    console.log(C`[STORE] {green Loaded file ${Key}}`);
    return res.Body;
  }
};