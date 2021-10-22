// after importing of node package manager(npm) require to find them from the node_modules 
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
require('dotenv').config();

//connection to other jscript
const mysql = require('./additional/databaseConnection.js');
const conn = mysql.con();

const emails = require('./additional/email.js');

// Creates a session to save informaiton
app.use(session({
	secret: 'awemd9m0d3932290432rmwdlmwe',
	resave: false,
	saveUninitialized: true
}));

// helps to retrive data from post/get by using body
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

//makes all files in public folder reachebal
app.use(express.static(path.join(__dirname, '../root/css')));

app.set('views', path.join(__dirname, '../root/pages/'));
app.set('view engine', 'ejs');

// All gets
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, '../root/index.html'));
});
app.get('/createUser', function(request, response) {
	response.sendFile(path.join(__dirname,  '../root/pages/createUser.html'));
});
app.get('/forgotPassword', function(request, response) {
	response.sendFile(path.join(__dirname,  '../root/pages/forgotPassword.html'));
});
app.get('/changePassword', function(request, response) {
	response.sendFile(path.join(__dirname,  '../root/pages/changePassword.html'));
});
app.get('/homepage', function(request, response) {
	if (request.session.loggedin) {
		response.render('homepage', {username: request.session.username});
	}
	else response.redirect("/");
});
app.get('/verify-email', function(request, response) {
	conn.query("SELECT * FROM accounts WHERE emailToken = ?", [request.query.token], function(err, result, fields){
		if (result[0]) {
			conn.query("UPDATE accounts SET emailToken=NULL ,isActive=1 WHERE id = ?", [result[0]["id"]]);
			response.redirect('/');
		}
		else response.send("acoount is already set acktive");
	});
});
app.get('/change-Password', function(request, response){
	conn.query("SELECT * FROM accounts WHERE emailToken = ?", [request.query.token], function(err, result, fields){
		if (result[0] != null) {
			bcrypt.genSalt().then(salt => {
				bcrypt.hash(result[0]['newPassword'], salt).then(hash =>{
					conn.query("UPDATE accounts SET password=?, emailToken=NULL WHERE id = ?", [hash, result[0]["id"]]);
				});
			});
			conn.query("UPDATE accounts SET emailToken=NULL WHERE id = ?", [result[0]["id"]]);
			response.redirect('/');
		}
		else response.send("Contact itsuport for futher information");
	});
});


// Gets the post form from login.html
app.post('/login', function(request, response) {
		var username = request.body.username;
		var password = request.body.password;

		conn.query('SELECT * FROM accounts WHERE username = ?', [username], function(error, results, fields) {
			if (results[0] != null && results[0]['isActive']) {
				bcrypt.genSalt(12).then(salt => {
					bcrypt.hash(password, salt).then(hash => {
						bcrypt.compare(password, results[0]["password"]).then(result => login(result, request, response, username));
					});
				})
			}
			else response.redirect('/');
		});
});

function login(result, request, response, username){
	if (result) {
		request.session.loggedin = true;
		request.session.username = username;
		response.redirect('/homepage');
	} 
	else response.send('Incorrect Username and/or Password!');	
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
				emails.mail(email, emailToken, 0);
				response.redirect('/');
			}			
		});
	} else {
		response.send('Password and the repeated password is not the same!!!');
		response.end();
	}
});

app.post('/resetPassword', function(request, response){
	const email = request.body.email;
	const newPassword = request.body.newPassword;
	const checkPassword = request.body.checkPassword;
	let emailToken = crypto.randomBytes(64).toString('hex');
	conn.query("SELECT * FROM accounts WHERE email = ?", [email], function(err, result){
		if (result[0] != null && result[0]['isActive'] && newPassword === checkPassword) {
			conn.query("UPDATE accounts SET emailToken = ?, newPassword = ? WHERE email = ?", [emailToken, newPassword, email]);
			emails.mail(email, emailToken, 1);
			response.redirect('/');
		}
		else response.send("Contact itsuport for futher information");
	});
});


//listen to port 3000
app.listen(3000);