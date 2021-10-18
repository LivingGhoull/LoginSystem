//https://www.google.com/search?q=node.js+cant+console.log+out&rlz=1C1GCEU_daDK972DK972&oq=node.js+cant+console.log+out+&aqs=chrome..69i57j33i22i29i30.8617j0j7&sourceid=chrome&ie=UTF-8

// after importing of node package manager(npm) require to find them from the node_modules 
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
const { query } = require('express');
require('dotenv').config();

const mysql = require('./additional/databaseConnection.js');
const conn = mysql.con();

// Creates a session
app.use(session({
	secret: 'awemd9m0d3932290432rmwdlmwe',
	resave: false,
	saveUninitialized: true
}));

// helps to retrive data from post/get
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

//makes all files in public folder reachebal now
app.use(express.static(path.join(__dirname, '../root/css')));

app.set('views', path.join(__dirname, '../root/pages/'));
app.set('view engine', 'ejs');

// When on localhost will it activate login.html
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, '../root/index.html'));
});
app.get('/createUser', function(request, response) {
	response.sendFile(path.join(__dirname,  '../root/pages/createUser.html'));
});
app.get('/homepage', function(request, response) {
	if (request.session.loggedin) {
		response.render('homepage', {username: request.session.username});
	}
	else{
		response.redirect("/");
	}
});
app.get('/verify-email', function(request, response) {
	conn.query("SELECT * FROM accounts WHERE emailToken = ?", [request.query.token], function(err, result, fields){
		if (result[0]) {
			conn.query("UPDATE accounts SET emailToken=NULL ,isActive=1 WHERE id = ?", [result[0]["id"]]);
			response.render('homepage', {username: result[0]["username"]});
		}
		else{
			response.send("acoount is already set acktive")
		}
	})
});

// Gets the post form from login.html
app.post('/login', function(request, response) {
		var username = request.body.username;
		var password = request.body.password;

		conn.query('SELECT * FROM accounts WHERE username = ?', [username], function(error, results, fields) {
			if (results[0] != null) {
				bcrypt.genSalt(12).then(salt => {
					bcrypt.hash(password, salt).then(hash => {
						bcrypt.compare(password, results[0]["password"]).then(result => login(result, request, response, username));
					});
				})
			}
			else{
				response.redirect('/');
			}
		});
});

function login(result, request, response, username){
	if (result) {
		request.session.loggedin = true;
		request.session.username = username;
		response.redirect('/homepage');
	} else {
		response.send('Incorrect Username and/or Password!');
	}			
	response.end();
}

app.post('/createUser', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	var passwordCheck = request.body.passwordCheck;
	var email = request.body.email;
	var emailToken = crypto.randomBytes(64).toString('hex');
	if (password == passwordCheck) {
		conn.query('SELECT * FROM accounts WHERE username = ? OR email = ?', [username, email], function(error, results, fields) {
			if (results.length > 0) {
				response.send('User alredy exist!!!');
			} else {
				bcrypt.genSalt().then(salt => {
					bcrypt.hash(password, salt).then(hash =>{
						conn.query('INSERT INTO accounts (username, password, email, isActive, emailToken) VALUES(?,?,?,?,?)', [username, hash, email, false, emailToken]);
					});
				})

				let transport = nodemailer.createTransport({
					service: "Hotmail",
					auth: {
						user: process.env.EMAIL,
						pass: process.env.PASSWORD,
					},	
				});

				let mailOption = {
					from: 'jezper@hotmail.dk',
					to: email,
					subject: 'Confirm to access the website',
					text: `
						This is a message for creating a user for the website
						please click the link below if you whant to activate your user

						http://localhost:3000/verify-email?token=${emailToken}
					`,				
				}

				transport.sendMail(mailOption, function(err, data){
					if(err){
						console.log("Error came: ", err);
					}
					else{
						console.log("email is sent")
					}
					
				});
				response.redirect('/');
			}			
			response.end();
		});
	} else {
		response.send('Password and the repeated password is not the same!!!');
		response.end();
	}
});

//listen to port 3000
app.listen(3000);