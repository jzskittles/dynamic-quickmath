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
    if(req.body.logtype === "Full"){
        var usernames = [];
        var timestarts = [];
        var categories = [];
        var numsolveds = [];
        var timespent = [];
        db.all(`SELECT * FROM problog WHERE username = ? ORDER BY timestart DESC`, [req.body.username], (err, rows) =>{
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
    }
    if(req.body.logtype === "Daily"){
        db.all(`SELECT * FROM dailylog WHERE username = ? ORDER BY date DESC`, [req.body.username], (err, rows) =>{// WHERE timestart >= CURDATE()
            if(err){
              return console.error(err.message);
            }else{
                var totaltime = [];
                var totalsolved = [];
                var totalwrong = [];
                var hs2as = [];
                var hs3as = [];
                var hs2md = [];
                var hs3md = [];
                var hs2rm = [];
                var hs3rm = [];
                var dates = [];
                rows.forEach((row)=>{
                    dates.push(row.date);
                    totaltime.push(row.totaltime); 
                    totalwrong.push(row.totalwrong);
                    hs2as.push(row.hs2as);               
                    hs3as.push(row.hs3as);               
                    hs2md.push(row.hs2md);               
                    hs3md.push(row.hs3md);               
                    hs2rm.push(row.hs2rm);               
                    hs3rm.push(row.hs3rm);
                    totalsolved.push(row.hs2as+row.hs3as+row.hs2md+row.hs3md+row.hs2rm+row.hs3rm);
                }); 
                res.render('log',{username: req.body.username, language:lang, selection:false, totalsolved: totalsolved, dates: dates, totaltime: totaltime, totalwrong:totalwrong, hs2as:hs2as, hs3as:hs3as, hs2md:hs2md, hs3md:hs3md, hs2rm:hs2rm, hs3rm:hs3rm, logtype: "Daily"});
            }
        });
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
                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username, session:session});
            }
        });
        db.run(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES (?, ?, "hs2as", CURRENT_TIMESTAMP)`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username, session:session});
            }
        });
        db.all(`SELECT * FROM dailylog WHERE date = CURRENT_DATE`,[],function(err, rows){
            if(rows.length===0){
                db.run(`INSERT INTO dailylog(customID, username, date, timestart) VALUES (?, ?, CURRENT_DATE, CURRENT_TIME)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username, session:session});
                    }
                });
            }else{
                db.run(`UPDATE dailylog SET timestart = CURRENT_TIME WHERE date = CURRENT_DATE`, [], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username, session:session});
                    }
                });
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
        var session = username +""+ current_time + "hs3as";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs3as")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.run(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES (?, ?, "hs3as", CURRENT_TIMESTAMP)`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.all(`SELECT * FROM dailylog WHERE date = CURRENT_DATE`,[],function(err, rows){
            if(rows.length===0){
                db.run(`INSERT INTO dailylog(customID, username, date, timestart) VALUES (?, ?, CURRENT_DATE, CURRENT_TIME)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "three", sign: "+", language:lang, hs: "hs3as", username:username, session:session});
                    }
                });
            }else{
                db.run(`UPDATE dailylog SET timestart = CURRENT_TIME WHERE date = CURRENT_DATE`, [], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "three", sign: "+", language:lang, hs: "hs3as", username:username, session:session});
                    }
                });
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
        var session = username +""+ current_time + "hs2md";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs2md")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.run(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES (?, ?, "hs2md", CURRENT_TIMESTAMP)`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.all(`SELECT * FROM dailylog WHERE date = CURRENT_DATE`,[],function(err, rows){
            if(rows.length===0){
                db.run(`INSERT INTO dailylog(customID, username, date, timestart) VALUES (?, ?, CURRENT_DATE, CURRENT_TIME)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "two", sign: "x", language:lang, hs:"hs2md", username:username, session:session});
                    }
                });
            }else{
                db.run(`UPDATE dailylog SET timestart = CURRENT_TIME WHERE date = CURRENT_DATE`, [], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "two", sign: "x", language:lang, hs:"hs2md", username:username, session:session});
                    }
                });
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
        var session = username +""+ current_time + "hs3md";
        db.run(`INSERT INTO problog(customID, username, category) VALUES (?, ?, "hs3md")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.run(`INSERT INTO problog(customID, username, category, timestamp) VALUES (?, ?, "hs3md", CURRENT_TIMESTAMP)`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.all(`SELECT * FROM dailylog WHERE date = CURRENT_DATE`,[],function(err, rows){
            if(rows.length===0){
                db.run(`INSERT INTO dailylog(customID, username, date, timestart) VALUES (?, ?, CURRENT_DATE, CURRENT_TIME)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "three", sign: "x", language:lang, hs:"hs3md", username:username, session:session});
                    }
                });
            }else{
                db.run(`UPDATE dailylog SET timestart = CURRENT_TIME WHERE date = CURRENT_DATE`, [], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "three", sign: "x", language:lang, hs:"hs3md", username:username, session:session});
                    }
                });
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
        var session = username +""+ current_time + "hs2rm";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs2rm")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.run(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES (?, ?, "hs2rm", CURRENT_TIMESTAMP)`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.all(`SELECT * FROM dailylog WHERE date = CURRENT_DATE`,[],function(err, rows){
            if(rows.length===0){
                db.run(`INSERT INTO dailylog(customID, username, date, timestart) VALUES (?, ?, CURRENT_DATE, CURRENT_TIME)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "two", sign: "", language:lang, hs:"hs2rm", username:username, session:session});
                    }
                });
            }else{
                db.run(`UPDATE dailylog SET timestart = CURRENT_TIME WHERE date = CURRENT_DATE`, [], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "two", sign: "", language:lang, hs:"hs2rm", username:username, session:session});
                    }
                });
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
        var session = username +""+ current_time + "hs3rm";
        db.run(`INSERT INTO problog(customID, username, timestart, category) VALUES (?, ?, CURRENT_TIMESTAMP, "hs3rm")`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.run(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES (?, ?, "hs3rm", CURRENT_TIMESTAMP)`, [session, username], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
        db.all(`SELECT * FROM dailylog WHERE date = CURRENT_DATE`,[],function(err, rows){
            if(rows.length===0){
                db.run(`INSERT INTO dailylog(customID, username, date, timestart) VALUES (?, ?, CURRENT_DATE, CURRENT_TIME)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "three", sign: "", language:lang, hs:"hs3rm", username:username, session:session});
                    }
                });
            }else{
                db.run(`UPDATE dailylog SET timestart = CURRENT_TIME WHERE date = CURRENT_DATE`, [], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        res.render('problem', {category: "three", sign: "", language:lang, hs:"hs3rm", username:username, session:session});
                    }
                });
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
                console.log(req.body.part1miss);
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
                    var categorys = req.body.hs;
                    if(categorys.substring(2,3)==="2"){
                        db.run(`UPDATE probsmissed SET part1 = ?, sign = ?, part2 = ?, kidanswer = ?, correctanswer = ? WHERE customID = ?`, [req.body.part1miss, req.body.signmiss, req.body.part2miss, req.body.kidanswer, req.body.correctanswer, req.body.session], function(err) {
                            if (err) {
                                return console.log(err.message);
                            }else{
                                console.log(`A row has been inserted with rowid ${this.lastID}`);
                                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                            }
                        });
                    }
                    if(categorys.substring(2,3)==="3"){
                        db.run(`UPDATE probsmissed SET part1 = ?, sign = ?, part2 = ?, sign2 = ?, part3 = ?, kidanswer = ?, correctanswer = ? WHERE customID = ?`, [req.body.part1miss, req.body.signmiss, req.body.part2miss, req.body.sign2miss, req.body.part3miss, req.body.kidanswer, req.body.correctanswer, req.body.session], function(err) {
                            if (err) {
                                return console.log(err.message);
                            }else{
                                console.log(`A row has been inserted with rowid ${this.lastID}`);
                                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                            }
                        });
                    }
                    
                    db.run(`UPDATE dailylog SET `+ req.body.hs +` = `+ req.body.hs +`+ ?, timeend = CURRENT_TIME, totalwrong = totalwrong + ? WHERE date = CURRENT_DATE`, [req.body.streaktotal, req.body.numwrong], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            console.log("numwrong"+req.body.numwrong);
                            console.log(`A row has been inserted with rowid ${this.lastID}`);
                            db.all(`SELECT * FROM dailylog WHERE date = CURRENT_DATE`, [], function(err, rows) {
                                if (err) {
                                    return console.log(err.message);
                                }else{
                                    rows.forEach((row)=>{
                                        var d2 = new Date(row.date+" "+row.timeend);
                                        var d1 = new Date(row.date+" "+row.timestart);
                                        var seconds = (d2-d1)/1000;
                                        console.log(seconds);
                                        db.run(`UPDATE dailylog SET totaltime = totaltime + ? WHERE date = CURRENT_DATE`, [seconds], function(err) {
                                            if (err) {
                                                return console.log(err.message);
                                            }else{
                                                console.log(`A row has been inserted with rowid ${this.lastID}`);
                                                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                                            }
                                        });
                                    }); 
                                    
                                    console.log(`A row has been inserted with rowid ${this.lastID}`);
                                    //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                                }
                            });
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
                    db.run(`DELETE FROM dailylog WHERE customID = ?`, [req.body.session], function(err) {
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
    var customIDs = [];
    db.all(`SELECT * FROM problog WHERE username = ? ORDER BY timestart DESC`, [req.body.username], (err, rows) =>{
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
                customIDs.push(row.customID);
            }); 
            res.render('log',{username: req.body.username, language:lang, selection:false, datauser: usernames, datatstart: timestarts, category: categories, num: numsolveds, datatspent: timespent, customID:customIDs, logtype: "Full"});
        }
    });
});

app.post('/daily', function(req, res){//WHERE timestamp >= CURDATE()
    db.all(`SELECT * FROM dailylog WHERE username = ? ORDER BY date DESC`, [req.body.username], (err, rows) =>{// WHERE timestart >= CURDATE()
        if(err){
          return console.error(err.message);
        }else{
            var totaltime = [];
            var totalsolved = [];
            var totalwrong = [];
            var hs2as = [];
            var hs3as = [];
            var hs2md = [];
            var hs3md = [];
            var hs2rm = [];
            var hs3rm = [];
            var dates = [];
            rows.forEach((row)=>{
                dates.push(row.date);
                totaltime.push(row.totaltime);
                totalwrong.push(row.totalwrong); 
                hs2as.push(row.hs2as);               
                hs3as.push(row.hs3as);               
                hs2md.push(row.hs2md);               
                hs3md.push(row.hs3md);               
                hs2rm.push(row.hs2rm);               
                hs3rm.push(row.hs3rm);
                totalsolved.push(row.hs2as+row.hs3as+row.hs2md+row.hs3md+row.hs2rm+row.hs3rm);

                /*if(row.category==="hs2as"){
                    numsolveds[0]+=row.numsolved;
                }
                if(row.category==="hs3as"){
                    numsolveds[1]+=row.numsolved;
                }
                if(row.category==="hs2md"){
                    numsolveds[2]+=row.numsolved;
                }
                if(row.category==="hs3md"){
                    numsolveds[3]+=row.numsolved;
                }
                if(row.category==="hs2rm"){
                    numsolveds[4]+=row.numsolved;
                }
                if(row.category==="hs3rm"){
                    numsolveds[5]+=row.numsolved;
                }*/
                //timestarts.push(row.timestart);
                //totalsolved[dates.length-1]=totalsolved[dates.length-1]+row.numsolved;
                /*var d2 = new Date(row.timeend);
                var d1 = new Date(row.timestart);
                var seconds = (d2-d1)/1000;
                totaltime+=seconds;*/
            }); 
            res.render('log',{username: req.body.username, language:lang, selection:false, totalsolved: totalsolved, totalwrong:totalwrong, dates: dates, totaltime: totaltime, hs2as:hs2as, hs3as:hs3as, hs2md:hs2md, hs3md:hs3md, hs2rm:hs2rm, hs3rm:hs3rm, logtype: "Daily"});
        }
    });
});

app.post('/getWrong/:id', function(req, res){
    //var usernames = [];
    var timestamp = "";
    var part1missed = [];
    var signmissed = [];
    var part2missed = [];
    var sign2missed = [];
    var part3missed = [];
    var kidanswers = [];
    var correctanswers = [];
    console.log( req.params.id);
    db.all(`SELECT * FROM probsmissed WHERE customID = ?`, [req.params.id], (err, rows) =>{
        if(err){
          return console.error(err.message);
        }else{
            var categorys="";
            rows.forEach((row)=>{
                //usernames.push(row.username);
                timestamp = row.timestamp;
                part1missed.push(row.part1);
                signmissed.push(row.sign);
                part2missed.push(row.part2);
                categorys = row.category;
                if(categorys.substring(2,3)==="3"){
                    sign2missed.push(row.sign2);
                    part3missed.push(row.part3);
                }
                kidanswers.push(row.kidanswer);
                correctanswers.push(row.correctanswer);
            }); 
            if(categorys.substring(2,3)==="2"){
                console.log(part1missed.toString());
                console.log(timestamp);
                res.render('log',{username: req.body.username, language:lang, selection:false, category:categorys, timestamp:timestamp, part1miss:part1missed, signmiss:signmissed, part2miss:part2missed, sign2miss:null, part3miss:null, kidanswer: kidanswers, correctanswer: correctanswers, logtype: "Wrong"});
            }
            if(categorys.substring(2,3)==="3"){
                res.render('log',{username: req.body.username, language:lang, selection:false, category:categorys, timestamp:timestamp, part1miss:part1missed, signmiss:signmissed, part2miss:part2missed, sign2miss:sign2missed, part3miss:part3missed, kidanswer: kidanswers, correctanswer: correctanswers, logtype: "Wrong"});
            }
        }
    });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

