/**
 * Module dependencies.
 */

var express = require('express');
var bodyParser = require('body-parser')
var serveIndex = require('serve-index');
var logger = require('morgan');
var fs = require('fs');
var app = express();

var argv = require('minimist')(process.argv.slice(2), {alias: {'port': 'p'}});
var port = argv.port || process.env.PORT || 3000;

// log requests
app.use(logger('dev'));

// Declare for parsing requests
app.use(bodyParser());


app.get('/features.geojson', function(request, response) {
  response.contentType('application/json');
  fs.readFile('assets/data/features.geojson', function(err, data){
    response.send(data.toString());
  });
});

app.post('/features.geojson', function(req, resp) {
  resp.contentType('application/json');
  var path = './assets/data/features.geojson';

  var json = JSON.stringify(req.body, function(k,v) {
    if (typeof v == 'string') {
      var f = parseFloat(v);
      return !isNaN(f) ? f : v;
    }
    return v;
  });


  fs.writeFile(path, json, function(err) {
    var msgOk = 'The file was saved!';
    var msgFail = 'The file was saved!';
    if(err) {
        console.log(err);
        resp.send(msgFail);
    } else {
        console.log(msgOk);
        resp.send(msgOk);
    }
  });
});

// serve static files with navigable links
// filter to chapters, sandbox and html files
app.use(serveIndex(__dirname, {
  icons: true,
  view: 'details',
  filter: function(path) {
    var chapter = path.indexOf('chapter') == 0;
    var sandbox = path.indexOf('sandbox') == 0;
    var html = path.slice(-5) == '.html';
    return chapter || sandbox || html;
  }
}));

app.use(express.static(__dirname));

app.listen(port);
console.log('listening on port', port);