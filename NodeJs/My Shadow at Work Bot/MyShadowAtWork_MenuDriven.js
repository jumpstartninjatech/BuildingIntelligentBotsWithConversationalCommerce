var restify = require('restify');
var builder = require('botbuilder');
//var botbuilder_azure = require("botbuilder-azure");
//var validator = require("email-validator");
var validator = require("email-validator");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());



// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);


bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, 'start');
            }
        });
    }
});

bot.dialog('start',[
    function(session, args, next)
    {
    
    session.send("Hai! I am My Shadow At WorkBot, I can help you in getting and reporting the work status.");
    //session.send("How may I help you ?");
   builder.Prompts.choice(session, "Please select any of the options given below. ", "Get Status|Report Status", { listStyle: builder.ListStyle.button });


    session.endDialog();
    
    }
    ]);

bot.dialog("/",[
    function(session)
    {
        if(session.message.text=='Get Status'){

             session.beginDialog('/GetStatus');
        }else if(session.message.text=='Report Status'){
             session.beginDialog('/ReportStatus');
        }
    }
    ]);



bot.dialog("/GetStatus",[
     function(session){
         if (session.message && session.message.value) {
             processSubmitAction(session, session.message.value);
             return ;   
        }

        var card={
        'contentType': 'application/vnd.microsoft.card.adaptive',
        'content':{
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.0",
    "body": [
        {
            "type": "ColumnSet",
            "columns": [
                {
                    "type": "Column",
                    "width": 2,
                    "items": [
                        {
                            "type": "TextBlock",
                            "text": "My Shadow At Work Bot",
                            "weight": "bolder",
                            "size": "medium"
                        },
                        {
                            "type": "TextBlock",
                            "text": "Please enter your name.",
                            "isSubtle": true,
                            "wrap": true
                        },
                        {
                        "type": "Input.Text",
                        "id": "myName",
                        "placeholder": "Name"
                        }
                    ]
                }
            ]
        }
    ],
    "actions": [
        {
            "type": "Action.Submit",
            "title": "Submit",  
             "data": {
                  "type": "Fourth"
                 }
        }
        
    ]
}

         }

      
      var msg = new builder.Message(session).addAttachment(card);
      session.send(msg);

     }
    ]);


bot.dialog("/ReportStatus",[
     function(session){
        if (session.message && session.message.value) {        
    
            processSubmitAction(session, session.message.value);
            return ;   
        }

        var card={
        'contentType': 'application/vnd.microsoft.card.adaptive',
        'content':{
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.0",
    "body": [
        {
            "type": "ColumnSet",
            "columns": [
                {
                    "type": "Column",
                    "width": 2,
                    "items": [
                        {
                            "type": "TextBlock",
                            "text": "My Shadow At Work Bot",
                            "weight": "bolder",
                            "size": "medium"
                        },
                        {
                            "type": "TextBlock",
                            "text": "Please enter the details below to submit your status. ",
                            "isSubtle": true,
                            "wrap": true
                        },  
                        {
                            "type": "Input.Text",
                            "id": "myName",
                            "placeholder": "Name"
                        },
                        {
                            "type": "Input.Text",
                            "id": "projName",
                            "placeholder": "Project Name",
                            "style": "email"
                        },
                       {
                                "type": "Input.Text",
                                "placeholder": "Task Description",
                                "style": "text",
                                "isMultiline": true,
                                "maxLength": 0,
                                "id": "task"
                       }
                        
                    ]
                }
            ]
        }
    ],
    "actions": [
        {
            "type": "Action.Submit",
            "title": "Submit",  
             "data": {
                  "type": "first"
                 }
        }
    ]
}

         }

        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
        


     }
    ]);







function processSubmitAction(session,value){

    if(value.type=="Fourth"){
    //This is for get status   
       session.userData.personname=value.myName;
       console.log("what will be there in the session.userData.personname",session.userData.personname);
       session.beginDialog("/verifyPerson");
        //verifyPerson(session);
    }else if(value.type=='first'){
    //This is for report status
      console.log("what is there in the value of first",value);
      session.userData.name=value.myName;
      session.userData.projectname=value.projName;
      session.userData.task=value.task;
      //storeStatus(session);
          var path = {
                         membername  :  session.userData.name,
                        projectname  :  session.userData.projectname,
                             status  :  session.userData.task
             }
          var data ={
                     method: "post",
                     path: "/reportStatus",
                }

        apicall(session, data, path, function(obj){
           
           console.log("what is there in the obj",obj); 
           if(obj.ResponseCode==100)
           {
             session.send("Thank you for submitting your Work Status Report.")
             
           }else{
            session.send("Person in not an Employee.");
           }
        });
    }else if(value.type=='eight'){
     
      session.beginDialog("/TaskContinue");
        
    }

    }



bot.dialog("/verifyPerson",[
    function(session)
    {
     
       var path = {
                 membername : session.userData.personname
             }
          var data ={
                     method: "post",
                     path: "/getStatus",
                }

        apicall(session, data, path, function(obj){
            if(obj.ResponseCode==100){
                console.log("what is there in the obj  23",obj);
               session.send("Login is verified.");
             session.userData.prsontmp=obj; 

                var data="";
                for (var i = 0; i<obj.data.length; i++) {
                  data += obj.data[i]. MemberName+"|";
                }
                data = data.substring(0, data.length-1);
                builder.Prompts.choice(session,"Please choose your Team Member.",data, {
                  listStyle: builder.ListStyle.button,
                }); 


            }else{
                session.send("Person is Unauthorized.");
                
            }
           
            
        });

    },
    function(session,results){
        var k=session.userData.prsontmp;
        session.userData.nameSelected=results.response.entity;
        for(var i=0;i<k.data.length;i++)
        {
            if(results.response.entity==k.data[i].MemberName){
              session.userData.memberID=k.data[i].MemberID;
            }
        }
        session.beginDialog("/finaldetailsDisplay");

    }
    ]);


bot.dialog("/finaldetailsDisplay",[
     function(session){
         
         var path = {
                memberid : session.userData.memberID  
             }
          var data ={
                     method: "post",
                     path: "/viewMemberStatus",
                }

        apicall(session, data, path, function(obj){
         console.log("what is there in the obj  23",obj);
          session.userData.projectName=obj.data.projectName;
          session.userData.workStatus=obj.data.Status;
         session.beginDialog("/FinalDisplay");

        });


         
     }
]);

bot.dialog("/FinalDisplay",[
    function(session){

        if (session.message && session.message.value) {
             processSubmitAction(session, session.message.value);
             return ;   
        }

        var card={
            'contentType': 'application/vnd.microsoft.card.adaptive',
                'content':{
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.0",
    "body": [
        {
            "type": "ColumnSet",
            "columns": [
                {
                    "type": "Column",
                    "width": 2,
                    "items": [
                        {
                            "type": "TextBlock",
                            "text": "Work Progress Report",
                            "weight": "bolder",
                            "size": "medium"
                        },
                        {
                            "type": "TextBlock",
                            "text": "Name :"+session.userData.nameSelected,
                            "isSubtle": true,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Project Name :"+session.userData.projectName,
                            "isSubtle": true,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Work Status :"+session.userData.workStatus,
                            "isSubtle": true,
                            "wrap": true
                        }
                        
                    ]
                }
            ]
        }
    ],
    "actions": [
    {
            "type": "Action.Submit",
            "title": "Exit",  
             "data": {
                  "type": "eight"
                 }
        }
        
    ]
}
        

         };

        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);


    }

    ]);










 bot.dialog("/TaskContinue",[
    function(session)
    {
        builder.Prompts.choice(session, "Would you like to check other Status?", "Yes|No", { listStyle: builder.ListStyle.button });
    },
    function(session,results)
    {
        if(results.response.entity=='Yes'){
            session.userData.nameSelected="";
            session.userData.projectName="";
            session.userData.workStatus="";
          session.beginDialog("/verifyPerson");
        }else if(results.response.entity=='No'){
            session.send("Thank you for using our services.");

        }
    }



    ]);



function apicall (session, data, path, callback) {
  var qs = require("querystring");
  var http = require("http");
  var options = {
    "method": data.method,
    "hostname":"139.59.105.129",
    "port": "8057",
    "path": data.path,
    "headers": {

        "content-type": "application/x-www-form-urlencoded",
        "apikey":"L42345I-N8946G-E55dS-H321-Ka36f33rt"
      
    }
  };
  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      var result = body.toString();
      var obj = JSON.parse(result);
      callback(obj);
    });
  });

  req.write(qs.stringify(path));
  req.end();
}


 