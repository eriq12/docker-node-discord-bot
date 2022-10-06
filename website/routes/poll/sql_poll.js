// libraries
const { PollData } = require('./poll_data.js');
const { createHash } = require('crypto');
const MAX_OPTIONS = 4;
const mysql = require('mysql');

// environement variables required
const {MYSQL_USER, MYSQL_PASS, MYSQL_DATABASE, MYSQL_POLL_TABLE, MYSQL_VOTE_TABLE} = process.env;

// check for environment variables
(() => {
    if(MYSQL_USER == null ||
        MYSQL_PASS == null ||
        MYSQL_DATABASE == null ||
        MYSQL_POLL_TABLE == null ||
        MYSQL_VOTE_TABLE == null){
        throw `Environment variables MYSQL_USER (${MYSQL_USER}), MYSQL_PASS (${MYSQL_PASS}), MYSQL_DATABASE (${MYSQL_DATABASE}), MYSQL_POLL_TABLE (${MYSQL_POLL_TABLE}), or MYSQL_VOTE_TABLE (${MYSQL_VOTE_TABLE}) undefined.`;
    }
})();

// the preset queries to create the tables

// should probably in the future scale this with MAX_OPTIONS, but given how I have my discord command, leaving as is.
const q_create_polls_table = `CREATE TABLE IF NOT EXISTS ${MYSQL_POLL_TABLE} (
    poll_name varchar(50) NOT NULL,
    guild_id varchar(50) NOT NULL,
    poll_guild_hash varchar(64) NOT NULL,
    option_name_0 varchar(50) NOT NULL,
    option_name_1 varchar(50) NOT NULL,
    option_name_2 varchar(50),
    option_name_3 varchar(50),
    PRIMARY KEY (poll_guild_hash)
);`;

const q_create_votes_table = `CREATE TABLE IF NOT EXISTS ${MYSQL_VOTE_TABLE} (
    user_id varchar(50) NOT NULL,
    poll_guild_hash varchar(64) NOT NULL,
    user_poll_guild_hash varchar(64) NOT NULL,
    vote_option int NOT NULL,
    PRIMARY KEY (user_poll_guild_hash),
    FOREIGN KEY (poll_guild_hash) REFERENCES polls(poll_guild_hash)
);`;

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
    user: MYSQL_USER,
    password: MYSQL_PASS,
    database: MYSQL_DATABASE
});

/**
 * wrapper function to avoid the querry after fatal error stuff
 * @param actionAsync callback function to call, can include multiple queries to sql database (will take a while though if done)
 * @return results from callback function
 */
async function UsePooledConnectionAsync(actionAsync) {
    // try to get connection
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
    // then try with connection to first check the regular tables used, then do callback function
    try {
        // create the required tables if needed before performing the callbacks
        // though will result in taking a longer time if not created, resulting in discord bot returning in cannot connect.
        await Query(connection, q_create_polls_table);
        await Query(connection, q_create_votes_table);
        return await actionAsync(connection);
    } finally {
        connection.release();
    }
}

/**
 * function for ease without needing much for the full part for mysql querry
 * Note: MUST BE USED INSIDE UsePooledConnectionAsync function
 * @param {*} connection the connection obtained via the UsePooledConnectionAsync
 * @param {*} query_prompt the mysql query desired to be executed
 * @returns the response from the mysql querry (the results portion)
 */
async function Query(connection, query_prompt){
    return await new Promise((resolve, reject) => {
        connection.query(query_prompt, (err, results) => {
            if(err){
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// map to hold the polls
// key: a tuple of (poll_name, guild_id)
// value: a poll_data object containing poll data
const polls_cache = new Map();

// helper methods

/**
 * helper method to get poll (will check cache then database if cache miss)
 * @param {*} poll_name name of the poll
 * @param {*} guild_id id of the associated guild of the poll
 * @returns an object poll_data of the poll whose poll_name and guild_id combination matches the parameters
 */
async function GetPoll(poll_name, guild_id) {
    if(poll_name === undefined || guild_id === undefined || poll_name === null || guild_id === null) return null;
    // check cache
    if(polls_cache.has((poll_name, guild_id))){
        return polls_cache.get((poll_name, guild_id));
    }
    // cache miss, checking database...
    let poll = null;
    const hash = ComputeSHA256(poll_name + guild_id);
    //console.log(`Poll Name: ${poll_name}\nGuild ID: ${guild_id}\nHash: ${hash}`);
    // check database
    return await UsePooledConnectionAsync(async connection => {
        // isolate selection to just option names, as we already have the other data
        const results = await Query(connection, `SELECT option_name_0, option_name_1, option_name_2, option_name_3 FROM ${MYSQL_POLL_TABLE} WHERE poll_guild_hash = \'${hash}\';`);
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
        poll = new PollData(guild_id, poll_name, hash, optionNames);
        // fill out poll if poll
        if( poll ){
            const votes = await Query(connection, `SELECT user_id, vote_option FROM ${MYSQL_VOTE_TABLE} WHERE poll_guild_hash=\'${hash}\';`);
            for( const vote of votes ){
                poll.add_tally(vote.user_id, vote.vote_option);
            }
            polls_cache.set(poll.name, poll);
        }
        return poll;
    });
}

/**
 * Helper method to register a vote under the specified poll
 * @param {*} guild_id id of the guild where the poll is taking place
 * @param {*} poll_name name of the poll
 * @param {*} user_id id of the user casting the vote
 * @param {*} vote_option option which the vote selects
 * @returns true if vote was submitted, false if incorrect
 */
async function RegisterPollVote(guild_id, poll_name, user_id, vote_option) {
    const poll = await GetPoll(poll_name, guild_id);
    // try updating cache
    if( !(poll && poll.add_tally(user_id, vote_option)) ){
        // invalid
        return false;
    }
    // if valid input, update to database
    const poll_guild_hash = ComputeSHA256(poll_name+guild_id);
    const user_poll_guild_hash = ComputeSHA256(user_id+poll_guild_hash);
    let query_vote = `INSERT INTO ${MYSQL_VOTE_TABLE} (user_id, poll_guild_hash, user_poll_guild_hash, vote_option) VALUES (\'${user_id}\', \'${poll_guild_hash}\', \'${user_poll_guild_hash})\', ${vote_option}) ON DUPLICATE KEY UPDATE vote_option = ${vote_option};`  
    // no need to wait for response, just updating backend database
    UsePooledConnectionAsync( async connection => {
        await Query(connection, query_vote);
    });
    return true;
}

/**
 * Helper method to create poll
 * @param {*} guild_id id of guild (server) associated with poll
 * @param {*} poll_name name of poll
 * @param {*} option_names an array of the names for the options
 * @returns true if created, false if incorrect parameters or duplicate poll in guild (server)
 */
async function CreatePoll(guild_id, poll_name, option_names){
    // check if poll exists
    // check cache
    let exists_in_cache = polls_cache.has((poll_name, guild_id));
    if( exists_in_cache || option_names.length > MAX_OPTIONS || 2 > option_names.length ) {
        console.log(`Invalid option length (${option_names.length}) or exists in cache (${exists_in_cache}).`)
        return false;
    }
    // cache miss => check database
    const hash = ComputeSHA256(poll_name+guild_id);
    // query if poll is in database, no need to actually get columns, just having 1 per row/entry is enough
    let q_poll_exist = `SELECT 1 FROM ${MYSQL_POLL_TABLE} WHERE poll_guild_hash = \'${hash}\';`;
    // input to create poll in database
    // parameters
    let q_param = `(poll_name, guild_id, poll_guild_hash, option_name_${Array.from(option_names.keys()).join(', option_name_')})`;
    // values
    let q_values = `(\'${poll_name}\', \'${guild_id}\', \'${hash}\', \'${option_names.join('\', \'')}\')`;
    let q_poll_create = `INSERT IGNORE INTO ${MYSQL_POLL_TABLE} ${q_param} VALUES ${q_values};`;
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