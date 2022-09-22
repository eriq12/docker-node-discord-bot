var express = require('express');
var { PollData } = require('./poll_data.js');
var router = express.Router();

const polls_cache = new Map();

router.get('/', function( req, res ) {
    res.send('Welcome to the poll area, you are not in the right place.')
});

router.get('/results', function( req, res ) {
    poll_name = req.query.id;
    res.setHeader('Content-Type', 'application/json');
    const poll_exists = polls_cache.has(poll_name)
    console.log(`req = ${req}\nquerry.id: ${poll_name}\nexists?: ${poll_exists}`);
    if(poll_name && poll_exists){
        const poll_data = polls_cache.get(poll_name);
        res.status(200).end(JSON.stringify(
            {
                success: true,
                id: poll_name,
                poll_option_names: poll_data.option_names,
                poll_results: poll_data.tally_all()
            }, null, 3));
    } else {
        res.end(JSON.stringify(
            {
                success: false,
                id: poll_name,
                poll_option_names: null,
                poll_results: null
            }, null, 3));
    }
});

router.post('/create', function ( req, res ){
    const {name, option_names} = req.body;
    console.log(`Poll Name: ${name}\nPoll Option Names: ${option_names}`);
    if(!polls_cache.has(name) && option_names.length > 1 && option_names.length <= 4){
        poll_info = new PollData(name, option_names);
        polls_cache.set(name, poll_info);
        res.sendStatus(202);
    } else {
        res.sendStatus(409);
    }
});

router.post('/vote', function ( req, res ) {
    const { poll_name, user_id, option_number } = req.body;
    if(poll_name && polls_cache.has(poll_name)){
        const poll = polls_cache.get(poll_name);
        if(poll.add_tally(user_id, option_number)){
            res.sendStatus(202);
            return;
        }
    }
    res.sendStatus(404);
});

module.exports = router;