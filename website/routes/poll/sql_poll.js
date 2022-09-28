const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../webserver.env') });
const { PollData } = require('./poll_data.js');
const {createHash} = require('crypto');
const MAX_OPTIONS = 4;
const mysql = require('mysql');

// source for hashing https://stackoverflow.com/questions/27970431/using-sha-256-with-nodejs-crypto
function ComputeSHA256(text){
    const hash = createHash('sha256');
    hash.write(text);
    return hash.digest('base64');
}


// trying idea from https://stackoverflow.com/questions/18496540/node-js-mysql-connection-pooling
var pool = mysql.createPool({
    host: 'database',
    port: 3306,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: 'server_data'
});

async function UsePooledConnectionAsync(actionAsync) {
    const connection = await new Promise((resolve, reject) =>{
        pool.getConnection((ex, connection) => {
            if (ex){
                reject(ex);
            }
            else {
                resolve(connection);
            }
        });
    });
    try {
        return await actionAsync(connection);
    } finally {
        connection.release();
    }
}

async function Query(connection, query_prompt){
    return await new Promise((resolve, reject) =>{
        connection.query(query_prompt, (err, results) => {
            if(err){
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

const polls_cache = new Map();



// helper methods
async function GetPoll(poll_name, guild_id) {
    if(poll_name === undefined || guild_id === undefined || poll_name === null || guild_id === null) return null;
    // check cache
    if(polls_cache.has((poll_name, guild_id))){
        return polls_cache.get((poll_name, guild_id));
    }
    let poll = null;
    const hash = ComputeSHA256(poll_name + guild_id);
    console.log(`Poll Name: ${poll_name}\nGuild ID: ${guild_id}\nHash: ${hash}`);
    // check database
    return await UsePooledConnectionAsync(async connection => {
        const results = await Query(connection, `SELECT * FROM polls WHERE poll_guild_hash = \'${hash}\';`);
        if( results == null || results.length === 0 ) {
            return null;
        }
        const result = results[0];
        console.log(`Query result:\n${JSON.stringify(result)}`);
        const optionNames = [];
        for(let i = 0; i < 4; i++){
            let option_name = result[`option_name_${i}`];
            if( option_name === null ) {
                break;
            }
            optionNames.push(option_name);
        }
        poll = new PollData(guild_id, result.name, hash, optionNames);
        // fill out poll if poll
        if( poll ){
            const votes = await Query(connection, `SELECT * FROM votes WHERE poll_guild_hash=\'${hash}\';`);
            for( const vote of votes ){
                poll.add_tally(vote.user_id, vote.vote_option);
            }
            polls_cache.set(poll.name, poll);
        }
        return poll;
    });
}

async function RegisterPollVote(guild_id, poll_name, user_id, vote_option) {
    const poll = await GetPoll(poll_name, guild_id);
    //console.log(`Got poll: ${poll}`);
    // if valid input, update to database
    if( !(poll && poll.add_tally(user_id, vote_option)) ){
        return false;
    }
    const poll_guild_hash = ComputeSHA256(poll_name+guild_id);
    const user_poll_guild_hash = ComputeSHA256(user_id+poll_guild_hash);
    let query_vote = `INSERT INTO votes (user_id, poll_guild_hash, user_poll_guild_hash, vote_option) VALUES (\'${user_id}\', \'${poll_guild_hash}\', \'${user_poll_guild_hash})\', ${vote_option}) ON DUPLICATE KEY UPDATE vote_option = ${vote_option};`  
    //console.log(`Sending query to add vote:\n${query_vote}`);
    return await UsePooledConnectionAsync( async connection => {
        const vote_results = await Query(connection, query_vote);
        //console.log(`Vote Results:\n${vote_results}`);
        return (vote_results.affectedRows && vote_results.affectedRows > 0);
    });
}

async function CreatePoll(guild_id, poll_name, option_names){
    // check if poll exists
    // check cache
    let exists_in_cache = polls_cache.has(poll_name);
    if( exists_in_cache || option_names.length > MAX_OPTIONS || 2 > option_names.length ) {
        console.log(`Invalid option length (${option_names.length}) or exists in cache (${exists_in_cache}).`)
        return false;
    }
    // cache miss => check database
    const hash = ComputeSHA256(poll_name+guild_id);
    // query if poll is in database
    let q_poll_exist = `SELECT * FROM polls WHERE poll_guild_hash = \'${hash}\';`;
    // input to create poll in database
    // parameters
    let q_param = `(poll_name, guild_id, poll_guild_hash, option_name_${Array.from(option_names.keys()).join(', option_name_')})`;
    // values
    let q_values = `(\'${poll_name}\', \'${guild_id}\', \'${hash}\', \'${option_names.join('\', \'')}\')`;
    let q_poll_create = `INSERT IGNORE INTO polls ${q_param} VALUES ${q_values};`;
    return await UsePooledConnectionAsync(async connection => {
        const poll_query_results = await Query(connection, q_poll_exist);
        if(poll_query_results && poll_query_results.length > 0){
            return false;
        }
        // create poll in database
        const poll_create_results = await Query(connection, q_poll_create);
        return (poll_create_results.affectedRows && poll_create_results.affectedRows > 0);
    });
}

module.exports = {GetPoll, RegisterPollVote, CreatePoll};