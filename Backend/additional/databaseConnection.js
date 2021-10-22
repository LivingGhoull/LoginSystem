//creates a connection to the database
var mysql = require('mysql');

module.exports = {
    con: function(){
            return mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : '',
            database : 'nodelogin'
        });
    }
}