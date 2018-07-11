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
var lang="";

app.post('/', function (req, res) {
  let username = req.body.username;
  let password = req.body.password;
  let language = req.body.languages;

  var exists = false;
  db.all(`SELECT Username username, Password password, Language language FROM users`, [], (err, rows) =>{
    if(err){
      return console.error(err.message);
    }
    rows.forEach((row)=>{
        if(req.body.username === row.username){
            exists = true;
            if(req.body.password === row.password){
                console.log("Logging in.");
                /*if(row.language=== "en"){
                    language = "Language: English";
                }else{
                    language = "语言: 中文";
                }*/
                lang = row.language;
                return res.render('home', {language: row.language, username: row.username});
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
                /*if(row.language=== "en"){
                    language = "Language: English";
                }else{
                    language = "语言: 中文";
                }*/
                lang = row.language;
                return res.render('home', {language: row.language, username: row.username});
            }
        });
    }
  });  
});

app.get('/main', function (req, res) {
    res.render('home', {language: null, error: null, username: null});
});

/*app.get('/problem', function (req, res) {

    res.render('problem', {language: null, error: null});
});*/

app.post('/two', function (req, res) {
    console.log(req.body.two + " is clicked.");
    let username = req.body.username;
    res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
});

app.post('/three', function (req, res) {
    console.log(req.body.three + " is clicked.");
    let username = req.body.username;
    res.render('problem', {category: "three", sign: "+", language:lang, hs: "hs3as", username:username});
});

app.post('/twomd', function (req, res) {
    console.log(req.body.twomd + " is clicked.");
    let username = req.body.username;
    res.render('problem', {category: "two", sign: "x", language:lang, hs:"hs2md", username:username});
});

app.post('/threemd', function (req, res) {
    console.log(req.body.threemd + " is clicked.");
    let username = req.body.username;
    res.render('problem', {category: "three", sign: "x", language:lang, hs:"hs3md", username:username});
});

app.post('/tworem', function (req, res) {
    console.log(req.body.tworem + " is clicked.");
    let username = req.body.username;
    res.render('problem', {category: "two", sign: "", language:lang, hs:"hs2rm", username:username});
});

app.post('/threerem', function (req, res) {
    console.log(req.body.threerem + " is clicked.");
    let username = req.body.username;
    res.render('problem', {category: "three", sign: "", language:lang, hs:"hs3rm", username:username});
});

app.post('/back', function (req, res) {
    console.log(req.body.hs);
    console.log(req.body.streak);
    console.log(req.body.lang);
    console.log(req.body.username);
    db.get(`SELECT ` + req.body.hs+ ` FROM users WHERE username = ?`, [req.body.username], function(err, row){
        if (err) {
            return console.log(err.message);
        }else{
            var rowatr;
            if(req.body.hs == "hs2as"){
                rowatr = row.hs2as;
            }
            if(req.body.hs == "hs3as"){
                rowatr = row.hs3as;
            }
            if(req.body.hs == "hs2md"){
                rowatr = row.hs2md;
            }
            if(req.body.hs == "hs3md"){
                rowatr = row.hs3md;
            }
            if(req.body.hs == "hs2rm"){
                rowatr = row.hs2rm;
            }
            if(req.body.hs == "hs3rm"){
                rowatr = row.hs3rm;
            }
            let sql = `UPDATE users 
                    SET totalsolved = totalsolved + `+req.body.streak+`
                    WHERE username = ?`;
            db.run(sql, [req.body.username], function(err) {
                if (err) {
                    return console.log(err.message);
                }else{
                    return console.log("updated total solved!");
                }
            });
            if(rowatr < req.body.streak){
                sql = `UPDATE users 
                            SET `+req.body.hs+` = ?
                            WHERE username = ?`;
                db.run(sql, [req.body.streak, req.body.username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        return console.log("updated high score!");
                    }
                });
                
                
            }else{
                
                return console.log("high score stays the same!");
            }
            
        }
    })
    
    console.log("back is clicked.");
    res.render('home', {language: lang, username:req.body.username});
});

app.post('/logout', function(req, res){
    console.log(req.body.username+ " logged out.");
    res.render('login',{logging: req.body.username +" logged out.", error: null});
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

