const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const sqlite3 = require('sqlite3').verbose();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('login', {logging: null, language: "en", error: null});
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
  console.log(language);
  
  

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
                if(language === undefined){
                    language = row.language;
                }
                if(language !== row.language){
                    db.run(`UPDATE users SET language = ? WHERE username = ?`, [language, req.body.username], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            return console.log("updated language to "+language);
                        }
                    });
                }
                
                lang = row.language;
                return res.render('home', {language: language, username: row.username, selection:true});
            }else{
                res.render('login', {logging: `Wrong password, ${username}!`, language:row.language, error: null});
                console.log("Wrong password.");
            }
        }        
    });
    if(!exists){
        if(language === undefined){
            language = "en";
        }
        db.run(`INSERT INTO users(username, password, language, hs2as, hs3as, hs2md, hs3md, hs2rm, hs3rm, totalsolved) VALUES (?,?,?,?,?,?,?,?,?,?)`, [username,password,language, 0, 0, 0, 0, 0, 0, 0], function(err) {
            if (err) {
                res.render('login', {logging: null, language:req.body.language, error: 'Error, please try again'});
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
                lang = language;
                return res.render('home', {language: language, username: req.body.username, selection:true});
            }
        });
    }
  });  
});

app.get('/main', function (req, res) {
    res.render('home', {language: null, error: null, username: null, selection:null});
});

app.post('/language', function (req, res) {
    let language = req.body.language;
    if(language === "English"){
        lang = "zh";
    }else{
        lang = "en";
    }
    db.run(`UPDATE users SET language = ? WHERE username = ?`, [lang, req.body.username], function(err) {
        if (err) {
            return console.log(err.message);
        }
    });
    if(req.body.title === "Quick Math"){
        if(req.body.selection === "selection"){
            res.render('home', {language:lang, username:req.body.username, selection:true});
        }
        if(req.body.selection === "logpg"){
            res.render('home', {language:lang, username:req.body.username, selection:false});
        }
    }
    if(req.body.title === "Leaderboard"){
        if(req.body.selection === "selection"){
            res.render('leaderboard',{username: req.body.username, language:lang, selection: true, datauser: null, datahs: null, category: null, error: null});
        }
        if(req.body.selection === "ranking"){
            var category = req.body.category;
            var usernames = [];
            var highscores = [];
            db.all(`SELECT * FROM users ORDER BY `+category+` DESC`, [], (err, rows) =>{
                if(err){
                return console.error(err.message);
                }else{ 
                    rows.forEach((row)=>{
                        var rowatr;
                        if(category === "hs2as"){
                            rowatr = row.hs2as;
                        }
                        if(category === "hs3as"){
                            rowatr = row.hs3as;
                        }
                        if(category === "hs2md"){
                            rowatr = row.hs2md;
                        }
                        if(category === "hs3md"){
                            rowatr = row.hs3md;
                        }
                        if(category === "hs2rm"){
                            rowatr = row.hs2rm;
                        }
                        if(category === "hs3rm"){
                            rowatr = row.hs3rm;
                        }
                        usernames.push(row.username);
                        highscores.push(rowatr);
                    }); 
                    res.render('leaderboard',{username: req.body.username, language:lang, selection:false, datauser: usernames, datahs: highscores, category:category, error: null});
                }
            });
        }
    }
});

app.post('/two', function (req, res) {
    let username = req.body.username;
    if(req.body.title === "Quick Math"){
        var date = new Date();
        var current_time = date.getTime();
        console.log(current_time);
        var session = username +""+ current_time + "hs2as";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs2as")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
                res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username, session:session});
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore2as = [];
        db.all(`SELECT username, hs2as FROM users ORDER BY hs2as DESC`, [], (err, rows) =>{
            if(err){
              return console.error(err.message);
            }else{
                rows.forEach((row)=>{
                    usernames.push(row.username);
                    highscore2as.push(row.hs2as);
                }); 
                res.render('leaderboard',{username: req.body.username, language:lang, selection:false, datauser: usernames, datahs: highscore2as, category:"hs2as", error: null});
            }
        });
    }
});

app.post('/three', function (req, res) {
    let username = req.body.username;
    if(req.body.title === "Quick Math"){
        var date = new Date();
        var current_time = date.getTime();
        console.log(current_time);
        var session = username +""+ current_time + "hs2as";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs2as")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
                res.render('problem', {category: "three", sign: "+", language:lang, hs: "hs3as", username:username, session:session});
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore3as = [];
        db.all(`SELECT username, hs3as FROM users ORDER BY hs3as DESC`, [], (err, rows) =>{
            if(err){
              return console.error(err.message);
            }else{
                rows.forEach((row)=>{
                    usernames.push(row.username);
                    highscore3as.push(row.hs3as);
                }); 
                res.render('leaderboard',{username: req.body.username, language:lang, selection:false, datauser: usernames, datahs: highscore3as, category:"hs3as", error: null});
            }
        });
    }
});

app.post('/twomd', function (req, res) {
    let username = req.body.username;
    if(req.body.title === "Quick Math"){
        var date = new Date();
        var current_time = date.getTime();
        console.log(current_time);
        var session = username +""+ current_time + "hs2as";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs2as")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
                res.render('problem', {category: "two", sign: "x", language:lang, hs:"hs2md", username:username, session:session});
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore2md = [];
        db.all(`SELECT username, hs2md FROM users ORDER BY hs2md DESC`, [], (err, rows) =>{
            if(err){
              return console.error(err.message);
            }else{
                rows.forEach((row)=>{
                    usernames.push(row.username);
                    highscore2md.push(row.hs2md);
                }); 
                res.render('leaderboard',{username: req.body.username, language:lang, selection:false, datauser: usernames, datahs: highscore2md, category:"hs2md", error: null});
            }
        });
    }
});

app.post('/threemd', function (req, res) {
    let username = req.body.username;
    if(req.body.title === "Quick Math"){
        var date = new Date();
        var current_time = date.getTime();
        console.log(current_time);
        var session = username +""+ current_time + "hs2as";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs2as")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
                res.render('problem', {category: "three", sign: "x", language:lang, hs:"hs3md", username:username, session:session});
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore3md = [];
        db.all(`SELECT username, hs3md FROM users ORDER BY hs3md DESC`, [], (err, rows) =>{
            if(err){
              return console.error(err.message);
            }else{
                rows.forEach((row)=>{
                    usernames.push(row.username);
                    highscore3md.push(row.hs3md);
                }); 
                res.render('leaderboard',{username: req.body.username, language:lang, selection:false, datauser: usernames, datahs: highscore3md, category:"hs3md", error: null});
            }
        });
    }
});

app.post('/tworem', function (req, res) {
    let username = req.body.username;
    if(req.body.title === "Quick Math"){
        var date = new Date();
        var current_time = date.getTime();
        console.log(current_time);
        var session = username +""+ current_time + "hs2as";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs2as")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
                res.render('problem', {category: "two", sign: "", language:lang, hs:"hs2rm", username:username, session:session});
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore2rm = [];
        db.all(`SELECT username, hs2rm FROM users ORDER BY hs2rm DESC`, [], (err, rows) =>{
            if(err){
              return console.error(err.message);
            }else{
                rows.forEach((row)=>{
                    usernames.push(row.username);
                    highscore2rm.push(row.hs2rm);
                }); 
                res.render('leaderboard',{username: req.body.username, language:lang, selection:false, datauser: usernames, datahs: highscore2rm, category:"hs2rm", error: null});
            }
        });
    }
});

app.post('/threerem', function (req, res) {
    let username = req.body.username;
    if(req.body.title === "Quick Math"){
        var date = new Date();
        var current_time = date.getTime();
        console.log(current_time);
        var session = username +""+ current_time + "hs2as";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs2as")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
                res.render('problem', {category: "three", sign: "", language:lang, hs:"hs3rm", username:username, session:session});
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore3rm = [];
        db.all(`SELECT username, hs3rm FROM users ORDER BY hs3rm DESC`, [], (err, rows) =>{
            if(err){
              return console.error(err.message);
            }else{
                rows.forEach((row)=>{
                    usernames.push(row.username);
                    highscore3rm.push(row.hs3rm);
                }); 
                res.render('leaderboard',{username: req.body.username, language:lang, selection:false, datauser: usernames, datahs: highscore3rm, category:"hs3rm", error: null});
            }
        });
    }
});

app.post('/back', function (req, res) {
    if(req.body.title === "Problem"){
        db.get(`SELECT ` + req.body.hs+ ` FROM users WHERE username = ?`, [req.body.username], function(err, row){
            if (err) {
                return console.log(err.message);
            }else{
                var rowatr;
                if(req.body.hs === "hs2as"){
                    rowatr = row.hs2as;
                }
                if(req.body.hs === "hs3as"){
                    rowatr = row.hs3as;
                }
                if(req.body.hs === "hs2md"){
                    rowatr = row.hs2md;
                }
                if(req.body.hs === "hs3md"){
                    rowatr = row.hs3md;
                }
                if(req.body.hs === "hs2rm"){
                    rowatr = row.hs2rm;
                }
                if(req.body.hs === "hs3rm"){
                    rowatr = row.hs3rm;
                }
                if(req.body.streaktotal>0){
                    //console.log(req.body.streaktotal);
                    let sql = `UPDATE users 
                            SET totalsolved = totalsolved + `+req.body.streaktotal+`
                            WHERE username = ?`;
                    db.run(sql, [req.body.username], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            return console.log("updated total solved!");
                        }
                    });
                    db.run(`UPDATE problog SET category = ?, numsolved = ?, timeend = CURRENT_TIMESTAMP WHERE customID = ?`, [req.body.hs, req.body.streaktotal, req.body.session], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            console.log(`A row has been inserted with rowid ${this.lastID}`);
                            //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                        }
                    });
                }else{
                    db.run(`DELETE FROM problog WHERE customID = ?`, [req.body.session], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            console.log(`A row has been deleted.`);
                            //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                        }
                    });
                }
                if(rowatr < req.body.higheststreak){
                    sql = `UPDATE users 
                                SET `+req.body.hs+` = ?
                                WHERE username = ?`;
                    db.run(sql, [req.body.higheststreak, req.body.username], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            return console.log("updated high score!");
                        }
                    });                
                }    
            }
        })
        res.render('home', {language:lang, username:req.body.username, selection:true});
    }
});

app.post('/backl', function(req, res){
    if(req.body.selection === "selection"){
        res.render('home',{username: req.body.username, language:lang, selection:true});
    }
    if(req.body.selection === "ranking"){
        res.render('leaderboard',{username: req.body.username, language:lang, selection: true, datauser: null, datahs: null, category: null, error: null});
    }
    if(req.body.selection === "logpg"){
        res.render('home',{username: req.body.username, language:lang, selection: true});
    }
    if(req.body.selection === "log"){
        res.render('home',{username: req.body.username, language:lang, selection: false});
    }
});

app.post('/logout', function(req, res){
    console.log(req.body.username+ " logged out.");
    if(lang === "en"){
        res.render('login',{logging: req.body.username +" logged out.", language:lang, error: null});
    }
    if(lang === "zh"){
        res.render('login', {logging: req.body.username +" 下线了.", language:lang, error: null});
    }
});

app.post('/leaderboard', function(req, res){
    //console.log("Updating leaderboard.");
    res.render('leaderboard',{username: req.body.username, language:lang, selection: true, datauser: null, datahs: null, category: null, error: null});
});

app.post('/log', function(req, res){
    res.render('home',{username: req.body.username, language:lang, selection: false, error: null});
});

app.post('/full', function(req, res){
    var usernames = [];
    var timestarts = [];
    var categories = [];
    var numsolveds = [];
    var timespent = [];
    db.all(`SELECT * FROM problog WHERE username = ?`, [req.body.username], (err, rows) =>{
        if(err){
          return console.error(err.message);
        }else{
            rows.forEach((row)=>{
                usernames.push(row.username);
                timestarts.push(row.timestart);
                categories.push(row.category);
                numsolveds.push(row.numsolved);
                var d2 = new Date(row.timeend);
                var d1 = new Date(row.timestart);
                var seconds = (d2-d1)/1000;
                timespent.push(seconds);
            }); 
            res.render('log',{username: req.body.username, language:lang, selection:false, datauser: usernames, datatstart: timestarts, category: categories, num: numsolveds, datatspent: timespent, logtype: "Full"});
        }
    });
});

app.post('/daily', function(req, res){//WHERE timestamp >= CURDATE()
    db.all(`SELECT * FROM problog WHERE timestart >= CURDATE()`, [], (err, rows) =>{
        if(err){
          return console.error(err.message);
        }else{
            var totaltime = 0;
            var totalsolved = 0;
            rows.forEach((row)=>{
                categories.push(row.category);
                totalsolved+=row.numsolved;
                var d2 = new Date(row.timeend);
                var d1 = new Date(row.timestart);
                var seconds = (d2-d1)/1000;
                totaltime+=seconds;
            }); 
            res.render('log',{username: req.body.username, language:lang, selection:false, datauser: null, datatstart: timestarts, category: categories, num: numsolveds, datatspent: timespent, logtype: "Full"});
        }
    });
    res.render('log',{username: req.body.username, language:lang, selection:false, datauser: usernames, datatstart: timestarts, category: categories, num: numsolveds, datatspent: totaltime, logtype: "Daily"});
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

