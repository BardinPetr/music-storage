import {
  S3,
  Credentials,
} from 'aws-sdk/clients/s3';
import {
  config as denvConfig,
} from 'dotenv';

denvConfig();

const bucketDefault = {
  Bucket: 'music_store',
};


export default class {
  constructor(accessKeyId, secretAccessKey) {
    this.s3 = new S3({
      credentials: new Credentials(accessKeyId, secretAccessKey),
      endpoint: 'storage.yandexcloud.net',
      region: 'ru-central1',
    });
  }

  async init() {
    this.s3.createBucket(bucketDefault, (err, data) => {

    });
  }
}