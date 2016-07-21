

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var routes = require('./routes/index');


var app = express();


var Marketcloud = require('marketcloud-node');

var mc = new Marketcloud.Client({
    public_key : process.env.MARKETCLOUD_PUBLIC_KEY,
    secret_key : process.env.MARKETCLOUD_SECRET_KEY
})
console.log("STARTING MARKETCLOUD WITH PKEY "+process.env.MARKETCLOUD_PUBLIC_KEY)
app.set('marketcloud',mc);


// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');




/**********************************
        SESSION CONFIG
***********************************/



app.use(session({
    cookie : {maxAge : 24*3600*1000*30},
    ttl : 24 * 60 * 60 , //1 day
    name : '_mc_frontend_sessid',
    secret: 'oasijdi0jw80dj1nc1hf18u9820310d1dj08810948n184d198s1131dk1di',
    saveUninitialized : true,    
    resave:false
}));



var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public/')));


app.use(function(req,res,next){


    var getCartPromise = function(){
        if (req.session.hasOwnProperty('cart_id')){
        console.log("Cart recovered")
            return req.app.get('marketcloud').carts.getById(req.session.cart_id)
        }
        else{
            console.log("No cart was found, creating one.")
            return req.app.get('marketcloud').carts.create()
        }
    }

    getCartPromise()
    .then(function(response){
        req.app.locals.cart = response;
        req.session.cart_id = response.id
        next()
    })  
    .catch(function(response){

        console.log("Un errore nel recuperare un carrello")
        next(response)
    })
    
})


app.use(function(req,res,next){
    mc.categories.list({})
    .then(function(response){
        req.app.locals.categories = response;
        next()
    })
    .catch(function(response){
        // We keep goin
        req.app.locals.categories = [];
        next()
    })
})
app.use('/', routes);


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log(err.stack)
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    console.log(err.stack)
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});


module.exports = app;