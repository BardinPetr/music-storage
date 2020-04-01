import { createServer } from 'http';
import Express from 'express';
import SIO from 'socket.io';
import MS from './src/index';

const app = Express();
const server = createServer(app);
const io = SIO(server);

const musicStorage = new MS(io);
musicStorage.init();

server.listen(3000);
