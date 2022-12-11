// libraries
var express = require('express');
var router = express.Router();
// code to handle the mysql connections to reduce clutter
const { GetPollNames, GetPoll, RegisterPollVote, CreatePoll } = require('../src//poll_data_structures/sql_poll');

// base connection (should not be accessed)
router.get('/', function( req, res ) {
    res.send('Welcome to the poll area, you are not in the right place.');
});

/**
 * Route to get the ongoing polls in a given server
 * input: through query in a get request
 *      params (required)
 *          ?guild_id -> id of the guild to see associated polls
 * output: json format
 *      fields:
 *          success -> if there is a query hit (if the server has polls)
 *          poll_names -> an array of the poll names
 */
router.get('/get_polls', async function ( req, res ) {
    // get params
    const guild_id = req.query.guild_id;
    if(guild_id == null){
        res.sendStatus(404);
    }
    (async ()=> {
        try{
            const poll_names = await GetPollNames(guild_id);
            const has_polls = (poll_names.length)?poll_names.length > 0:false;
            res.setHeader('Content-Type', 'application/json');
            if(has_polls){
                res.status(200).end(JSON.stringify(
                    {
                        success: true,
                        poll_names: Array.from(poll_names, (v,i) => (v.poll_name))
                    }, null, 3
                ));
            } else {
                res.status(400).end(JSON.stringify(
                    {
                        success: false,
                        poll_names: []
                    }, null, 3
                ));
            }
        } catch (err) {
            console.log(`ERROR: ${err}`);
            res.sendStatus(500);
        }
    })();
});

/**
 * route to obtain results
 * input: through query in get request
 *      params (all required)
 *          ?id -> poll name / id
 *          ?guild_id -> id of associated guild (server) that is having the poll
 * output: json format
 *      fields:
 *          success -> if there is a query hit (poll was found in cache or database)
 *          poll_name -> the poll's name
 *          poll_option_names -> an array of the names of the options for the poll
 *          poll_results -> an array of the number of votes for the options (in same order as poll_option_names above)
 */
router.get('/results', async function( req, res ) {
    // get params
    const poll_name = req.query.id;
    const guild_id = req.query.guild_id;
    // check if they exist
    if(!(poll_name && guild_id)){
        res.sendStatus(404);
        return;
    }
    // start obtaining poll
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

/**
 *  route to post a poll creation for a guild
 *  input: json format in post request
 *      fields:
 *          guild_id -> the id of the guild (server)
 *          poll_name -> name of the poll
 *          option_names -> array of the option names for the poll
 *  output: status code
 *      200 -> poll created
 *      400 -> improper input
 *      409 -> duplicate poll
 *      500 -> internal error
 */
router.post('/create', function ( req, res ){
    // get fields
    const {guild_id, poll_name, option_names} = req.body;
    // check for required fields
    if(guild_id == null || poll_name == null || option_names == null || option_names.length == null || option_names.length < 2){
        res.sendStatus(400);
        return;
    }
    // start poll creation
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

/**
 *  route to post vote for a specific poll with associated guild
 *  input: json format in post request
 *      fields:
 *          guild_id -> the id of the guild (server)
 *          poll_name -> name of the poll
 *          user_id -> id of user casting vote
 *          option_number -> number of the associated vote option
 *  output: status code
 *      200 -> vote casted
 *      400 -> improper input
 *      500 -> internal error
 */
router.post('/vote', async function ( req, res ) {
    // get fields
    const { guild_id, poll_name, user_id, option_number } = req.body;
    // check required fields
    if(guild_id == null || poll_name == null || user_id == null || option_number == null){
        res.sendStatus(400);
        return;
    }
    // cast/update vote
    (async () =>{
        try {
            const vote_results = await RegisterPollVote(guild_id, poll_name, user_id, option_number);
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