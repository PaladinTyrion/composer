var http = require('http');
var express = require('express');
// var path = require('path');

var CommonJSServer = require("substance-application/commonjs");
var Converter = require("substance-converter");

var fs = require("fs");

var app = express();

var commonJSServer = new CommonJSServer(__dirname);
commonJSServer.boot({alias: "substance", source: "./src/boot.js"});


var port = process.env.PORT || 3000;
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());

app.get("/",
  function(req, res, next) {

    var template = fs.readFileSync(__dirname + "/index.html", 'utf8');

    var scripts = commonJSServer.list();

    var scriptsTags = scripts.map(function(script) {
      return ['<script type="text/javascript" src="/scripts', script, '"></script>'].join('');
    }).join('\n');

    var result = template.replace('#####scripts#####', scriptsTags);

    res.send(result);
  }
);

app.use('/lib', express.static('lib'));
app.use('/lib/substance', express.static('node_modules'));
app.use('/styles', express.static('styles'));
app.use('/src', express.static('src'));
app.use('/data', express.static('data'));
app.use('/config', express.static('config'));
app.use('/node_modules', express.static('node_modules'));

app.get("/scripts*",
  function(req, res, next) {
    var scriptPath = req.params[0];
    res.type('text/javascript');
    try {
      var script = commonJSServer.getScript(scriptPath);
      res.send(script);
    } catch (err) {
      res.send(err.stack);
    }
  }
);

// Serve the Substance Converter
// --------

var converter = new Converter.Server(app);
converter.serve();


// Serve the docs
// --------

app.get('/docs/index.json', function(req, res) {
  res.json([
    {
      id: "introduction.json",
      title: "Substance Introduction (Draft)"
    },
    {
      id: "handbook.json",
      title: "Substance Handbook (Draft)"
    }
  ]);
});


// Serve a doc from the docs folder (powered by on the fly markdown->substance conversion)
// --------

app.get('/docs/:doc.json', function(req, res) {
  var docId = req.params.doc;
  
  var inputData = fs.readFileSync(__dirname + "/node_modules/substance-docs/"+docId+".md", 'utf8');
  converter.convert(inputData, 'markdown', 'substance', function(err, output) {
    if (err) return res.send(500, err);
    res.send(output);
  });
});



app.use(app.router);

http.createServer(app).listen(port, function(){
  console.log("Substance-Box running on port " + port)
  console.log("http://127.0.0.1:"+port+"/");
});
