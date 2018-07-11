const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const sqlite3 = require('sqlite3').verbose();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('login', {logging: null, error: null});
})



//open the database
let db = new sqlite3.Database('./db/quickmath.db', sqlite3.OPEN_READWRITE, (err) => {
    if(err){
        return console.error(err.message);
    }
    console.log('Connected to the quickmath database.');
});

app.post('/', function (req, res) {
  let username = req.body.username;
  let password = req.body.password;
  let language = req.body.languages;

  //console.log(username+" "+password+" "+language);

  var exists = false;
  
  /*db.each(`SELECT Username username, Password password FROM users WHERE username = ?`, [username], (err, row) =>{
      if(err){
        return console.error(err.message);
      }
      //console.log(`${row.username} ${row.password} - ${row.language}`);
      if(req.body.password == row.password){
          exists = true;
          console.log("Logging in.");
          return res.redirect('/main');
      }
      else{
          exists = true;
          console.log("Wrong password.");
      }
      
  });*/
  db.all(`SELECT Username username, Password password FROM users`, [], (err, rows) =>{
    if(err){
      return console.error(err.message);
    }
    rows.forEach((row)=>{
        if(req.body.username === row.username){
            exists = true;
            if(req.body.password === row.password){
                console.log("Logging in.");
                return res.redirect('/main');
            }else{
                res.render('login', {logging: `Wrong password, ${username}!`, error: null});
                console.log("Wrong password.");
            }
        }        
    });
    if(!exists){
        db.run(`INSERT INTO users(username, password, language, hs2as, hs3as, hs2md, hs3md, hs2rm, hs3rm, totalsolved) VALUES (?,?,?,?,?,?,?,?,?,?)`, [username,password,req.body.languages, 0, 0, 0, 0, 0, 0, 0], function(err) {
            if (err) {
                res.render('login', {logging: null, error: 'Error, please try again'});
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
                return res.redirect('/main');

            }
        });
    }
  });  
});

app.get('/main', function (req, res) {
    res.render('home', {logging: null, error: null});
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

