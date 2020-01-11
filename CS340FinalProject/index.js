var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var mysql = require('./dbcon.js');

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
//Make sure to change this when moving from localhost to FLIP
app.set('port', process.argv[2] || 3000);
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use('/chemical', require('./chemical.js'));
app.use('/container', require('./container.js'));
app.use('/rack', require('./rack.js'));
app.use('/containerType', require('./containerType.js'));
app.use('/rackType', require('./rackType.js'));
app.set('mysql', mysql);

app.get('/', function(req, res){
    res.render('home');
});

/*app.get('/chemical', function(req, res){
  res.render('chemical');
});

app.get('/container', function(req, res){
  res.render('container');
});

app.get('/containerType', function(req, res){
  res.render('containerType');
});

app.get('/rack', function(req, res){
  res.render('rack');
});

app.get('/rackType', function(req, res){
  res.render('rackType');
});*/

app.use(function(req,res){
    res.status(404);
    res.render('404');
  });

  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
  });

app.listen(app.get('port'), function(){
    console.log('Express started press Ctrl-C to terminate');
});
