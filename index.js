'use strict';



const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  app = express().use(bodyParser.json()); // creates express http server


// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  

  const VERIFY_TOKEN = "crisdeleon";

    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
       // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      

       // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }

      });
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
  });


  // Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "crisdeleon"
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });


  // app.get('/show-webview', (request, response) => {
  //   response.sendFile('https://test-messenger-web.herokuapp.com/');
  // });

  // app.get('/show-buttons', (request, response) => {

  // });


  // Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checks if the message contains text
  if (received_message.text) {    
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    if(received_message.text == "Home"){
      response = {
        attachment: {
          type: "template",
          payload: {
              template_type: "button",
              text: "Go web! Fly!",
              buttons: [{
                  type: "web_url",
                  url: "https://s3.ap-southeast-1.amazonaws.com/uat.m.gcash.com/gcashapp/gcash-messenger-web/1.0.0/index.html#/home",
                  title: "Sling Webview",
                  webview_height_ratio: "tall",
              }]
          }
      }
      }
    }
    else if(received_message.text == "Load"){
      response = {
        attachment: {
          type: "template",
          payload: {
              template_type: "button",
              text: "Go web! Fly!",
              buttons: [{
                  type: "web_url",
                  url: "https://s3.ap-southeast-1.amazonaws.com/uat.m.gcash.com/gcashapp/gcash-messenger-web/1.0.0/index.html#/",
                  title: "Sling Webview",
                  webview_height_ratio: "full",
                  messenger_extensions: true,
              }]
          }
      }
      }
    }
    else if(received_message.text == "Load!"){
      response = {
        attachment: {
          type: "template",
          payload: {
              template_type: "button",
              text: "Go web! Fly!",
              buttons: [{
                type: "web_url",
                url: "https://s3.ap-southeast-1.amazonaws.com/uat.m.gcash.com/gcashapp/gcash-messenger-web/1.0.0/index.html#/",
                title: "Sling Webview",
                webview_height_ratio: "tall",
                messenger_extensions: true,
              }],
          },
      },
      }
    }
    else{
      response = {
        "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
      }
    }
    
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  } 
  
  // Send the response message
  callSendAPI(sender_psid, response); 
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
     // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v3.3/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}