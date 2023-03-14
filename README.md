# docker-node-discord-bot
A discord bot that is built to be inside of a docker container,
using node.js.

## Requirements

### Docker
The project runs in a container, so to run the project
it requires docker and an internet connection to pull
the images along with packages for the libraries the
project runs on.

### Discord Bot Application
In the [Discord Developer Portal](https://discord.com/developers/applications),
you can create applications and bots where your server members can interface
with your applications. 
* Note for permissions, they will require at least the following permissions:
  * Send Messages
  * Use Slash Commands
* I also am using the following permissions for future features and etc, but they
likely aren't required for current functionality:
  * View Channels
  * Manage Events
* Also note that you will also need to keep note of the bot's token, located in the
bot tab of the app you desire to use. You can only see the token once, otherwise
you'd need to reset the token to see the new associated token for the bot.

### Environment Variables
In addition to docker, the scripts
and the container in its entirety requires some
environment variables to run properly. Below I list
the environment variables required and in what file
the docker-compose.yml utilizes to insert the variables.

#### Format
Note for your information that the .env files use for these applications use the following format:
```
DISCORD_TOKEN=TOKEN_GOES_HERE
CLIENT_ID=ID_GOES_HERE
GUILD_ID=ID_GOES_HERE
```
To avoid any issues, please leave the environment variable names as all caps, and do not change
the cases when coping over the desired variable values, for example the Discord token value.

#### command_deployer.js
./discordbot.env
* DISCORD_TOKEN
  * The secret token that you can get as described above in the bot application section.
* CLIENT_ID
  * The ID of the client, or the bot you created earlier, when added to your sever.
  * Can be obtained by right clicking on the user for the bot and clicking on Copy ID (it may need your Discord client to be in developer mode)
* GUILD_ID
  * The ID of your Discord server
  * Can be obtained in the settings of your Discord server (click on the down arrow by your server name and click on the server settings option).
    * Within settings the server, the ID can be found in the Widget category, listed as SERVER ID.


#### full containers
* ./discordbot.env
  * DISCORD_TOKEN
  * CLIENT_ID
  * GUILD_ID
* ./sql_root.env
  * MYSQL_ROOT_PASSWORD
    * The password that you desire to be for root.
* ./sql_db.env
  * MYSQL_DATABASE
    * The name of the database you wish to use.
  * MYSQL_POLL_TABLE
    * The name of table for holding data about the polls.
  * MYSQL_VOTE_TABLE
    * The name of table for holding data about individual votes.
* ./sql_user.env
  * MYSQL_USER
    * The username for the user that the webserver will use.
  * MYSQL_PASS
    * The password for the user that the webserver will use.
  * CACHE_SIZE
    * The total amount of polls that the webserver will hold at a time before removing from memory.
## How to run:
### Register commands
To have the current commands registered on your Discord server (as I do not have the commands registered globally) you will need to execute the following line when within the discord_bot directory (requires node.js installed on system):
```
node command_deployer.js
```
### Execute via terminal
If you desire to launch via the terminal, change your directory to the main directory of the project ( where `ls` would return the directories like discord_bot and website, along with the docker-compose.yml ) and use the following command: 
```
docker compose up
```
If it returns the following response and you have docker installed:
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
```
Try the following command before trying `docker compose up` again:
```
sudo service docker start
```
## Close
To end your service via the terminal, press Control and C key (or Ctrl+C for short). Press twice to forcefully kill the container. If you have any issues with the project, please make sure you are on the most recent commit. If so, please submit via the issues section of the project, and list in the beginning what branch are you using! I hope this works for you and have fun messing around with it!
