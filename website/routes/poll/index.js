var express = require('express');
var router = express.Router();
const { GetPoll, RegisterPollVote, CreatePoll } = require('./sql_poll');


router.get('/', function( req, res ) {
    res.send('Welcome to the poll area, you are not in the right place.');
});

router.get('/results', async function( req, res ) {
    const poll_name = req.query.id;
    const guild_id = req.query.guild_id;
    //console.log(`Webserver Query:\nPoll Name: ${poll_name}\nGuild id: ${guild_id}`);
    if(!(poll_name && guild_id)){
        res.sendStatus(404);
        return;
    }
    (async () => {
        try{
            const poll_data = await GetPoll(poll_name, guild_id);
            res.setHeader('Content-Type', 'application/json');
            if(poll_data){
                res.status(200).end(JSON.stringify(
                    {
                        success: true,
                        poll_name: poll_name,
                        poll_option_names: poll_data.option_names,
                        poll_results: poll_data.tally_all()
                    }, null, 3 ));
            } else {
                res.status(400).end(JSON.stringify(
                    {
                        success: false,
                        poll_name: poll_name,
                        poll_option_names: null,
                        poll_results: null
                    }, null, 3));
            }
        } catch (err) {
            console.log(`ERROR: ${err}`);
            res.sendStatus(500);
        }
    })();
});

router.post('/create', function ( req, res ){
    const {guild_id, poll_name, option_names} = req.body;
    //console.log(`Guild ID: ${guild_id}\nPoll Name: ${poll_name}\nPoll Option Names: ${option_names}`);
    (async () => {
        try{
            const results = await CreatePoll(guild_id, poll_name, option_names);
            if(results){
                res.sendStatus(200);
            } else {
                res.sendStatus(409);
            }
        } catch (err) {
            console.log(`ERROR: ${err.message}`);
            res.sendStatus(500);
        }
    })();
});

router.post('/vote', async function ( req, res ) {
    //console.log(`Request body:\n${JSON.stringify(req.body)}`);
    const { guild_id, poll_name, user_id, option_number } = req.body;
    (async () =>{
        try {
            const vote_results = await RegisterPollVote(guild_id, poll_name, user_id, option_number);
            //console.log(`Obtained Results:\n${vote_results}`);
            if(vote_results){
                res.sendStatus(200);
            } else {
                res.sendStatus(400);
            }
        } catch (err) {
            console.log(`ERROR: ${err.message}`);
            res.sendStatus(500);
        }
    })();
});

module.exports = router;