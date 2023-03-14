const DEBUG = true;
const { MinHeap } = require("./min_heap");
class CacheMap extends Map {
    // private fields
    #max_access_record;
    #access_record_queue;
    #access_frequency;
    #max_cache_record;
    #min_heap;

    constructor(max_cache_record, debug=false){
        super();
        this.#max_access_record = max_cache_record * 2;
        this.#access_record_queue = new Array(this.#max_access_record);
        this.#access_frequency = new Map();
        this.#max_cache_record = max_cache_record;
        this.#min_heap = new MinHeap(this.#max_cache_record, debug);
    }
    /**
     * Get the associated data using the given key
     * @param {*} key the key to access the coresponding data
     * @returns the data matched with the key
     */
    get(key){
        // if not exist, just return null
        if(!this.has(key)){
            return null;
        }
        // update data about frequency
        this.#helper_update_access(key);
        // return regular get
        return super.get(key);
    }

    /**
     * Sets a data record associated with a given key
     * @param {*} key the key to access the associated data
     * @param {*} value the record to hold
     */
    set(key, value){
        if(key == null){
            return;
        }
        // update data about frequency
        this.#helper_update_access(key);
        // update map
        super.set(key, value);
    }

    // helper methods
    /**
     * Updates the frequencies, and purge records when cache overflows
     * @param {*} key 
     */
    #helper_update_access(key){
        //DEBUG_LOG("");
        // update record queue
        let dequeued_access_record = this.#access_record_queue.shift();
        this.#access_record_queue.push(key);

        // update access frequencies

        // add section
        // get new value
        let new_frequency = 1;
        // if there is a record, sum together
        if(this.#access_frequency.has(key)){
            new_frequency = new_frequency + this.#access_frequency.get(key);
        }
        // update access frequency 
        this.#access_frequency.set(key, new_frequency);

        // remove section
        // if dequeued_access_record is not null, decrement associated key
        if(dequeued_access_record != null){
            let new_frequency = this.#access_frequency.get(dequeued_access_record) - 1;
            // if it goes to 0, remove from frequency map
            if(new_frequency <= 0){
                this.#access_frequency.delete(dequeued_access_record);
            } else {
                this.#access_frequency.set(key, new_frequency);
            }
        }

        // update min heap
        // check if in heap, if so then increment, else add, or remove
        if(this.#min_heap.hasKey(key)){
            this.#min_heap.update(key, 1);
        }
        // try adding, if fails, then replace and remove associated key from cache as well
        else if (!this.#min_heap.add(key, this.#access_frequency.get(key, new_frequency))){
            let popped_key = this.#min_heap.replace(key, new_frequency);
            super.delete(popped_key);
        }
    }
}

function DEBUG_LOG(output){
    if(DEBUG){
        console.debug(output);
    }
}

exports.CacheMap = CacheMap;
