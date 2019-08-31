const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const fetch = require('node-fetch');
const moment = require('moment');



mongoose.connect('mongodb://localhost/newsgrid', {useNewUrlParser:true});

const UserSchema = mongoose.Schema({ 
  username: String,
  password: String
})

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));

//===========================
// PASSPORT SETUP
//===========================

app.use(require('express-session')({
    secret: process.env.SECRET,
    resave: false,
    saveUnitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//===========================

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.moment = moment;
  next();
})



app.get('/', (req, res) => {
  res.send('root page')
})

app.get('/home',  (req ,res) => {
  const allNews = newsFinder('general', 'us');  
  Promise.all([allNews]).then(function(results) {
    res.render('index', {allNews: results[0]})
  })
})  


  
app.get('/business', async function(req ,res) {
  const allNews = await newsFinder('business', 'us').then((data) => data);
  res.render('index', {allNews: allNews})
})  

app.get('/sports', async function(req ,res) {
  const allNews = await newsFinder('sports', 'in').then((data) => data);
  res.render('index', {allNews: allNews})
})  

app.get('/technology', async function(req ,res) {
  const allNews = await newsFinder('technology', 'us').then((data) => data);
  res.render('index', {allNews: allNews})
})  

app.get('/entertainment', async function(req ,res) {
  const allNews = await newsFinder('entertainment', 'in').then((data) => data);
  res.render('index', {allNews: allNews})
}) 

app.get('/india', async function(req ,res) {
  const allNews = await newsFinderIndia().then((data) => data);
  res.render('index', {allNews: allNews})
})  

app.get('/blogs', (req, res) => {
  res.render('blogs')
})



app.get('/register', (req ,res) => {
  res.render('register')
})

app.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.register(new User({
    username: username
  }), password, (err, user) => {
    if(err) {
      console.log(err)
      return res.redirect('/register')
    } else {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/home');
      })
    }
  })
})


app.get('/login', (req ,res) => {
  res.render('login')
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login'
}))


app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/home')
})

const API = process.env.API_KEY 

async function newsFinder(category, country) {
  let response = await fetch(`https://newsapi.org/v2/top-headlines?category=${category}&country=${country}&pageSize=36&apiKey=${API}`);
  let data = await response.json();
  return data.articles;
}

async function newsFinderIndia() {
  let response = await fetch(`https://newsapi.org/v2/everything?q=india&pageSize=36&apiKey=${API}`);
  let data = await response.json();
  return data.articles;
}



app.listen(process.env.PORT, process.env.IP, () => {
  console.log('SERVER STARTED!!')
})