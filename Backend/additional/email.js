var express = require('express');
var app = express();
var nodemailer = require('nodemailer');
require('dotenv').config();

module.exports = {
    mail: function(email, emailToken, messageNr){
        
        if (messageNr == 0) {
            let mailOption = {
                from: 'jezper@hotmail.dk',
                to: email,
                subject: 'Confirm to access the website',
                html: `
                    <p>This is a message for creating a user for the website</p>
                    <p>please click the link below if you whant to activate your user</p>
                    <a href="http://localhost:3000/verify-email?token=${emailToken}"><h3>Confirm account</h3></a>  
                `,				
            }
            sendMail(mailOption);
        }
        else if (messageNr == 1){
            let mailOption = {
                from: 'jezper@hotmail.dk',
                to: email,
                subject: 'Forgotten password',
                html: `
                    <p>Click the link below to accept the change of your password.</p>
                    <a href="http://localhost:3000/change-Password?token=${emailToken}"><h3>Confirm change</h3></a>
                `,				
            }
            sendMail(mailOption);
        }
    }
}

function sendMail(mailOption){
    let transport = nodemailer.createTransport({
        service: "Hotmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },	
    });

    transport.sendMail(mailOption, function(err, data){
        if(err){
            console.log("Error came: ", err);
        }
        else console.log("email is sent");
    });
}