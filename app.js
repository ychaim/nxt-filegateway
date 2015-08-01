// Requirements
var http = require('http');
var fs = require('fs');
var express = require('express');
var Log = require('log');
var log = new Log();

var config = require('./lib/config');
var nxt = require('./lib/nxt');

// HTTP Server
var app = express();
app.set('port', config.port);
var server = http.createServer(app);
server.listen(app.get('port'), function(err, result) {
  log.info('Server listening on port ' + app.get('port'));
});

var sendHtmlFile = function(res, file) {
  fs.readFile(file, function(err, data) {
    if (err) {
      return log.error(err);
    }
    res.header('Content-Type', 'text/html');
    res.send(data);
  });
};

// Routes
app.get('/', function(req, res, next) {
  sendHtmlFile(res, 'views/index.html');
});

app.get('/tag/*', function(req, res, next) {
  sendHtmlFile(res, 'views/tag.html');
});

app.get('/channel/*', function(req, res, next) {
  sendHtmlFile(res, 'views/channel.html');
});

app.get('/file/*', function(req, res, next) {
  var txId = req.params[0];
  var query = {
    requestType: 'getTaggedData',
    transaction: txId,
  };
  nxt.call(query, function(err, resp) {
    if (err) {
      res.status(500);
      res.send(err);
      return;
    }
    if (!resp.transaction) {
      res.status(404);
      res.send('Not found');
      return;
    }

    // Use provided mime type if valid, otherwise application/octet-stream
    var mimeType = resp.type.match(/^[-\w+]+\/[-\w+]+$/)
      ? resp.type
      : 'application/octet-stream';
    res.contentType(mimeType);

    // Convert data to buffer if hex encoded, otherwise send raw data
    var data = resp.data.match(/^[0-9a-f]+$/i)
      ? new Buffer(resp.data, 'hex')
      : resp.data;

    res.send(data);
  });
});

