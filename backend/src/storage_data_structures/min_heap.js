const DEBUG = false;
/**
 * Design
 * Purpose:
 *      - To find in reasonable time, what data is being used the 
 *        least to remove from cache when capacity is full
 * Components:
 *      - array heap
 *          - nodes are keys with weights
 *      - map
 *          - key are the keys, values are the place in the heap (array index)
 * Special behavior:
 *      - Not designed to remove from
 * Performance:
 *      - Memory size: O(n)
 *      - Data add: O(log(n))
 *      - Data "remove"/replace: O(log(n))
 *      - Data priority update: O(log(n))
 */

class MinHeap {
    #heap;
    #max_capacity;
    #datamap;
    constructor(maxCapacity){
        // data heap
        this.#heap = new Array();
        this.#max_capacity = maxCapacity;
        // map
        this.#datamap = new Map();
    }

    /**
     * Has key in heap
     * @param {*} key the key to check for in heap
     * @return {*} true if the key exists in heap, false otherwise
     */
    hasKey(key){
        return this.#datamap.has(key);
    }

    /**
     * Adds a data point onto the heap
     * @param {*} key the value which to identify entry by
     * @param {*} value the value which determines initial postion on heap
     * @return {*} if the key and value successfully were added to heap
     */
    add(key, value){
        DEBUG_LOG(`Attempting to add key \"${key}\" of priority ${value}.`);
        if(this.isFull() || this.hasKey(key)){
            DEBUG_LOG("Adding failed.");
            return false;
        }
        DEBUG_LOG(`Adding \"${key}\" to heap.`);
        // add to heap
        this.#heap.push(new HeapNode(key, value));
        // add to datamap
        this.#datamap.set(key, this.#heap.length-1);
        // stabilize position
        this.#floatHeap(this.#heap.length-1);
        DEBUG_LOG("Add complete")
        return true;
    }

    /**
     * Removes the top of the heap
     * @return {HeapNode} a data structure that contains the key and priority associated with the key
     */
    pop(){
        DEBUG_LOG("Attempting to pop from heap.");
        // check if empty
        if(this.isEmpty()){
            DEBUG_LOG("Pop failed.");
            return null;
        }
        // take root out and replace with end
        let result = this.#heap[0].getKey();
        this.#swap(0, this.#heap.length-1);
        this.#heap.pop();
        // remove from datamap
        this.#datamap.delete(result);
        DEBUG_LOG(`Popped \"${result}\" from heap.`);

        // if there are other nodes sink
        if(this.#heap.length > 1){
            // move the node to a stable position
            this.#sinkHeap(0);
        }
        return result;
    }

    /**
     * Replaces the top node of the heap
     * @param {*} key the new key
     * @param {*} value the new value
     * @return {*} the key of the root node
     */
    replace(key, value){
        if(key == null){
            return null;
        }
        // take root
        let result = this.#heap[0];
        // remove key from datamap
        this.#datamap.delete(result.getKey());
        // replace root with new key and value
        this.#heap[0] = new HeapNode(key, 0);
        this.#datamap.set(key, value);
        // stabilize position of node
        this.#sinkHeap(0);
        return result.getKey();
    }

    /**
     * updates the priority value of the 
     * @param {*} key 
     * @param {*} valueChange 
     */
    update(key, valueChange){
        // if no change or key does not already exist in the heap, return (sanity check)
        if(valueChange == 0 || !this.hasKey(key)){
            return;
        }
        let index = this.#datamap.get(key);
        // updates value of node
        this.#heap[index].modifyValue(valueChange);
        // float or sink depending on change
        if(valueChange < 0){
            this.#floatHeap(index);
        }
        else{
            this.#sinkHeap(index);
        }
    }

    /**
     * Ripples the stabilize function down the heap
     * @param {*} index start point
     */
    #sinkHeap(index){
        DEBUG_LOG("Sinking node to proper position...");
        let current_index = index;
        while(current_index >= 0){
            current_index = this.#stabilize(current_index);
        }
        DEBUG_LOG("Sinking node complete.");
    }

    /**
     * Ripples the stabilize function up the heap
     * @param {*} index start point
     */
    #floatHeap(index){
        DEBUG_LOG("Floating node to proper position...");
        let current_index = MinHeap.GetParentIndex(index);
        while(current_index >= 0){
            if(this.#stabilize(current_index) < 0){
                break;
            }
            current_index = MinHeap.GetParentIndex(current_index);
        }
        DEBUG_LOG("Floating node complete.");
    }

    /**
     * Helper method to maintain the property of min heaps, where the parent is always less than or equal to the children
     * @param {*} index the parent index of where to stabilize with the children (so the property of a min heap is maintained)
     * @return {*} the index of what child that was swapped with the parent
     */
    #stabilize(index){
        DEBUG_LOG(`Stabilizing at parent index ${index} (${this.#heap[index].getValue()})`);
        // get lowest of children
        let lowestChildIndex = this.#getLowestChildIndex(index);
        DEBUG_LOG(`Found lowest child index ${lowestChildIndex}`);
        // if no child or if state is stable, return -1
        if(lowestChildIndex == -1 || this.#heap[index].getValue() <= this.#heap[lowestChildIndex].getValue()){
            return -1;
        }
        // the top (at index) is greater than children, then swap and return child index that has changed
        this.#swap(index, lowestChildIndex);
        return lowestChildIndex;
    }

    /**
     * Returns the index of the child with the lowest priority from the given parent index
     * @param {*} index index of parent
     * @return {*} index of lowest child
     */
    #getLowestChildIndex(index){
        // hold the one to compare and swap
        let child_index = MinHeap.GetLeftChildIndex(index);
        // check if the child exists, else return -1
        if(child_index >= this.#heap.length){
            return -1;
        }
        // check if right child exists, if not just return left child index
        if(child_index+1 >= this.#heap.length){
            return child_index;
        }
        // if left is greater than right, change return to right child index
        if(this.#heap[child_index].getValue() > this.#heap[child_index+1].getValue()){
            child_index = child_index + 1;
        }
        return child_index;
    }

    /**
     * Swaps two nodes of the heap
     * @param {*} index_one index of the first node selected
     * @param {*} index_two index of the second node selected
     */
    #swap(index_one, index_two){
        if(index_one == index_two){
            return;
        }
        // swap the positions in heap
        let temp = this.#heap[index_one];
        let key_one = temp.getKey();
        this.#heap[index_one] = this.#heap[index_two];
        let key_two = this.#heap[index_two].getKey();
        this.#heap[index_two] = temp;

        // swap the indexes in map
        this.#datamap.set(key_one, index_two);
        this.#datamap.set(key_two, index_one);
        DEBUG_LOG(`Swapped data between places ${index_one} (${key_one}) and ${index_two} (${key_two})`);
    }

    /**
     * Checks if heap is full
     * @return {*} true if heap is to capacity, false otherwise
     */
    isFull(){
        return (this.#heap.length >= this.#max_capacity);
    }

    /**
     * Checks if heap is empty
     * @return {*} true if heap is empty, false otherwise
     */
    isEmpty(){
        return this.#heap.length <= 0;
    }

    // index helper methods

    /**
     * Gets the index of the parent given an array heap, does not take into account maximums of the array
     * @param {*} childIndex index of child to find parent  --assumed range:[0,inf)
     * @returns the index of the parent, -1 if childIndex is 0
     */
    static GetParentIndex(childIndex){
        if(childIndex <= 0){
            return -1;
        }
        return Math.floor((childIndex - 1) / 2); // 1 / 2 = .5 which with floor just gets ignored
    }

    /**
     * Gets the index of the left child given an array heap, does not take into account the maximums of the array
     * @param {*} parentIndex index of the parent index to find left child -- assumed range:[0,inf)
     * @returns the index of the left child
     */
    static GetLeftChildIndex(parentIndex){
        return (parentIndex * 2) + 1;
    }

    /**
     * Gets the index of the right child given an array heap, does not take into account the maximums of the array
     * @param {*} parentIndex index of the parent index to find right child -- assumed range:[0,inf)
     * @returns the index of the right child
     */
    static GetRightChildIndex(parentIndex){
        return (parentIndex * 2) + 2;
    }

    toString(){
        return this.#heap.toString();
    }
}


// data points

class HeapNode {
    // private fields
    #key;
    #value;

    constructor(key, value){
        this.#key = key;
        this.#value = value;
    }
    /**
     * Key Accessor (getter) Method
     * @returns the heap node's key field
     */
    getKey(){
        return this.#key;
    }

    /**
     * Value Accessor (getter) Method
     * @returns the heap node's value field
     */
    getValue(){
        return this.#value;
    }

    /**
     * Mutator Method for both key and value fields
     * @param {*} newKey 
     * @param {*} newValue 
     */
    replace(newKey, newValue){
        this.#key = newKey;
        this.#value = newValue;
    }

    /**
     * Key Mutator (setter) Method
     * @param {*} newKey new key value
     */
    setKey(newKey){
        this.#key = newKey;
    }

    /**
     * Value Mutator (setter) Method
     * @param {*} newValue 
     */
    setValue(newValue){
        this.#value = newValue;
    }

    /**
     * Value Mutator Method by increment rather than full set
     * @param {*} difference the diffference to change the value field by (will be added to value)
     */
    modifyValue(difference){
        this.#value += difference;
    }

    toString(){
        return `\"${this.#key}\" (${this.#value})`;
    }
}

function DEBUG_LOG(output){
    if(DEBUG){
        console.log(output);
    }
}

exports.MinHeap = MinHeap;
