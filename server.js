
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const Intercom = require('intercom-client');
const https = require('https');
const querystring = require('querystring');
const request = require('request');
const validator = require('validator');

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
            "id": "userEmail",
            "placeholder": "Work Email",
            "value": "",
          },
          {
            "type": "input", 
            "id": "userCompany",
            "placeholder": "Company",
            "value": "",
          },
          {
            "type": "input", 
            "id": "userName",
            "placeholder": "Full Name",
            "value": "",
          },
          {
            "type": "input", 
            "id": "userPhone",
            "placeholder": "Phone Number",
            "value": "",
          },
          {
            type: "single-select",
            id: "gdprConsent",
            label: "Do you consent to GDPR w/e text here?",
            options: [
              {
                type: "option",
                id: "gdprYes",
                text: "Yes"
              }, 
              {
                type: "option",
                id: "gdprNo",
                text: "No",
              }
            ],
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
        var nameString = body.input_values.userName
        var nameArr = nameString.split(" ");
        var firstName = nameArr.shift();
        var lastNameComma = nameArr.toString();   
        var lastName = lastNameComma.replace(","," ");

        var postData = querystring.stringify({
            'email': body.input_values.userEmail,
            'firstname': firstName,
            'lastname': lastName,
            'company': body.input_values.userCompany,
            'phone': body.input_values.userPhone,
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
        request.post({
            url: 'https://apps.samanage.com/signup.js',
            form: {
                "nopost": true,
                'user[name]': body.input_values.userName,
                'user[email]': body.input_values.userEmail,
                'user[phone]': body.input_values.userPhone,
                "account[name]": body.input_values.userCompany,
            }
        }, function (err, httpResponse, body) {
                console.log(body)
                if (err) {
                    console.log(err);
                }
        });

        submitToHubby()
    }
    
    function appValidation() {
        //Currently Blocked by Reblaze, will come back to dev this later.  Need to get valid response, inspect body, find logic of if company/email exists to check 
        //with if statement, if exists send response to messagebot, if not pass off to hubspot create function


        //EMAIL
        https.get(`https://app.samanage.com/show.json?user[email]="${body.input_values.userEmail}"`, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                console.log(d);
            });
            }).on('error', (e) => {
            console.error(e);
        });
        https.get(`https://appeu.samanage.com/show.json?user[email]="${body.input_values.userEmail}"`, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                console.log(d);
            });
            }).on('error', (e) => {
            console.error(e);
        }); 
        
        //COMPANY NAME
        https.get(`https://app.samanage.com/show.json?account[name]="${body.input_values.userEmail}"`, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                console.log(d);
            });
            }).on('error', (e) => {
            console.error(e);
        });
        https.get(`https://appeu.samanage.com/show.json?account[name]="${body.input_values.userEmail}"`, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                console.log(d);
            });
            }).on('error', (e) => {
            console.error(e);
        }); 
        appTrialCreation()
    }

    function intercomValidation() {
        client.users.find({ email: body.input_values.userEmail }, function (err,d) {
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
                    email: body.input_values.userEmail
                }, function(err,d) {
                    client.tags.tag({
                        name: 'trial',
                        users: [{
                            email: body.input_values.userEmail
                        }]
                    }, function(err,d) {
                        client.companies.find({ name: body.input_values.userCompany}, function(err,d) {
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
        }); 
    }

    function basicValidation() {
        if (body.input_values.userName == "" || body.input_values.userEmail == "" || body.input_values.userCompany == "" || body.input_values.userPhone == "") {
            response.send({
                canvas: {
                    content: {
                        components: [
                        { type: "text", text: "Please complete all form fields and try again", 
                        style: "header", align: "center" },
                        {
                            "type": "input", 
                            "id": "userEmail",
                            "placeholder": "Work Email",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userCompany",
                            "placeholder": "Company",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userName",
                            "placeholder": "Full Name",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userPhone",
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
        }
        var emailCheck = validator.isEmail(body.input_values.userEmail);
        var companyCheck = validator.isAlphanumeric(body.input_values.userCompany);
        var nameCheck = validator.isAlpha(body.input_values.userName);
        var phoneCheck = validator.isAlphanumeric(body.input_values.userPhone);
        
        if (emailCheck == false) {
            response.send({
                canvas: {
                    content: {
                        components: [
                        { type: "text", text: "Please supply a valid email (i.e. example@host.com)", 
                        style: "header", align: "center" },
                        {
                            "type": "input", 
                            "id": "userEmail",
                            "placeholder": "Work Email",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userCompany",
                            "placeholder": "Company",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userName",
                            "placeholder": "Full Name",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userPhone",
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
        } else if (companyCheck == false) {
            response.send({
                canvas: {
                    content: {
                        components: [
                        { type: "text", text: "Please supply a valid email (i.e. example@host.com)", 
                        style: "header", align: "center" },
                        {
                            "type": "input", 
                            "id": "userEmail",
                            "placeholder": "Work Email",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userCompany",
                            "placeholder": "Company",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userName",
                            "placeholder": "Full Name",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userPhone",
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
        } else if (nameCheck == false) {
            response.send({
                canvas: {
                    content: {
                        components: [
                        { type: "text", text: "Please supply a valid email (i.e. example@host.com)", 
                        style: "header", align: "center" },
                        {
                            "type": "input", 
                            "id": "userEmail",
                            "placeholder": "Work Email",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userCompany",
                            "placeholder": "Company",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userName",
                            "placeholder": "Full Name",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userPhone",
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
        } else if (phoneCheck == false) {
            response.send({
                canvas: {
                    content: {
                        components: [
                        { type: "text", text: "Please supply a valid email (i.e. example@host.com)", 
                        style: "header", align: "center" },
                        {
                            "type": "input", 
                            "id": "userEmail",
                            "placeholder": "Work Email",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userCompany",
                            "placeholder": "Company",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userName",
                            "placeholder": "Full Name",
                            "value": "",
                          },
                          {
                            "type": "input", 
                            "id": "userPhone",
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
        } else {
            intercomValidation();
        }
    }

   /*  if (body != null) {
        basicValidation()
    }   */  
});