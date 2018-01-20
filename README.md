# **SCOUTOPIAN<sub>_DISCORD BOT_</sub>** 
Scoutopian is designed to be a utopian.io Discord Bot which will check contributions to give users/mods an opinion whether the contribution meets the [rules](https://utopian.io/rules).

![scoutopian-header-image](https://res.cloudinary.com/hpiynhbhq/image/upload/v1516409451/mj0ar1oom5trozxzqoix.png)

## Features
**1- GitHub repository**
- Looks for README.md and LICENSE files in the repo
- Checks if the last commit is older than 1 year
- Compares Utopian and GitHub names of the contributor. (for development category)
  - Scoutopian will also search for the utopian username in the body of pull request if GitHub username is not same as utopian name.
- Gives an estimated score calculated by SOFT and HARD rules of Utopian

**2- Downvotes**
- Look for downvotes of the accounts/bots listed below
   - @steemcleaners
   - @cheetah (upvotes will also count)
   - @mack-bot
   - @spaminator

**3- Coming Features & Roadmap**
- All possible rules will be added including category rules
- If you have any suggestion or noticed a bug to report; you can contact me on Discord (@techrube#9826).
___
## How to set up:
**1 - Create a Discord App & a Bot User**
- Visit this link: [https://discordapp.com/developers/applications/me](https://discordapp.com/developers/applications/me)
- Click the `New App` button and fill the necessary information
- Click the `Create a Bot User` button

**2 - Add the Bot User to Your Discord Server** 
- Copy "Client ID" under app details section and paste it to its place in this link: `https://discordapp.com/oauth2/authorize?&client_id=<CLIENT ID>&scope=bot&permissions=0` (You can also use `OAUTH2 URL GENERATOR`)

**3 - Set Environment Variables**
- Copy the bot user token from the Discord App page
- Set the `DISCORD_BOT_TOKEN` in your `.env` using your bot token that you just copied.

___
## Technology Stack
- **Language:** Javascript
- **Server Framework:** Node.js
- The icon is a modified form of a design which provided by [Freepik](http://www.freepik.com)

**Libraries**
- [Steem.js](https://www.npmjs.com/package/steem) - Interacting with the Steem Blockchain
- [Eris](https://www.npmjs.com/package/eris) - Interacting with the Discord API
- [Cheerio](https://www.npmjs.com/package/cheerio) - Server side jQuery implementation
- [Request](https://www.npmjs.com/package/request) - To make http calls

## Preview
**Sample Case 1:** Utopian username does not match with GitHub username and cannot found attached to pull request or name field on the GitHub profile page of the contributor. (This check is specific to development category)
![Different-GitHub-Name](https://res.cloudinary.com/hpiynhbhq/image/upload/v1516409254/ovpby06zu2pooetqmfnn.gif)

**Sample Case 2:** Contribution is flagged by at least one of the cleaner accounts/bots
![Downvoted-by-Bots](https://res.cloudinary.com/hpiynhbhq/image/upload/v1516409253/od2ljdouiybakvim3of8.gif)
