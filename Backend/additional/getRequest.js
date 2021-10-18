
module.exports = {
    gets: function(){
        
    }
}


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
	connection.query("SELECT * FROM accounts WHERE emailToken = ?", [request.query.token], function(err, result, fields){
		if (result[0]) {
			connection.query("UPDATE accounts SET emailToken=NULL ,isActive=1 WHERE id = ?", [result[0]["id"]]);
			response.render('homepage', {username: result[0]["username"]});
		}
		else{
			response.send("acoount is already set acktive")
		}
	})
});