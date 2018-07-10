const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const sqlite3 = require('sqlite3').verbose();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

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
  
  db.each(`SELECT Username username, Password password FROM users`, [], (err, row) =>{
      if(err){
        return console.error(err.message);
      }
      //console.log(`${row.username} ${row.password} - ${row.language}`);
      if(username == row.username && password == row.password){
          console.log("Logging in.");
          res.render('two');
      }
      if(username == row.username && password != row.password){
          console.log("Wrong password.");
      }
      if(username != row.username){
        db.run(`INSERT INTO users(username, password, language) VALUES (?,?,?)`, [username,password,req.body.languages], function(err) {
            if (err) {
                res.render('login', {logging: null, error: 'Error, please try again'});
                return console.log(err.message);
            }else{
                let successText = `Successful login, ${username}!`;
                // get the last insert id
                res.render('login', {logging: successText, error: null});
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
      }
  });
  
  
  
})


app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

