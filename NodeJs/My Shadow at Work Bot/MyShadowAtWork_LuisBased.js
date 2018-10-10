var restify = require('restify');
var builder = require('botbuilder');



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
    function(session, args, next){     
       session.send("Hai! I am My Shadow At WorkBot, I can help you in getting and reporting the work status.");  
       deleteProfile1(session);
       session.endDialog();
    }
]);




// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer("https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/a5b385ea-5588-4704-872c-6a8e86fd2c5d?subscription-key=dd6cc6dd04d24d37a5cd7126012df502&timezoneOffset=-360&q=");
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
.matches('ReportStatus',[(session,args,next) => {
      var Member=false;
      var Projects=false;
      var Task=false;
      if(args.entities.length>0)
      {
    

                  for(var i=0;i<args.entities.length;i++){
                                  if(args.entities[i].type=='Member'){
                                       Member=true;
                                       session.userData.member=args.entities[i].entity;
                                  }else if(args.entities[i].type=='Projects'){
                                        Projects=true;
                                        session.userData.projects=args.entities[i].entity;
                                  }else if(args.entities[i].type=='Status Report'){
                                        Task=true;
                                        session.userData.task=args.entities[i].entity;
                                  }
                  }
                 checkentityvalue(session);
      }else{
                 checkentityvalue(session);
  }


  
}
]).matches('GetStatus', (session,args,next) => {
  session.userData.member="";
  session.userData.memberID="";
  var Member=false;
  if(args.entities.length>0)
  {
                for(var i=0;i<args.entities.length;i++){
                     if(args.entities[i].type=='Member'){
                         Member=true;
                         session.userData.member=args.entities[i].entity;
                     }
                }

                if(session.userData.flag1==undefined){
                     session.beginDialog("/Getnameforverification");
                }else{
                     session.beginDialog("/authvalidationNoTeam")
                }
  }else{
                session.beginDialog("/Getnameforverification"); 
  }
        
});

bot.dialog('/', intents);  


bot.dialog("/authvalidationWithTeam",[
    function(session){
       var path = {
                 membername : session.userData.authName
        }
        var data ={
                     method: "post",
                     path: "/getStatus",
        }

        apicall(session, data, path, function(obj){
             if(obj.ResponseCode==100){
                if(session.userData.flag==undefined){
                      session.send("Login is verified."); 
                }
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
                session.userData.authName="";
                session.beginDialog("/choiceforcontinuing");   
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

bot.dialog("/choiceforcontinuing",[
   function(session){
     builder.Prompts.choice(session, "Would you like to re enter your name?", "Yes|No", { listStyle: builder.ListStyle.button });
   },
   function(session,results)
   {
         if(results.response.entity=="Yes"){
            session.beginDialog("/Getnameforverification");
          }
          else{

            session.send("Thank you for using our services.")
          }
   }
  ]);


bot.dialog("/Getnameforverification",[
  function(session){
    builder.Prompts.text(session,"Please enter your name for verification.");
  },
  function(session,results){
        session.userData.flag="";
        session.userData.authName=results.response;
        if((session.userData.member=="")||(session.userData.member==null)||(session.userData.member==undefined)){
               session.userData.flag=1;
               session.beginDialog("/authvalidationWithTeam");
          }else{
               session.userData.flag=0;
               session.beginDialog("/authvalidationNoTeam");
          }
  }
  ]);



bot.dialog("/authvalidationNoTeam",[
  function(session){
     var path = {
                 membername : session.userData.authName 
             }
     var data ={
                     method: "post",
                     path: "/getStatus",
                }

        apicall(session, data, path, function(obj){
            if(obj.ResponseCode==100){
                    if(session.userData.flag1== undefined){
                            session.send("Login is verified.")
                    }
                    session.userData.nameSelected=session.userData.member;
                    var k=obj;
                    for(var i=0;i<k.data.length;i++){
                         var s=k.data[i].MemberName;
                         var m=s.toLowerCase(); 
                         console.log("what is there in M",m);
                         console.log("what is there in session.userData.member",session.userData.member);
                         if(session.userData.member==m){
                             session.userData.memberID=k.data[i].MemberID;
                          } 
                      }
                      if((session.userData.memberID==undefined)||(session.userData.memberID=="")){
                     session.send(session.userData.member+" is not an employee.");
                     session.beginDialog("/askUserForFutherConversation");
                      }else{
                      session.beginDialog("/finaldetailsDisplay");
                      }
                      console.log("what is there in session.userData.memberID",session.userData.memberID);
            

            }else{
                session.send("Person is Unauthorized.");
                session.beginDialog("/furthercontinue");
            }
          });
  }
  ]);


bot.dialog("/askUserForFutherConversation",[
  function(session){
     builder.Prompts.choice(session, "Would you like to check other status?", "Yes|No", { listStyle: builder.ListStyle.button });
   },
   function(session,results)
   {
   console.log("what is there in ",results.response.entity);
   if(results.response.entity=='Yes'){
   session.userData.member="";
   session.userData.memberID="";
   session.userData.flag1=true;
   session.endDialog();
   }else if(results.response.entity=='No')
   {
    console.log("Thank you for using our services.");
   }
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


bot.dialog("/furthercontinue",[
   function(session){
     builder.Prompts.choice(session, "Would you like to re-enter your name?", "Yes|No", { listStyle: builder.ListStyle.button });
   },
   function(session,results)
   {
   if(results.response.entity=="Yes"){
      session.userData.authName="";
      session.beginDialog("/Getnameforverification");

    }else if(results.response.entity=="No")
    {
      console.log("i am here",results.response.entity);
      session.send("Thank you for using our services.");
    }
   }
  ]);


function checkentityvalue(session)
{
  if((session.userData.member==null)||(session.userData.member==undefined)||(session.userData.member=='')){
          session.beginDialog("/getmembername");
    }else if((session.userData.projects==null)||(session.userData.projects==undefined)||(session.userData.projects=='')){
          session.beginDialog("/getprojectname");
    }else if((session.userData.task==null)||(session.userData.task==undefined)||(session.userData.task=='')){
          session.beginDialog("/gettaskdetail");
  }else{
    storeTaskDetail(session);
  } 

}



bot.dialog("/getmembername",[
   function(session){
         builder.Prompts.text(session, "Please enter your name.");
   },
   function(session,results){
         session.userData.member=results.response;
         checkentityvalue(session);
   }
  ]);


bot.dialog("/getprojectname",[
   function(session){
          builder.Prompts.text(session, "Please enter your project name");
   },
   function(session,results){
          session.userData.projects=results.response;
          checkentityvalue(session);
   }

  ]);



bot.dialog("/gettaskdetail",[
   function(session){
           builder.Prompts.text(session, "Please enter your Project Status.");
   },
   function(session,results){
           session.userData.task=results.response;
           checkentityvalue(session);
   }
  ]);


function storeTaskDetail(session){
  var path = {
               membername  :  session.userData.member,
              projectname  :  session.userData.projects,
                   status  :  session.userData.task
             }
      var data ={
                     method : "post",
                     path   : "/reportStatus",
                }

        apicall(session, data, path, function(obj){
              console.log("what is there in obj",obj);
              if(obj.ResponseCode==100){
                      session.send("Thank you for submitting your Work Status Report.")
                      deleteProfile1(session);
              }else{
                      session.send("Details entered are incorrect.");
                      session.beginDialog("/tryagain");
              }
            
        });

}

bot.dialog("/tryagain",[
  function(session){
    builder.Prompts.choice(session, "Would you like to re-enter the details?", "Yes|No", { listStyle: builder.ListStyle.button });
  },
  function(session,results){
    if(results.response.entity=='Yes'){
      session.userData.member="";
      session.userData.projects="";
      checkentityvalue(session)
    }else if(results.response.entity=='No'){
      session.send("Thank you for using our Services.");
      deleteProfile1(session);
    }
  }
  
  ]);


function deleteProfile1(session) {
  session.userData = {};
  session.privateConversationData = {};
  session.endConversation();
}


bot.dialog("/TaskContinue",[
    function(session)
    {
        builder.Prompts.choice(session, "Would you like to check other status?", "Yes|No", { listStyle: builder.ListStyle.button });
    },
    function(session,results)
    {
        if(results.response.entity=='Yes'){
             if(session.userData.flag==1){
              session.userData.memberID="";
              session.beginDialog("/authvalidationWithTeam");
             }else if(session.userData.flag==0){
              session.userData.memberID="";
              session.userData.flag1=true;
              session.endDialog();
             }
        }else if(results.response.entity=='No'){
            session.send("Thank you for using our services.");

        }
    }

    ]);





function processSubmitAction(session,value){
    if(value.type=='eight'){ 
        session.beginDialog("/TaskContinue");
    }
}

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

