const express = require('express');
const router = express.Router();
const axios = require('axios');
const instance = axios.create();
instance.defaults.timeout = 10000;
const pollServer = "http://backend:3000";

router.get('/', async function( req, res ) {
    const guild_id = req.query.guild_id;
    const website_info = {
        stringify: require('js-stringify'),
        title: 'Server info',
        body: 'Here is where we can look at the data for the polls for each server!',
        poll_names: []
    };
    (async () => {
        try{
            if(!(guild_id == null)) {
                website_info.guild_id = stringifyNoQuotes(guild_id);
                // get server 
                website_info.body = `No data for server of id ${website_info.guild_id}`;
                await instance.get(`${pollServer}/poll/get_polls?guild_id=${website_info.guild_id}`)
                    .then(function(response){
                        if(response.data.success){
                            website_info.body = `Data found for the server with id ${website_info.guild_id}`;
                            website_info.poll_names = Array.from(response.data.poll_names, (v,i) => (stringifyNoQuotes(v)));
                            website_info.script = "/javascripts/chart_option.js";
                        }
                    })
                    .catch(function (error) {
                        const status_code = (error.response !== undefined && error.response.status !== undefined)?error.response.status:404;
                        if(!(status_code === 400)){
                            console.log(`ERROR: ${error.message}`);
                            res.sendStatus(500);
                        }
                    })
                    res.render('server_info', website_info);
            }
        } catch (err) {
            console.log(`ERROR: ${err}`);
            res.sendStatus(500);
        }
    })();
});

router.get('/poll_data', async function ( req, res ) {
    const guild_id = req.query.guild_id;
    const poll_name = req.query.poll_name;
    if(guild_id == null || poll_name == null){
        res.sendStatus(400);
    }
    (async () => {
        instance.get(`${pollServer}/poll/results?guild_id=${guild_id}&id=${poll_name}`)
            .then(function(response){
                if(response.data.success){
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).end(JSON.stringify(response.data));
                }
            })
            .catch(function (error) {
                console.log(error);
                const status_code = (error.response !== undefined && error.response.status !== undefined)?error.response.status:404;
                if(!(status_code === 400)){
                    console.log(`ERROR: ${error.message}`);
                    res.sendStatus(500);
                }else{
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).end(JSON.stringify({success:false}));
                }
            })
    })();
});

// helper

/**
 * turns json to a string without quotes
 * @param {*} object to get string version without quotes
 */
function stringifyNoQuotes(object){
    return JSON.stringify(object).replace(/"/g, '');
}

module.exports = router;