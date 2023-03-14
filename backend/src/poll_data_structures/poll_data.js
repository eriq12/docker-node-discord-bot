
exports.PollData = function(guild_id, poll_name, hash, optionNames){
    this.name = poll_name;
    this.guild_id = guild_id;
    this.hash = hash;
    this.user_votes = new Map();
    this.amount_options = optionNames.length;
    this.option_names = optionNames;
    /**
     * Tallies the votes of the poll
     * @returns an array of the sums of tallies for each option, in the same order as appears in option_names field
     */
    this.tally_all = function() {
        const tally = new Array(this.amount_options).fill(0);
        for ( const [_, value] of this.user_votes ){
            tally[value]++;
        }
        return tally;
    }
    /**
     * Casts a vote or tally for an option
     * @param {*} user the id of the user casting the vote
     * @param {*} vote_option the option that the user selects
     * @returns true if valid option, false if not
     */
    this.add_tally = function(user, vote_option) {
        if(vote_option < this.amount_options && vote_option >= 0){
            this.user_votes.set(user, vote_option);
            return true;
        }
        return false;
    }
}