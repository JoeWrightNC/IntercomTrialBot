
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const Intercom = require('intercom-client');
const https = require('https');
const querystring = require('querystring');
const request = require('request');
const app = express();

var client = new Intercom.Client({ token: 'dG9rOjQxMzc0YjYzX2I1ZTVfNDkxYV85NmNmXzU0YzBiMzA3ZTQ5YToxOjA=' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});
        
const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

/* 
  This is an endpoint that Intercom will POST HTTP request when the card needs to be initialized.
  This can happen when your teammate inserts the app into a conversation composer, Messenger home settings or User Message.
  Params sent from Intercom contains for example `card_creation` parameter that was formed by your `configure` response.
*/
app.post("/initialize", (request, response) => {  
  const body = request.body;  
  response.send({
    canvas: {
      content: {
        components: [
          {
            "type": "input", 
            "id": "input_40_3",
            "placeholder": "Work Email",
            "value": "",
          },
          {
            "type": "input", 
            "id": "input_40_4",
            "placeholder": "Company",
            "value": "",
          },
          {
            "type": "input", 
            "id": "input_40_2",
            "placeholder": "Full Name",
            "value": "",
          },
          {
            "type": "input", 
            "id": "input_40_5",
            "placeholder": "Phone Number",
            "value": "",
          },
          { 
            type: "button", 
            label: "Start a Free Trial", 
            id: "submit_button",
            action: {
              type: "submit"
            } 
          },
        ], 
      },
    },
  });
});

app.post("/submit", (req, response) => { 
    const body = req.body;
    console.log(body);

    function submitToHubby() {
        var nameString = body.input_values.input_40_2
        var nameArr = nameString.split(" ");
        var firstName = nameArr.shift();
        var lastNameComma = nameArr.toString();   
        var lastName = lastNameComma.replace(","," ");

        var postData = querystring.stringify({
            'email': body.input_values.input_40_3,
            'firstname': firstName,
            'lastname': lastName,
            'company': body.input_values.input_40_4,
            'phone': body.input_values.input_40_5,
            'geo_ip_address': body.user.last_seen_ip,
            //'continent_name': "Europe",
            'continent_code':body.user.location_data.continent_code,
            'country_name': body.user.location_data.country_name,
            'country_code': body.user.location_data.country_code,
            'country_subdivision_name':body.user.location_data.region_name,
            //'country_subdivision_code': "NH",
            'city_name':body.user.location_data.city_name,
            'postal_code':body.user.location_data.postal_code,
            'hs_context': JSON.stringify({
                //"hutk": req.cookies.hubspotutk,
                "ipAddress": body.user.last_seen_ip,
                "pageUrl": body.user.referrer,
                "pageName": "Intercom Chat"
            })
        });
        console.log(postData);
 
        var options = {
            hostname: 'forms.hubspot.com', //4438fd01ecddfe106036bd469db1fa62
            path: '/uploads/form/v2/41925/d5d367aa4dbb4501a63a6ed89e443fb0',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        }

        var requestHS = https.request(options, function(response){
            console.log("Status: " + response.statusCode);
            console.log("Headers: " + JSON.stringify(response.headers));
            response.setEncoding('utf8');
            response.on('data', function(chunk){
                console.log('Body: ' + chunk)
            });
        });
        
        requestHS.on('error', function(e){
            console.log("Problem with request " + e.message)
        });
        
        // post the data
        requestHS.write(postData);
        requestHS.end(); 
 
        //chat bot reply
        response.send({
            canvas: {
                content: {
                    components: [
                    { type: "text", text: "Your entry should have made it to the new leads channel", 
                    style: "header", align: "center" },
                    ], 
                },
            },
        });
    }

    function appTrialCreation() {
        //Currently Blocked by Reblaze, will come back to dev this later.  Need to get valid response, inspect body of response, validate trial creation, 
        // pass off to hubspot create function.  Need to talk to Andrew about how best to handle err if err for this scenario
        /* request.post({
            url: 'https://apps.samanage.com/signup.js',
            form: {
                "nopost": true,
                'user[name]': body.input_values.input_40_2,
                'user[email]': body.input_values.input_40_3,
                'user[phone]': body.input_values.input_40_5,
                "account[name]": body.input_values.input_40_4,
            }
        }, function (err, httpResponse, body) {
                console.log(body)
                if (err) {
                    console.log(err);
                }
        }); */

        submitToHubby()
    }
    
    function appValidation() {
        //Currently Blocked by Reblaze, will come back to dev this later.  Need to get valid response, inspect body, find logic of if company/email exists to check 
        //with if statement, if exists send response to messagebot, if not pass off to hubspot create function


        //EMAIL
        /* https.get(`https://app.samanage.com/show.json?user[email]="${body.input_values.input_40_3}"`, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                console.log(d);
            });
            }).on('error', (e) => {
            console.error(e);
        });
        https.get(`https://appeu.samanage.com/show.json?user[email]="${body.input_values.input_40_3}"`, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                console.log(d);
            });
            }).on('error', (e) => {
            console.error(e);
        }); */
        
        //COMPANY NAME
        /* https.get(`https://app.samanage.com/show.json?account[name]="${body.input_values.input_40_3}"`, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                console.log(d);
            });
            }).on('error', (e) => {
            console.error(e);
        });
        https.get(`https://appeu.samanage.com/show.json?account[name]="${body.input_values.input_40_3}"`, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                console.log(d);
            });
            }).on('error', (e) => {
            console.error(e);
        }); */

        /* response.send({
            canvas: {
                content: {
                    components: [
                    { type: "text", text: "Chcek dem logs", 
                    style: "header", align: "center" },
                    ], 
                },
            },
        }); */
        appTrialCreation()
    }

    function intercomValidation() {
        /* client.users.find({ email: body.input_values.input_40_3 }, function (err,d) {
            if (d) {
                response.send({
                    canvas: {
                        content: {
                            components: [
                            { type: "text", text: "It appears this email address has already been submitted", 
                            style: "header", align: "center" },
                            ], 
                        },
                    },
                });
            } else {
                client.users.create({
                    email: body.input_values.input_40_3
                }, function(err,d) {
                    client.tags.tag({
                        name: 'trial',
                        users: [{
                            email: body.input_values.input_40_3
                        }]
                    }, function(err,d) {
                        client.companies.find({ name: body.input_values.input_40_4}, function(err,d) {
                            if (d) {
                                response.send({
                                    canvas: {
                                        content: {
                                            components: [
                                            { type: "text", text: "It appears this company has already been submitted", 
                                            style: "header", align: "center" },
                                            ], 
                                        },
                                    },
                                });
                            }
                            else{
                                appValidation();
                                //submitToHubby()
                            }
                        })
                        if (err) {
                            console.log(err);
                        }
                    })
                    if (err) {
                        console.log(err);
                    }
                })
            }
            if (err) {
                console.log(err)
            }
        }); */
    }

    //base function should call intercomValidation();

    /* response.send({
        canvas: {
            content: {
                components: [
                { type: "text", text: "Chcek dem logs", 
                style: "header", align: "center" },
                ], 
            },
        },
    }); */
    submitToHubby();
    
});