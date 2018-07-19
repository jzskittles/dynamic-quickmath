const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const {Pool} = require('pg');
require('dotenv').config();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const pool = new Pool({
    host:'ec2-107-22-169-45.compute-1.amazonaws.com',
    port: 5432,
    database: 'dc1bbt1b65la77',
    user: 'hdqiqexvzioteh',
    password: 'ad9e97f78a087e518b74e062216de40e3167efcc705639706aa2ceaf69c10e70',
    ssl:true
});

app.get('/', function (req, res) {
    res.render('login', {logging: null, language: "en", error: null});
});


app.post('/', function (req, res) {
    let username = req.body.username;
  let password = req.body.password;
  let language = req.body.languages;
  //console.log(language);

  var exists = false;
  pool.query(`SELECT * FROM users`, [], (err, result) =>{
    if(err){
      return console.error(err.message);
    }
    result.rows.forEach((row)=>{
        if(req.body.username === row.username){
            exists = true;
            if(req.body.password === row.password){
                //console.log("Logging in.");
                if(language === undefined){
                    language = row.language;
                }
                if(language !== row.language){
                    pool.query(`UPDATE users SET language = $1 WHERE username = $2`, [language, req.body.username], function(err) {
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
        if(language === undefined || language === ""){
            language = "en";
        }
        pool.query('INSERT INTO users(username, password, language, hs2as, hs3as, hs2md, hs3md, hs2rm, hs3rm, totalsolved) VALUES ($1, $2, $3, 0, 0, 0, 0, 0, 0, 0)', [req.body.username, req.body.password, req.body.languages], function(err, result){
            if(err) {
                res.render('login', {logging: null, language:req.body.language, error: 'Error, please try again'});
                return console.log(err.stack);
            }
            else{
                lang = language;
                console.log("a new user has been added with username: "+req.body.username+" and password: "+req.body.password+"!");
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
    pool.query(`UPDATE users SET language = $1 WHERE username = $2`, [lang, req.body.username], function(err) {
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
        var customIDs = [];
        pool.query(`SELECT * FROM problog WHERE username = $1 ORDER BY timestart DESC`, [req.body.username], (err, result) =>{
            if(err){
            return console.error(err.message);
            }else{
                result.rows.forEach((row)=>{
                    usernames.push(row.username);
                    timestarts.push(row.timestart);
                    categories.push(row.category);
                    numsolveds.push(row.numsolved);
                    var d2 = new Date(row.timeend);
                    var d1 = new Date(row.timestart);
                    var seconds = (d2-d1)/1000;
                    timespent.push(seconds);
                    customIDs.push(row.customid);
                }); 
                //console.log(usernames.toString());

                res.render('log',{username: req.body.username, language:lang, selection:false, customID:customIDs, datauser: usernames, datatstart: timestarts, category: categories, num: numsolveds, datatspent: timespent, clicked:null, logtype: "Full"});
            }
        });
    }
    if(req.body.logtype === "Daily"){
        if(req.body.clicked!==null){
            //var usernames = []
            var hs2asmiss = 0;
            var hs3asmiss = 0;
            var hs2mdmiss = 0;
            var hs3mdmiss = 0;
            var hs2rmmiss = 0;
            var hs3rmmiss = 0;
            //console.log(req.params.name);
            pool.query(`SELECT * FROM probsmissed WHERE username = $1`, [req.body.username], (err, result) =>{
                if(err){
                return console.error(err.message);
                }else{
                    
                    result.rows.forEach((row)=>{
                        var timestamp = row.timestamp;
                        var arrdate = timestamp.split(" ");
                        if(arrdate[0] === req.params.name){
                            //console.log(row.timestamp);
                            //usernames.push(row.username);
                            var part1count = row.part1;
                            var part1arr = part1count.split("");
                            var nummissed = 1;
                            for(i=0;i<part1arr.length;i++){
                                if(part1arr[i]===","){
                                    nummissed++;
                                }
                            }
                            if(row.category === "hs2as"){
                                hs2asmiss+=nummissed;
                            }
                            if(row.category === "hs3as"){
                                hs3asmiss+=nummissed;
                            }
                            if(row.category === "hs2md"){
                                hs2mdmiss+=nummissed;
                            }
                            if(row.category === "hs3md"){
                                hs3mdmiss+=nummissed;
                            }
                            if(row.category === "hs2rm"){
                                hs2rmmiss+=nummissed;
                            }
                            if(row.category === "hs3rm"){
                                hs3rmmiss+=nummissed;
                            }
                        }
                    }); 
                }
            });
    
            pool.query(`SELECT * FROM dailylog WHERE username = $1 ORDER BY date DESC`, [req.body.username], (err, result) =>{// WHERE timestart >= CURDATE()
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
                    var customID = [];
                    result.rows.forEach((row)=>{
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
                        customID.push(row.customID);
                    }); 
                    res.render('log',{username: req.body.username, language:lang, selection:false, totalsolved: totalsolved, totalwrong:totalwrong, customID:customID, thisID: req.params.name, dates: dates, totaltime: totaltime, hs2as:hs2as, hs3as:hs3as, hs2md:hs2md, hs3md:hs3md, hs2rm:hs2rm, hs3rm:hs3rm, hs2asmiss:hs2asmiss, hs3asmiss:hs3asmiss, hs2mdmiss:hs2mdmiss, hs3mdmiss:hs3mdmiss, hs2rmmiss:hs2rmmiss, hs3rmmiss:hs3rmmiss, clicked:"no", logtype: "Daily"});
                }
            });
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
            pool.query(`SELECT * FROM users ORDER BY `+category+` DESC`, [], (err, result) =>{
                if(err){
                return console.error(err.message);
                }else{ 
                    result.rows.forEach((row)=>{
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
        console.log(session);
        pool.query(`INSERT INTO problog(customID, username, timestart, category) VALUES ($1, $2, timeofday()::timestamp(0), $3)`, [session, username, "hs2as"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into problog`);
                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username, session:session});
            }
        });
        pool.query(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES ($1, $2, $3, timeofday()::timestamp(0))`, [session, username, "hs2as"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into probsmissed`);
                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username, session:session});
            }
        });
        pool.query(`SELECT * FROM dailylog WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`,[req.body.username],function(err, result){
            if(result.rows.length===0){
                pool.query(`INSERT INTO dailylog(customID, username, date, timestart) VALUES ($1, $2, to_char(now(), 'YYYY-MM-DD'), timeofday()::timestamp(0)::time)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username, session:session});
                        console.log(`A row has been inserted into dailylog`);
                    }
                });
            }else{
                pool.query(`UPDATE dailylog SET timestart = timeofday()::timestamp(0)::time WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`, [req.body.username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username, session:session});
                        console.log(`A row has been updated in dailylog`);
                    }
                });
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore2as = [];
        pool.query(`SELECT username, hs2as FROM users ORDER BY hs2as DESC`, [], (err, result) =>{
            if(err){
              return console.error(err.message);
            }else{
                result.rows.forEach((row)=>{
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
        //console.log(current_time);
        var session = username +""+ current_time + "hs3as";
        pool.query(`INSERT INTO problog(customID, username, timestart, category) VALUES ($1, $2, timeofday()::timestamp(0), $3)`, [session, username, "hs3as"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into problog`);
            }
        });
        pool.query(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES ($1, $2, $3, timeofday()::timestamp(0))`, [session, username, "hs3as"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into probsmissed`);
            }
        });
        pool.query(`SELECT * FROM dailylog WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`,[username],function(err, result){
            if(result.rows.length===0){
                pool.query(`INSERT INTO dailylog(customID, username, date, timestart) VALUES ($1, $2, to_char(now(), 'YYYY-MM-DD'), timeofday()::timestamp(0)::time)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "three", sign: "+", language:lang, hs: "hs3as", username:username, session:session});
                        console.log(`A row has been inserted into dailylog`);
                    }
                });
            }else{
                pool.query(`UPDATE dailylog SET timestart = timeofday()::timestamp(0)::time WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`, [username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "three", sign: "+", language:lang, hs: "hs3as", username:username, session:session});
                        console.log(`A row has been updated in dailylog`);
                    }
                });
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore3as = [];
        pool.query(`SELECT username, hs3as FROM users ORDER BY hs3as DESC`, [], (err, result) =>{
            if(err){
              return console.error(err.message);
            }else{
                result.rows.forEach((row)=>{
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
        //console.log(current_time);
        var session = username +""+ current_time + "hs2md";
        pool.query(`INSERT INTO problog(customID, username, timestart, category) VALUES ($1, $2, timeofday()::timestamp(0), $3)`, [session, username, "hs2md"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into problog`);
            }
        });
        pool.query(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES ($1, $2, $3, timeofday()::timestamp(0))`, [session, username, "hs2md"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into probsmissed`);
            }
        });
        pool.query(`SELECT * FROM dailylog WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`,[username],function(err, result){
            if(result.rows.length===0){
                pool.query(`INSERT INTO dailylog(customID, username, date, timestart) VALUES ($1, $2, to_char(now(), 'YYYY-MM-DD'), timeofday()::timestamp(0)::time)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "two", sign: "x", language:lang, hs:"hs2md", username:username, session:session});
                        console.log(`A row has been inserted into dailylog`);
                    }
                });
            }else{
                pool.query(`UPDATE dailylog SET timestart = timeofday()::timestamp(0)::time WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`, [username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "two", sign: "x", language:lang, hs:"hs2md", username:username, session:session});
                        console.log(`A row has been updated in dailylog`);
                    }
                });
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore2md = [];
        pool.query(`SELECT username, hs2md FROM users ORDER BY hs2md DESC`, [], (err, result) =>{
            if(err){
              return console.error(err.message);
            }else{
                result.rows.forEach((row)=>{
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
        //console.log(current_time);
        var session = username +""+ current_time + "hs3md";
        pool.query(`INSERT INTO problog(customID, username, timestart, category) VALUES ($1, $2, timeofday()::timestamp(0), $3)`, [session, username, "hs3md"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into problog`);
            }
        });
        pool.query(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES ($1, $2, $3, timeofday()::timestamp(0))`, [session, username, "hs3md"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into probsmissed`);
            }
        });
        pool.query(`SELECT * FROM dailylog WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`,[username],function(err, result){
            if(result.rows.length===0){
                pool.query(`INSERT INTO dailylog(customID, username, date, timestart) VALUES ($1, $2, to_char(now(), 'YYYY-MM-DD'), timeofday()::timestamp(0)::time)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "three", sign: "x", language:lang, hs:"hs3md", username:username, session:session});
                        console.log(`A row has been inserted into dailylog`);
                    }
                });
            }else{
                pool.query(`UPDATE dailylog SET timestart = timeofday()::timestamp(0)::time WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`, [username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "three", sign: "x", language:lang, hs:"hs3md", username:username, session:session});
                        console.log(`A row has been updated in dailylog`);
                    }
                });
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore3md = [];
        pool.query(`SELECT username, hs3md FROM users ORDER BY hs3md DESC`, [], (err, result) =>{
            if(err){
              return console.error(err.message);
            }else{
                result.rows.forEach((row)=>{
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
        //console.log(current_time);
        var session = username +""+ current_time + "hs2rm";
        pool.query(`INSERT INTO problog(customID, username, timestart, category) VALUES ($1, $2, timeofday()::timestamp(0), $3)`, [session, username, "hs2rm"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into problog`);
            }
        });
        pool.query(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES ($1, $2, $3, timeofday()::timestamp(0))`, [session, username, "hs2rm"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into probsmissed`);
            }
        });
        pool.query(`SELECT * FROM dailylog WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`,[username],function(err, result){
            if(result.rows.length===0){
                pool.query(`INSERT INTO dailylog(customID, username, date, timestart) VALUES ($1, $2, to_char(now(), 'YYYY-MM-DD'), timeofday()::timestamp(0)::time)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "two", sign: "", language:lang, hs:"hs2rm", username:username, session:session});
                        console.log(`A row has been inserted in dailylog`);
                    }
                });
            }else{
                pool.query(`UPDATE dailylog SET timestart = timeofday()::timestamp(0)::time WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`, [username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "two", sign: "", language:lang, hs:"hs2rm", username:username, session:session});
                        console.log(`A row has been updated in dailylog`);
                    }
                });
            }
        });
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore2rm = [];
        pool.query(`SELECT username, hs2rm FROM users ORDER BY hs2rm DESC`, [], (err, result) =>{
            if(err){
              return console.error(err.message);
            }else{
                result.rows.forEach((row)=>{
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
        pool.query(`INSERT INTO problog(customID, username, timestart, category) VALUES ($1, $2, timeofday()::timestamp(0), $3)`, [session, username, "hs3rm"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into problog`);
            }
        });
        pool.query(`INSERT INTO probsmissed(customID, username, category, timestamp) VALUES ($1, $2, $3, timeofday()::timestamp(0))`, [session, username, "hs3rm"], function(err) {
            if (err) {
                return console.log(err.message);
            }else{
                console.log(`A row has been inserted into probsmissed`);
            }
        });
        pool.query(`SELECT * FROM dailylog WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`,[username],function(err, result){
            if(result.rows.length===0){
                pool.query(`INSERT INTO dailylog(customID, username, date, timestart) VALUES ($1, $2, to_char(now(), 'YYYY-MM-DD'), timeofday()::timestamp(0)::time)`, [session, username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "three", sign: "", language:lang, hs:"hs3rm", username:username, session:session});
                        console.log(`A row has been inserted into dailylog`);
                    }
                });
            }else{
                pool.query(`UPDATE dailylog SET timestart = timeofday()::timestamp(0)::time WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`, [username], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }else{
                        res.render('problem', {category: "three", sign: "", language:lang, hs:"hs3rm", username:username, session:session});
                        console.log(`A row has been updated in dailylog`);
                    }
                });
            }
        });
        
    }
    if(req.body.title === "Leaderboard"){
        var usernames = [];
        var highscore3rm = [];
        pool.query(`SELECT username, hs3rm FROM users ORDER BY hs3rm DESC`, [], (err, result) =>{
            if(err){
              return console.error(err.message);
            }else{
                result.rows.forEach((row)=>{
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
        pool.query(`SELECT ` + req.body.hs+ ` FROM users WHERE username = $1`, [req.body.username], function(err, result){
            if (err) {
                return console.log(err.message);
            }else{
                //console.log(req.body.hs);
                var rowatr=0;
                if(req.body.hs === "hs2as"){
                    rowatr = result.rows[0].hs2as;
                    //console.log(rowatr);
                }
                if(req.body.hs === "hs3as"){
                    rowatr = result.rows[0].hs3as;
                }
                if(req.body.hs === "hs2md"){
                    rowatr = result.rows[0].hs2md;
                }
                if(req.body.hs === "hs3md"){
                    rowatr = result.rows[0].hs3md;
                }
                if(req.body.hs === "hs2rm"){
                    rowatr = result.rows[0].hs2rm;
                }
                if(req.body.hs === "hs3rm"){
                    rowatr = result.rows[0].hs3rm;
                }
                //console.log(req.body.numwrong);
                
                if(req.body.streaktotal>0){
                   
                    pool.query(`UPDATE problog SET category = $1, numsolved = $2, timeend = timeofday()::timestamp(0) WHERE customID = $3`, [req.body.hs, req.body.streaktotal, req.body.session], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            console.log(`updated problog`);
                            //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                        }
                    });
                    pool.query(`UPDATE dailylog SET `+ req.body.hs +` = `+ req.body.hs +`+ $1, timeend = timeofday()::timestamp(0)::time, totalwrong = totalwrong + $2 WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $3`, [req.body.streaktotal, req.body.numwrong, req.body.username], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            pool.query(`SELECT * FROM dailylog WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $1`, [req.body.username], function(err, result) {
                                if (err) {
                                    return console.log(err.message);
                                }else{
                                    result.rows.forEach((row)=>{
                                        var d2 = new Date(row.date+" "+row.timeend);
                                        var d1 = new Date(row.date+" "+row.timestart);
                                        var seconds = (d2-d1)/1000;
                                        //console.log(seconds);
                                        pool.query(`UPDATE dailylog SET totaltime = totaltime + $1 WHERE date = to_char(now(), 'YYYY-MM-DD') AND username = $2`, [seconds, req.body.username], function(err) {
                                            if (err) {
                                                return console.log(err.message);
                                            }else{
                                                console.log(`updated dailylog `+seconds+` seconds`);
                                                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                                            }
                                        });
                                    }); 
                                    
                                    console.log(`updated dailylog part 2`);
                                    //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                                }
                            });
                        }
                    });
                    
                    if(rowatr < req.body.higheststreak){
                        pool.query(`UPDATE users SET `+req.body.hs+` = $1 WHERE username = $2`, [req.body.higheststreak, req.body.username], function(err) {
                            if (err) {
                                return console.log(err.message);
                            }else{
                                console.log("updated high score!");
                            }
                        });                
                    }
                    
                        
                    //console.log(req.body.streaktotal);
                    let sql = `UPDATE users SET totalsolved = totalsolved + `+req.body.streaktotal+` WHERE username = $1`;
                    pool.query(sql, [req.body.username], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            console.log("updated total solved!");
                        }
                    });
                }else{
                    pool.query(`DELETE FROM problog WHERE customID = $1`, [req.body.session], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            console.log(`A row has been deleted from problog.`);
                            //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                        }
                    });
                    pool.query(`DELETE FROM probsmissed WHERE customID = $1`, [req.body.session], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            console.log(`A row has been deleted from probsmissed.`);
                            //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                        }
                    });
                }
                if(parseInt(req.body.numwrong) === 0){
                    //console.log("numwrong equals 0")
                    pool.query(`DELETE FROM probsmissed WHERE customID = $1`, [req.body.session], function(err) {
                        if (err) {
                            return console.log(err.message);
                        }else{
                            console.log(`A row has been deleted from probsmissed.`);
                            //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                        }
                    });
                }else{
                    var categorys = req.body.hs;
                    if(categorys.substring(2,3)==="2"){
                        pool.query(`UPDATE probsmissed SET part1 = $1, sign = $2, part2 = $3, kidanswer = $4, correctanswer = $5 WHERE customID = $6`, [req.body.part1miss, req.body.signmiss, req.body.part2miss, req.body.kidanswer, req.body.correctanswer, req.body.session], function(err) {
                            if (err) {
                                return console.log(err.message);
                            }else{
                                console.log(`updated probsmissed`);
                                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                            }
                        });
                    }
                    if(categorys.substring(2,3)==="3"){
                        pool.query(`UPDATE probsmissed SET part1 = $1, sign = $2, part2 = $3, sign2 = $4, part3 = $5, kidanswer = $6, correctanswer = $7 WHERE customID = $8`, [req.body.part1miss, req.body.signmiss, req.body.part2miss, req.body.sign2miss, req.body.part3miss, req.body.kidanswer, req.body.correctanswer, req.body.session], function(err) {
                            if (err) {
                                return console.log(err.message);
                            }else{
                                console.log(`updated probsmissed`);
                                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                            }
                        });
                    }
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
        if(req.body.logtype === "Wrong"){
            var usernames = [];
            var timestarts = [];
            var categories = [];
            var numsolveds = [];
            var timespent = [];
            var customIDs = [];
            pool.query(`SELECT * FROM problog WHERE username = $1 ORDER BY timestart DESC`, [req.body.username], (err, result) =>{
                if(err){
                    return console.error(err.message);
                }else{
                    result.rows.forEach((row)=>{
                        //console.log(row.username);
                        usernames.push(row.username);
                        timestarts.push(row.timestart);
                        categories.push(row.category);
                        numsolveds.push(row.numsolved);
                        var d2 = new Date(row.timeend);
                        var d1 = new Date(row.timestart);
                        var seconds = (d2-d1)/1000;
                        timespent.push(seconds);
                        customIDs.push(row.customid);
                    }); 
                    res.render('log',{username: req.body.username, language:lang, selection:false, datauser: usernames, datatstart: timestarts, category: categories, num: numsolveds, datatspent: timespent, customID:customIDs, clicked:null, logtype: "Full"});
                }
            });
        }
        else{
            res.render('home',{username: req.body.username, language:lang, selection: false});
        }
    }
});

app.post('/logout', function(req, res){
    console.log(req.body.username+ " logged out.");
    if(lang === "en"){
        res.render('login',{logging: req.body.username +" logged out.", language:lang, error: null});
    }
    else if(lang === "zh"){
        res.render('login', {logging: req.body.username +" 下线了.", language:lang, error: null});
    }else{
        res.render('login',{logging: req.body.username +" logged out.", language:lang, error: null});
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
    pool.query(`SELECT * FROM problog WHERE username = $1 ORDER BY timestart DESC`, [req.body.username], (err, result) =>{
        if(err){
          return console.error(err.message);
        }else{
            var first = true;
            result.rows.forEach((row)=>{
                
                var d2 = new Date(row.timeend);
                var d1 = new Date(row.timestart);
                var seconds = (d2-d1)/1000;
                if(seconds>0){
                    timespent.push(seconds);
                    usernames.push(row.username);
                    timestarts.push(row.timestart);
                    categories.push(row.category);
                    numsolveds.push(row.numsolved);
                    customIDs.push(row.customid);
                    first = false;
                }else{
                    if(!first||row.timeend===null){
                        pool.query(`DELETE FROM problog WHERE customID = $1`, [row.customid], function(err) {
                            if (err) {
                                return console.log(err.message);
                            }else{
                                console.log(`A row has been deleted from problog.`);
                                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                            }
                        });
                        pool.query(`DELETE FROM probsmissed WHERE customID = $1`, [row.customid], function(err) {
                            if (err) {
                                return console.log(err.message);
                            }else{
                                console.log(`A row has been deleted from probmissed.`);
                                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                            }
                        });
                        
                    }
                }
                
            }); 
            
            res.render('log',{username: req.body.username, language:lang, selection:false, datauser: usernames, datatstart: timestarts, category: categories, num: numsolveds, datatspent: timespent, customID:customIDs, clicked:"no", logtype: "Full"});
        }
    });
});

app.post('/daily', function(req, res){
    pool.query(`SELECT * FROM dailylog WHERE username = $1 ORDER BY date DESC`, [req.body.username], (err, result) =>{// WHERE timestart >= CURDATE()
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
            var customID = [];
            //console.log(req.body.username);
            result.rows.forEach((row)=>{
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
                customID.push(row.customID);
            }); 
            res.render('log',{username: req.body.username, language:lang, selection:false, totalsolved: totalsolved, totalwrong:totalwrong, customID:customID, thisID:null, dates: dates, totaltime: totaltime, hs2as:hs2as, hs3as:hs3as, hs2md:hs2md, hs3md:hs3md, hs2rm:hs2rm, hs3rm:hs3rm, hs2asmiss:null, hs3asmiss:null, hs2mdmiss:null, hs3mdmiss:null, hs2rmmiss:null, hs3rmmiss:null, clicked:"no", logtype: "Daily"});
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
    //console.log( req.params.id);
    pool.query(`SELECT * FROM probsmissed WHERE customID = $1`, [req.params.id], (err, result) =>{
        if(err){
          return console.error(err.message);
        }else{
            var categorys="";
            result.rows.forEach((row)=>{
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
            if(part1missed.length===0){
                //console.log("noooo");
                res.render('log',{username: req.body.username, language:lang, selection:false, category:null, timestamp:null, part1miss:null, signmiss:null, part2miss:null, sign2miss:null, part3miss:null, kidanswer: null, correctanswer: null, clicked:null, logtype: "Wrong"});
            }
            if(categorys.substring(2,3)==="2"){
                //console.log(part1missed.toString());
                //console.log(timestamp);
                res.render('log',{username: req.body.username, language:lang, selection:false, category:categorys, timestamp:timestamp, part1miss:part1missed, signmiss:signmissed, part2miss:part2missed, sign2miss:null, part3miss:null, kidanswer: kidanswers, correctanswer: correctanswers, clicked:null, logtype: "Wrong"});
            }
            if(categorys.substring(2,3)==="3"){
                res.render('log',{username: req.body.username, language:lang, selection:false, category:categorys, timestamp:timestamp, part1miss:part1missed, signmiss:signmissed, part2miss:part2missed, sign2miss:sign2missed, part3miss:part3missed, kidanswer: kidanswers, correctanswer: correctanswers, clicked:null, logtype: "Wrong"});
            }
        }
    });
});

app.post('/getCategory/:name', function(req, res){
    //var usernames = []
    var hs2asmiss = 0;
    var hs3asmiss = 0;
    var hs2mdmiss = 0;
    var hs3mdmiss = 0;
    var hs2rmmiss = 0;
    var hs3rmmiss = 0;
    //console.log(req.params.name);
    pool.query(`SELECT * FROM probsmissed WHERE username = $1`, [req.body.username], (err, result) =>{
        if(err){
            return console.error(err.message);
        }else{
            result.rows.forEach((row)=>{
                var timestamp = row.timestamp;
                var arrdate = timestamp.split(" ");
                if(arrdate[0] === req.params.name){
                    var part1count = row.part1;
                    var part1arr = part1count.split("");
                    var nummissed = 0;
                    if(parseInt(part1count) === 0){
                        pool.query(`DELETE FROM probsmissed WHERE timestamp = $1`, [row.timestamp], function(err) {
                            if (err) {
                                return console.log(err.message);
                            }else{
                                console.log(`A row has been deleted from probsmissed.`);
                                nummissed = 0;
                                //res.render('problem', {category: "two", sign: "+", language:lang, hs:"hs2as", username:username});
                            }
                        });
                    }else{
                        nummissed = 1;
                    }
                    for(i=0;i<part1arr.length;i++){
                        if(part1arr[i]===","){
                            nummissed++;
                        }
                    }
                    if(row.category === "hs2as"){
                        hs2asmiss+=nummissed;
                    }
                    if(row.category === "hs3as"){
                        hs3asmiss+=nummissed;
                    }
                    if(row.category === "hs2md"){
                        hs2mdmiss+=nummissed;
                    }
                    if(row.category === "hs3md"){
                        hs3mdmiss+=nummissed;
                    }
                    if(row.category === "hs2rm"){
                        hs2rmmiss+=nummissed;
                    }
                    if(row.category === "hs3rm"){
                        hs3rmmiss+=nummissed;
                    }
                }
            }); 

            pool.query(`SELECT * FROM dailylog WHERE username = $1 ORDER BY date DESC`, [req.body.username], (err, result) =>{
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
                    var customID = [];
                    result.rows.forEach((row)=>{
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
                        customID.push(row.customID);
                    }); 
                    if(req.body.clicked==="no"){
                        res.render('log',{username: req.body.username, language:lang, selection:false, totalsolved: totalsolved, totalwrong:totalwrong, customID:customID, thisID: req.params.name, dates: dates, totaltime: totaltime, hs2as:hs2as, hs3as:hs3as, hs2md:hs2md, hs3md:hs3md, hs2rm:hs2rm, hs3rm:hs3rm, hs2asmiss:hs2asmiss, hs3asmiss:hs3asmiss, hs2mdmiss:hs2mdmiss, hs3mdmiss:hs3mdmiss, hs2rmmiss:hs2rmmiss, hs3rmmiss:hs3rmmiss, clicked:"clicked", logtype: "Daily"});
                    }else{
                        res.render('log',{username: req.body.username, language:lang, selection:false, totalsolved: totalsolved, totalwrong:totalwrong, customID:customID, thisID: null, dates: dates, totaltime: totaltime, hs2as:hs2as, hs3as:hs3as, hs2md:hs2md, hs3md:hs3md, hs2rm:hs2rm, hs3rm:hs3rm, hs2asmiss:hs2asmiss, hs3asmiss:hs3asmiss, hs2mdmiss:hs2mdmiss, hs3mdmiss:hs3mdmiss, hs2rmmiss:hs2rmmiss, hs3rmmiss:hs3rmmiss, clicked:"no", logtype: "Daily"});
                    }    
                }
            });
        }
    });
});

app.listen(process.env.PORT || 5432, function () {
    console.log(`App listening on port ${process.env.port || 5432}!`);
  });