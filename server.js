"use strict";
const rules = require('./rules');
const Eris = require("eris");
const express = require('express');
const app = express();
const fs = require("fs");
const banner = JSON.parse(fs.readFileSync("./resources/banners.json"));

app.get("/", function (request, response) {
  response.send("Scoutopian - Utopian.io Compliance Inspector");
});


var bot = new Eris.CommandClient(process.env.DISCORD_BOT_TOKEN, {}, {
  description: "Scoutopian is designed to be a utopian.io discord bot which will inspect contributions to give users an opinion whether the contribution meets the rules.",
  owner: "@techrube",
  prefix: "!"
});


bot.on("ready", function(){
  console.log("Ready!");
});


bot.registerCommand("check", function(msg, args){
  if(args.length == 0 || args[0].indexOf("://utopian.io/utopian-io/@") == -1) {
      return "Invalid input";
  }
  let url = args[0]
  rules.completeRuleCheck(url)
    .then((checkList) => sendResponse(msg, checkList))
    .catch(err => console.log(err))
}, {
  description: "Compliance check",
  fullDescription: "Scoutopian will check the contribution whether it's in compliance with the General Rules of Utopian.",
  usage: "<utopian.io url of the contribution>"
});


var sendResponse = (msg, checkList) => {
  let contribution = checkList.contribution
  let github = checkList.github.text
  let downvotes = checkList.downvotes.text
  let language = checkList.language.text
  let jsonMetadata = JSON.parse(contribution.json_metadata)
  
  bot.createMessage(msg.channel.id, {
    content: msg.author.mention+", here is your results for https://utopian.io"+contribution.url,
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
          value: github,
          inline: true
        },
        {
          name: " Downvote Check ",
          value: downvotes,
          inline: true
        },
        {
          name: " Language ",
          value: language,
          inline: true
        }
      ],
      footer: {
        text: "created by @techrube."},
      thumbnail: {
        url: "https://chart.googleapis.com/chart?chs=225x125&cht=gom&chd=t:" + checkList.score},
      image: {
        url: banner[jsonMetadata.type]}
    }
  });
}


bot.connect();

var listener = app.listen(process.env.PORT, function () {
  console.log("Scoutopian is running...");
});