# Elasticsearch Sender

### Why?
Sending bulk data to Elasticsearch is common, but is not easy to do with the official ES client.
In particular, creating new indexes for time-based data is not trivial. In ES, it is very inefficient
to delete records by a query, and it is [recommended in the official docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/_deleting_documents.html) that you delete
by index instead. This of course requires you to keep creating and writing data to the correct index. This
library will handle that for you.

### Usage
```js
const esSend = require('elasticsearch-sender').buildSender({
    host: 'myElasticsearchHost.com',
    indexName: 'my-index',
    indexType: 'monthly',
    indexShape: {
        name: { type: 'string', index: 'not_analyzed' },
        numProcessed: { type: 'integer' },
        created: { type: 'date'}
    },
    recordType: 'myRecordType'
});

...

esSend([{
    name: 'foo service',
    numProcessed: 42,
    created: new Date().toISOString()
}, {
    name: 'bar service',
    numProcessed: 2,
    created: new Date().toISOString() 
}])
.then(() => console.log('Items sent to Elasticsearch'));
```

### buildSender(opts)
Builds a sender function that will automatically handle bulk processing and indexing
##### Opts
- `host` Required. The Elasticsearch hostname
- `indexName` Required. Will be used when creating an index. Must be all lowercase.
- `indexShape` Required. An object describing indexes for the records being sent to ES. This is used for the `properties` field when creating the index in ES.
- `indexType` Required. Must be one of `'monthly'`, `'daily'`, or `'single'`. Controls the granularity of indexes. For instance, if `'daily'`, then a record created on Jan 25 2018 will be sent to the index named `'${indexPrefix}-2018-01-25'`. (This index will be automatically created as needed.) `'monthly'` will only have the year and month in the index name. `'single'` means only a single index called `${indexPrefix}` will be ever be created and used.
- `recordType` Required. The `_type` value for each record in Elasticsearch.
- `esLogLevel` Optional. The log level for the Elasticsearch client. Defaults to `'info'`

This returns a function that takes in an array of items and sends them all to Elasticsearch.
