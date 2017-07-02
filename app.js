const CONFIG = require('config');
const SERVER_CONFIG = CONFIG.get('server');
const REDIS_CONFIG = CONFIG.get('redis');
const LOGGER_CONFIG = CONFIG.get('logger');
const WORKERS_COUNT = CONFIG.get('workersCount');
const HISTORY_TTL = CONFIG.get('historyTTL');
var Promise = require('bluebird');
var Redis = require('ioredis');
var redis = new Redis(REDIS_CONFIG);
var cluster = require('cluster');
var express = require('express');
var bodyParser = require('body-parser')
var compression = require('compression');
var shortid = require('shortid');
var log4js = require('log4js');
var logger;
log4js.configure({
  appenders: [
    LOGGER_CONFIG.stdout && { type: 'stdout' },
    LOGGER_CONFIG.file && Object.assign({ type: 'file' }, LOGGER_CONFIG.file)
  ].filter(a => a)
});
logger = log4js.getLogger(LOGGER_CONFIG.category);
logger.setLevel(LOGGER_CONFIG.level);

function getAllMessages() {
  return redis.zrange('messages', 0, -1);
}

function deleteExpiredMessages() {
  return deleteMessagesOlderThan(HISTORY_TTL);
}

function deleteAllMessages() {
  return redis.zremrangebyrank('messages', 0, -1);
}

function deleteMessagesOlderThan(ageInSeconds) {
  var timestampUpperBound = Math.round(Date.now() / 1000) - ageInSeconds;
  return redis.zremrangebyscore('messages', 0, timestampUpperBound);
}

function createMessage({ user, message }) {
  if (!isValidUser(user) || !isValidMessage(message)) {
    return Promise.reject('Invalid message attributes');
  }

  var item = {
    id: shortid.generate(),
    timestamp: Math.round(Date.now() / 1000),
    user: user,
    message: message
  };

  return redis.zadd('messages', item.timestamp, JSON.stringify(item));
}

function isValidUser(str) {
  // Non-empty string of printable standard-ASCII characters except space
  return typeof(str) === 'string' && /^[\x21-\x7E]{1,}$/.test(str);
}

function isValidMessage(str) {
  // Non-blank string
  return typeof(str) === 'string' && /\S/.test(str);
}

if (cluster.isMaster) {
  logger.debug('Starting master...');

  for (var i = 0; i < WORKERS_COUNT; i++) {
    cluster.fork();
  }
} else {
  logger.debug('Starting worker ' + cluster.worker.id);

  var app = express();

  var urlencodedParser = bodyParser.urlencoded({
    type: 'application/x-www-form-urlencoded', extended: false
  });

  app.disable('etag');
  app.use(compression());

  app.get('/', function(req, res) {
    // Deleting expired messages here for the sake of simplicity
    deleteExpiredMessages()
      .then(getAllMessages)
      .map((o) => (({ user, message }) => ({ user, message }))(JSON.parse(o)))
      .then((result) => res.status(200).json({ status: 'OK', result: result }))
      .catch((err) => res.status(200).json({ status: 'ERROR' }));
  });

  app.post('/', urlencodedParser, function(req, res) {
    createMessage({ "user": req.body.user, "message": req.body.message })
      .then(() => res.status(200).json({ status: 'OK' }))
      .catch((err) => res.status(200).json({ status: 'ERROR' }));
  });

  app.delete('/', function(req, res) {
    deleteAllMessages()
      .then(() => res.status(200).json({ status: 'OK' }))
      .catch((err) => res.status(200).json({ status: 'ERROR' }));
  });

  app.listen(SERVER_CONFIG.get('port'), SERVER_CONFIG.get('host'));
}
