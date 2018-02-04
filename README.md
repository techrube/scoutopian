# **SCOUTOPIAN<sub>_DISCORD BOT_</sub>** 
Scoutopian is designed to be a utopian.io Discord Bot which will inspect contributions to give users and mods an opinion whether the contribution meets the [rules](https://utopian.io/rules).

![scoutopian-header-image](https://res.cloudinary.com/hpiynhbhq/image/upload/v1516409451/mj0ar1oom5trozxzqoix.png)

*All features support Utopian.io Rules Update #8

## Features
**1- GitHub repository**
- Looks for README.md and LICENSE files in the repo
- Checks if the last commit is older than 1 year
- Compares Utopian and GitHub names of the contributor. (for development category)
  - Scoutopian will also search for the utopian username in the following fields if GitHub username is not same as utopian name.
    - Body of the pull request
    - The "name", "bio" and "blog fields" of the user's GitHub profile
- Checks if PR merge or Commit date is at most 14 days old. (for development category)
- Gives an estimated score calculated by SOFT and HARD rules of Utopian

**2- Downvotes**
- Looks for downvotes of the accounts/bots listed below
   - @steemcleaners
   - @cheetah (upvotes will also count)
   - @mack-bot
   - @spaminator

**3- Coming Features & Roadmap**
- All possible rules will be added including category rules
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
