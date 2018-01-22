"use strict";
const Eris = require("eris");
const request = require("request");
const cheerio = require("cheerio");
const steem = require("steem");
const fs = require("fs")
var banner = JSON.parse(fs.readFileSync("banners.json"))
var score;

steem.api.setOptions({ url: 'https://api.steemit.com' });

var bot = new Eris.CommandClient(process.env.DISCORD_BOT_TOKEN, {}, {
  description: "Scoutopian is designed to be a utopian.io discord bot which will check contributions to give users an opinion whether the contribution meets the rules.",
  owner: "@techrube",
  prefix: "!"
});

bot.on("ready", function(){
  console.log("Ready!");
});

bot.registerCommand("check", function(msg, args){
  score = 100;
  if(args.length === 0 || args[0].indexOf("://utopian.io/utopian-io/@") == -1) {
      return "Invalid input";
  }
  var url = args[0].split("/");
  var utopianName = url[4].split("@")[1];

  getContribution(utopianName, url[5], function(err, res){
    if(err) throw err;
    gitHubCheck(utopianName, JSON.parse(res.json_metadata), function(err, gitHub){
      downvoteCheck(res.active_votes, function(downvotes){
        sendResponse(msg, res, gitHub, downvotes);
      });
    });
  });

}, {
  description: "Compliance check",
  fullDescription: "Scoutopian will check the contribution whether it is in compliance with the General Rules of Utopian.",
  usage: "<utopian.io url of the contribution>"
});


function sendResponse(msg, json, gitHub, downvotes){
  var jsonMetadata = JSON.parse(json.json_metadata);
  bot.createMessage(msg.channel.id, {
      content: msg.author.mention+", here is your results for https://utopian.io"+json.url,
      embed: {
        title: "Compliance with The Rules",
        description: "_Rule check for the ["+jsonMetadata.type+"] category will be added soon_",
        author: {
          name: msg.author.username,
          icon_url: msg.author.avatarURL
        },
        url: "https://utopian.io/rules",  //placeholder for detailed analysis page
        color: 0x1D0E46,
        fields: [
          {
            name: " GitHub Repository ",
            value: gitHub,
            inline: true
          },
          {
            name: " Downvote Check ",
            value: downvotes,
            inline: true
          }
        ],
        footer: { // Footer text
          text: "The bot is created by @techrube."},
        thumbnail: {
          url: "https://chart.googleapis.com/chart?chs=225x125&cht=gom&chd=t:"+score},
        image: {
          url: banner[jsonMetadata.type]}
      }
  });
}



function getContribution(author, permlink, callback){
  steem.api.getContent(author, permlink, function(err, result) {
    if (err) throw err;
    callback(null, result);
  });
}


function gitHubCheck(utopianName, json, gitHubCallback){
  var url = json.repository.html_url;
  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);

      var gitHub = "";
      var license = false;
      var readme = false;
      var age = false;

      $('.js-navigation-open').each(function(){
        var title = $(this).text();
        if(title.search(/LICENSE/i) == 0){
          license = true;
        }

        if(title.search(/README/i) == 0){
          readme = true;
        }
        if(license && readme)
          return false;
      });
      gitHub = gitHub.concat((readme)?":white_check_mark:":":x:", " README.md [SOFT] \n", 
                              (license)?":white_check_mark:":":x:", " LICENSE [SOFT] \n");


      var timeAgo = parseInt(Date.parse($('relative-time').attr('datetime')));
      if(timeAgo != undefined){
        var now = parseInt(Date.now());
        if((now-timeAgo) <= 31556952000){
          age = true;
        }
        gitHub = gitHub.concat((age)?":white_check_mark:":":x:", " Age [HARD] \n");
      }
      else{
        gitHub = gitHub.concat(":question:", " Age [HARD] \n");
      }


      if(json.type === "development"){
        gitHubNameCheck(utopianName, json, function(err, nameCheck){
          if(err) throw err;
          gitHub = gitHub.concat((nameCheck)?":white_check_mark:":":x:", " GitHub Name");
          rule.hard(nameCheck);
        });
      }


      rule.soft(readme);
      rule.soft(license);
      rule.hard(age);

      gitHubCallback(null, gitHub);

    }
  });
}


var rule = {
  soft: function(checkedRule){
          if(!checkedRule){
            //TODO the score decrement can be adjusted by total number of soft rules
            score -= 10;
            score = (score<0)?0:score;
          }
        },
  hard: function(checkedRule){
          if(!checkedRule){
            score = Math.floor(score/1.5);
          }
        }
}


function gitHubNameCheck(utopianName, json, callback){
  var nameCheck = false;
  var canContinue = true;
  
  if(json.pullRequests[0] != null){          //is it enough to check first one? need to check more cases
    var reqBody = json.pullRequests[0].body;
    gitHubReqBodyCheck(reqBody);
  }
  else{
    gitHubReqLinksCheck();
  }
  
  
  function gitHubReqBodyCheck(reqBody){  
    // search for username in pullRequest's body
    var pullRequestBody = reqBody;
    if(pullRequestBody.search("@"+utopianName) != -1){    //if contributor has included his/her utopian name to the pull request
      nameCheck = true;
    }
    else{
      nameCheck = false;
    }
  }
  

  function gitHubReqLinksCheck(){
    // search links of the content in json-metadata for github.com/*/*/pull/* and fetch the contributor name if any github pull request link has found
    var linkCount = json.links.length;
    for(var i=0;i<linkCount;i++){
      var elem = json.links[i]
      if(elem.search("https://github.com/") != -1 && elem.search("/pull/") != -1){
        canContinue=false;
        request(elem, function(err, res, html){
          if(err) throw err;
          var $ = cheerio.load(html);
          var pullRequestUserName = $('.timeline-comment-header-text').find('strong > a').text();
          if(pullRequestUserName === utopianName){
            nameCheck = true;
          }
          else{
            var reqBody = $('td').find('.d-block').prevObject.first().text();
            gitHubReqBodyCheck(reqBody);
          }
          //TODO check if pull request merged or not
          canContinue=true;
          callback(null, nameCheck);
        });
      }
    }
  }
  
  if(canContinue)
    callback(null, nameCheck);
}



function downvoteCheck(votes, callback){
  var downvotes = "";
  var sc = true, ch = true, mb = true, sp = true;
  for(var i=0; i<votes.length;i++){
    //cheetah *upvotes* when it detects plagiarism
    if(votes[i].voter === "cheetah"){
      ch = false;
    }
    else{
      if(votes[i].rshares < 0){
        switch (votes[i].voter){
          case "steemcleaners": sc = false; break;
          //case "cheetah": ch = false; break;
          case "mack-bot": mb = false; break;
          case "spaminator": sp = false; break;
          default : break;
        }
      }
    }
  }
  
  downvotes = downvotes.concat(sc?":white_check_mark:":":x:", " steemcleaners\n",
                               ch?":white_check_mark:":":x:", " cheetah\n",
                               mb?":white_check_mark:":":x:", " mack-bot\n",
                               sp?":white_check_mark:":":x:", " spaminator\n");
  
  if(!sp || !ch || !mb || !sp)
    rule.hard(false);          //decrease the score
    
  callback(downvotes);
}

bot.connect();