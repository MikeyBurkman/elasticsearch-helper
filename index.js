'use strict';

const elasticsearch = require('elasticsearch');
const CronJob = require('cron').CronJob;

const INDEX_TYPES = {
  single: null,
  daily: '0 0 0 * * *', // Every day at midnight
  monthly: '0 0 0 1 * *' // Midnight on the first day of every month
};

exports.buildSender = function(opts) {
  opts = opts || {};

  const host = opts.host;
  const indexName = opts.indexName;
  const indexShape = opts.indexShape;
  const recordType = opts.recordType;
  const indexType = opts.indexType || 'single';
  const esLogLevel = opts.esLogLevel || 'info';

  if (!host) {
    throw new Error('Must provide an "opts.host" string');
  }

  if (!indexName) {
    throw new Error('Must provide an "opts.indexPrefix" string');
  }

  if (!indexShape) {
    throw new Error('Must provide an "opts.indexShape" object');
  }

  if (Object.keys(INDEX_TYPES).indexOf(indexType) === -1) {
    throw new Error('Invalid "opts.indexType" string; must be one of ' + 
      JSON.stringify(Object.keys(INDEX_TYPES)));
  }

  const client = new elasticsearch.Client({
    host: host,
    log: esLogLevel
  });

  const indexCronTime = INDEX_TYPES[indexType];

  let indexInfo = newIndex();

  if (indexCronTime) {
    // Create a new index every so often
    new CronJob({
      cronTime: indexCronTime,
      onTick: function() {
        indexInfo = newIndex(); 
      },
      start: true
    });
  }

  return send;

  ////

  function send(records) {
    const toSend = [];
    records.forEach(function(records) {
      toSend.push(indexInfo.headerItem);
      toSend.push(records);
    });

    return indexInfo.createIndexPromise // Make sure the index is created before anything else
      .then(function() {
        return client.bulk({
          body: toSend
        });
      });

  };

  function newIndex() {
    const newIndexName = getCurrentIndexName();
    return {
      headerItem: { 
        index: {
          _index: newIndexName, 
          _type: recordType 
        } 
      },
      createIndexPromise: createIndexInES(client, newIndexName, recordType)
    };
  }

  // Gets the name of the index that any record created right now should use
  function getCurrentIndexName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const date = pad(now.getDate());

    switch (indexType) {
      case 'single': 
        return indexName;
      case 'monthly':
          return `${indexName}-${year}-${month}`;
      case 'daily':
        return `${indexName}-${year}-${month}-${date}`;
      default:
        throw new Error('Should never be here if indexType is validated: ' + indexType);
    }
  }

  function pad(num) {
    return num < 10 ? '0' + num : '' + num;
  }

};

// Creates the necessary Elasticsearch index if it doesn't alreay exist
function createIndexInES(client, indexName, type, shape) {

  const mappings = {
    [type]: {
      properties: shape
    }
  };

  return client.indices.create({
    index: indexName,
    body: {
      mappings: mappings
    }
  })
  .catch(function(err) {
    // We only care if the error is something other than the index already existing
    if (err.message.indexOf('index_already_exists_exception') === -1) {
      throw err;
    }
  });
}
