"use strict";
const request = require("request-promise")
const fs = require("fs")
const steem = require("steem")
const languageNames = JSON.parse(fs.readFileSync("./resources/languages.json"));
steem.api.setOptions({url: "https://api.steemit.com"});
var rules = {}

rules.githubCheck = (checkList) => {
  let utopianName = checkList.contribution.author
  let jsonMetaData = JSON.parse(checkList.contribution.json_metadata)
  let repoFullName = jsonMetaData.repository.full_name
  let repo = {
    license : false,
    readme : false,
    age : false,
    name_check : false
  }

  var githubName = () => {
    
    var githubReqBodyCheck = (reqBody) => {
      return new Promise((resolve, reject) => {
        if(reqBody.search("@"+utopianName) != -1)
          repo.name_check = true
        resolve(repo.name_check)
      })
    }

    /** Try to find a pull request link on the utopian.io contribution */
    var searchForPRLinks = () => {
      let links = jsonMetaData.links
      return new Promise((resolve, reject) => {
        for(let i=0; i<links.length; i++){
          if(links[i].search("https:\/\/github\.com\/"+jsonMetaData.repository.full_name+"\/pull\/") == 0){
            let prNo = links[i].split("/")[6]
            let prUrl = "/repos/"+jsonMetaData.repository.full_name+"/pulls/"+prNo.toString()
            getDataByUrl(prUrl)
              .then((prJson) => {handlePR(JSON.parse(prJson))})
              .then(() => resolve())
              .catch((err) => reject(err))
            return false  //stop searching, when the first pull request link is found on the contribution's body
          }
        }
        resolve()
      })
    }
    
    var handlePR = (prJson) => {
      return new Promise((resolve, reject) => {
        repo.github_username = prJson.user.login
        repo.pr = {
          age_check : false,
          merged_at : prJson.merged_at,
          body : prJson.body
        }
        if(repo.github_username === utopianName){
          repo.name_check = true
        }
        //creation date&time of the contribution should be at most 14 days after the pr merge date
        if(repo.pr.merged_at != null && Date.parse(checkList.contribution.created) - Date.parse(repo.pr.merged_at) <= 14 * 86400000)
          repo.pr.age_check = true
        resolve()
      })
    }
    
    /** Tries to find a github commit link on the utopian.io contribution */
    var searchForCommitLinks = () => {
      return new Promise((resolve, reject) => {
        let links = jsonMetaData.links
        for(let i=0; i<links.length; i++){
          if(links[i].search("https:\/\/github\.com\/" + jsonMetaData.repository.full_name + "\/commit\/") == 0){
            let prNo = links[i].split("/")[6]
            getDataByUrl("/repos/" + jsonMetaData.repository.full_name + "/commits/" + prNo.toString())
              .then((cmJson) => handleCommit(cmJson))
              .then(() => resolve())
              .catch((err) => reject(err))
            return false;
          }
        }
        resolve()
      })
    }
    
    var handleCommit = (cmJson) => {
      return new Promise((resolve, reject) => {
        cmJson = JSON.parse(cmJson)
        repo.github_username = cmJson.author.login
        repo.commit = {
          date : cmJson.commit.author.date,
          age_check : false
        }
        if(repo.github_username === utopianName)
          repo.name_check = true
        if(Date.parse(checkList.contribution.created) - Date.parse(cmJson.commit.author.date) <= 14 * 86400000)
          repo.commit.age_check = true
        resolve()
      })
    }

    /** Searches the contributor's GitHub profile to find the Utopian.io username specified under the "name", "blog" and "bio" fields */
    var checkGithubProfile = () => {
      let username = repo.github_username
      if(repo.github_username == undefined){  //cannot found any link of a pull request or a commit. project owner maybe?
        username = jsonMetaData.repository.owner.login
      }
      return new Promise((resolve, reject) => {
        getDataByUrl("/users/" + username).then((res) => {
          let githubProfile = JSON.parse(res)
          let rgx = new RegExp(utopianName, 'i')
          if(githubProfile.name != null && (githubProfile.name).match(rgx) != null)
            repo.name_check = true
          if(githubProfile.blog != null && (githubProfile.blog).match(rgx) != null)
            repo.name_check = true
          if(githubProfile.bio != null && (githubProfile.bio).match(rgx) != null)
            repo.name_check = true
          resolve()
        }).catch((err) => reject(err))
      })
    }
    
    return new Promise((resolve, reject)=>{
      if(jsonMetaData.pullRequests[0] != null){  //a pull request is attached to the utopian.io contribution
        let pr = jsonMetaData.pullRequests[0]
        handlePR(pr)
          .then(() => {
            if(!repo.name_check)
              return githubReqBodyCheck(pr.body)
          })
          .then(() => {
            if(!repo.name_check)
              return checkGithubProfile()
          })
          .then(() => resolve())
          .catch((err) => reject(err));
      }
      else{
        searchForPRLinks()
          .then(() => {
            if(repo.github_username == undefined)
              return searchForCommitLinks()
          })
          .then(() => {
            if(repo.github_username == undefined || !repo.name_check) //There is not any commit/pr link OR utopian.io name doesn't match with the github name
              return checkGithubProfile()  // search for the utopian username on the user's profile
          })
          .then(() => resolve())
          .catch((err) => reject(err))
      }
    })
  }
  
  var getDataByUrl = (path) => {
    return new Promise((resolve, reject) => {
      let options = {
        url: "https://api.github.com" + path,
        headers: {
          'User-Agent': 'scoutopian',
          'Authorization': 'Basic ' +  new Buffer(process.env.GITHUB_PAT).toString('base64')
        },
        resolveWithFullResponse: true,
      }
      request(options)
        .then((response) => {
          if(parseInt(response.headers['x-ratelimit-remaining']) <= 0)
            reject("GitHub API rate limit exceeded! Limit will be reset " +
                  ((parseInt(response.headers['x-ratelimit-reset'] + "000") - Date.now())/60000).toPrecision(3) + " mins later\n")
          else
            resolve(response.body)
        }).catch((err) => reject(err))
    })
  }
  
  var createResponse = () => {
    return new Promise((resolve, reject) => {
      repo.text = ((repo.readme) ? ":white_check_mark:" : ":x:") + " README.md [SOFT] \n" +
                   ((repo.license) ? ":white_check_mark:" : ":x:") + " LICENSE [SOFT] \n" +
                   ((repo.age) ? ":white_check_mark:" : ":x:") + " Age [HARD] \n";
      if(jsonMetaData.type === "development" || jsonMetaData.type === "translations"){
        githubName().then(() => {
          repo.text += ((repo.name_check) ? ":white_check_mark:" : ":x:") + " GitHub Name \n" +
                       ((repo.commit != undefined && repo.commit.age_check) || (repo.pr != undefined &&repo.pr.age_check) ? ":white_check_mark:" : ":x:") + " PR/Commit Age \n"
          resolve()
        }).catch((err) => reject(err))
      }
      else resolve()
    })
  }
  
  var fetchRepoData = () => {
    return new Promise((resolve, reject) => {
      Promise.all([getDataByUrl("/repos/" + repoFullName + "/readme")
                   , getDataByUrl("/repos/" + repoFullName)])
      .then((results) => {
          let readme = results[0]
          if(readme.message == undefined)
            repo.readme = true
          let repoJson = JSON.parse(results[1])
          repo.pushed_at = repoJson.pushed_at
          if((parseInt(Date.parse(checkList.contribution.created))) - parseInt(Date.parse(repo.pushed_at)) <= 31556952000)  //1 year
            repo.age = true
          if(repoJson.license != null || (repoJson.parent != undefined && repoJson.parent.license != null))
            repo.license = true
          resolve()
      }).catch((err) => reject(err))
    }) 
  }
  
  return new Promise((resolve, reject) => {
      fetchRepoData()
      .then(() => createResponse())
      .then(() => {
        rules.score.decSoft(repo.readme)
        rules.score.decSoft(repo.license)
        rules.score.decHard(repo.age)
        if(jsonMetaData.type === "development" || jsonMetaData.type === "translations"){
          rules.score.decHard(repo.name_check)
          rules.score.decHard((repo.commit != undefined && repo.commit.age_check) || (repo.pr != undefined && repo.pr.age_check))
        }
      })
      .then(() => {
        resolve(repo)
      }).catch((err) => reject(err))
  })
    
}


rules.downvoteCheck = (votes) => {
  let downvotes = {
    steemcleaners : true,
    cheetah : true,
    mack_bot : true,
    spaminator : true
  };
  for(let i=0; i<votes.length;i++){
    //cheetah *upvotes* when it detects plagiarism
    if(votes[i].voter === "cheetah"){
      downvotes.cheetah = false;
    }
    else{
      if(votes[i].rshares < 0){
        switch (votes[i].voter){
          case "steemcleaners": downvotes.steemcleaners = false; break;
          //case "cheetah": downvotes.cheetah = false; break;
          case "mack-bot": downvotes.mack_bot = false; break;
          case "spaminator": downvotes.spaminator = false; break;
          default : break;
        }
      }
    }
  }
  downvotes.text = (downvotes.steemcleaners ? ":white_check_mark:" : ":x:") + " steemcleaners\n" +
                   (downvotes.cheetah ? ":white_check_mark:" : ":x:") + " cheetah\n" +
                   (downvotes.mack_bot ? ":white_check_mark:" : ":x:") + " mack-bot\n" +
                   (downvotes.spaminator ? ":white_check_mark:" : ":x:") + " spaminator\n";
  if(!downvotes.steemcleaners || !downvotes.cheetah || !downvotes.mack_bot || !downvotes.spaminator)
    rules.score.decHard(false);
  return new Promise((resolve, reject) => {
    resolve(downvotes);
  })
}


rules.score = {
  decSoft: (checkedRule) => {
          if(!checkedRule){
            this.value -= 10;  // score decrement can be adjusted by total number of the soft rules
            this.value = (this.value < 0) ? 0 : this.value;
          }
        },
  decHard: (checkedRule) => {
          if(!checkedRule){
            this.value = Math.floor(this.value/1.5);
          }
        },
  value: 100
}


rules.getContribution = (url) => {
  url = url.split("/")
  let author = url[4].split("@")[1]
  let permlink = url[5]
  return new Promise((resolve, reject) => {
    steem.api.getContent(author, permlink, (err, res) => {
      if(err) return reject(err);
      resolve(res)
    })
  })
}


rules.completeRuleCheck = (url) => {
  let checkList = {}
  return new Promise((resolve, reject) => {
    rules.getContribution(url)
    .then((contribution) => {
      checkList.contribution = contribution
      //console.log(contribution)
    })
    .then(() => 
      Promise.all([rules.githubCheck(checkList),
                   rules.downvoteCheck(checkList.contribution.active_votes),
                   rules.detectLanguage(checkList.contribution.body)])
      .then((results) => {
        checkList.github = results[0]
        checkList.downvotes = results[1]
        checkList.language = results[2]
        checkList.score = rules.score.value
        resolve(checkList)
      })
    ).catch((err) => reject(err))
  })
}


rules.detectLanguage = (text) => {
  let textSample = text.split(" ").slice(0, 50).join(" ")
  let language = {
    text: "",
    lang_check: false
  }
  let options = {
    url: "http://ws.detectlanguage.com/0.2/detect",
    qs: {
      q: textSample,
      key: process.env.DETECT_LANG_KEY
    }
  }
  return new Promise((resolve, reject) => {
    request(options)
    .then((res) => {
      language.api_result = JSON.parse(res)
      let firstDetected = language.api_result.data.detections[0]
      language.name = languageNames[firstDetected.language]
      if(firstDetected.language === "en" && firstDetected.isReliable)
        language.lang_check = true
      language.text = (language.lang_check ? ":white_check_mark: " : ":x: ") + language.name +" \n"
      rules.score.decHard(language.lang_check)
      resolve(language)
    })
    .catch(err => {reject(err)})
  })
}


module.exports = rules;
