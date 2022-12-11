const {MinHeap} = require("./src/storage_data_structures/min_heap");

// simple actions test

test("Assert that the helpers to get the indexes are correct", () => {
    expect(MinHeap.GetLeftChildIndex(0)).toBe(1);
    expect(MinHeap.GetRightChildIndex(0)).toBe(2);
    expect(MinHeap.GetLeftChildIndex(1)).toBe(3);
    expect(MinHeap.GetRightChildIndex(1)).toBe(4);
    expect(MinHeap.GetParentIndex(1)).toBe(0);
    expect(MinHeap.GetParentIndex(2)).toBe(0);
    expect(MinHeap.GetParentIndex(3)).toBe(1);
    expect(MinHeap.GetParentIndex(4)).toBe(1);
});

test("Simple add and pop test: Push to a min heap of sufficient capacity, then pop. The same key should be returned", () => {
    let test_key = "This is it";
    let test_heap = new MinHeap(10);
    expect(test_heap.add(test_key, 1)).toBe(true);
    expect(test_heap.pop()).toBe(test_key);
    expect(test_heap.pop()).toBe(null);
});

test("Capacity test: Push to a min heap of capacity 3, fourth unique item add (all priority 1) should fail", () => {
    let cap_3_heap = new MinHeap(3);
    expect(cap_3_heap.add(1, 1)).toBe(true);
    expect(cap_3_heap.add(2, 1)).toBe(true);
    expect(cap_3_heap.add(3, 1)).toBe(true);
    expect(cap_3_heap.add(4, 1)).toBe(false);
});

test("Replace Test: Push one to min heap, then replace. the old should not exist and the new should", () => {
    let test_heap = new MinHeap(1);
    let old_key = "old";
    let old_priority = 1;
    let new_key = "new";
    let new_priority = 1;
    test_heap.add(old_key, old_priority);
    expect(test_heap.hasKey(old_key)).toBe(true);
    expect(test_heap.add(new_key, new_priority)).toBe(false);
    expect(test_heap.hasKey(old_key)).toBe(true);
    expect(test_heap.hasKey(new_key)).toBe(false);
    expect(test_heap.replace(new_key, new_priority)).toBe(old_key);
    expect(test_heap.hasKey(old_key)).toBe(false);
    expect(test_heap.hasKey(new_key)).toBe(true);
    expect(test_heap.pop()).toBe(new_key);
    expect(test_heap.hasKey(new_key)).toBe(false);
    expect(test_heap.hasKey(old_key)).toBe(false);
});

// order tests

test("Shifting add test: Push to a min heap of sufficient capacity, then push another of lower priority to heap, that new key should be returned upon pop",() => {
    // setup
    let test_key_dummy = "This shouldn't be returned first";
    let test_key_first = "This should be popped first";
    let shift_heap = new MinHeap(10);
    // test 1
    expect(shift_heap.add(test_key_dummy, 2)).toBe(true);
    expect(shift_heap.add(test_key_first, 1)).toBe(true);
    expect(shift_heap.pop()).toBe(test_key_first);
    expect(shift_heap.pop()).toBe(test_key_dummy);
    // test control
    expect(shift_heap.add(test_key_first, 1)).toBe(true);
    expect(shift_heap.add(test_key_dummy, 2)).toBe(true);
    expect(shift_heap.pop()).toBe(test_key_first);
    expect(shift_heap.pop()).toBe(test_key_dummy);
})

test("Heap order kept test: Push to a min heap in incrementing order, it should maintain order when popped", () => {
    // setup
    let size = 10;
    let keys = Array.from(Array(size).keys());
    let heap = new MinHeap(size);
    // test
    keys.forEach(key => {expect(heap.add(key, key)).toBe(true);});
    //console.log(heap.toString());
    keys.forEach(key => {
        expect(heap.pop()).toBe(key);
        //console.log(heap.toString());
    });
    expect(heap.pop()).toBe(null);
});

test("Long shifting add test: push to a min heap of sufficient capacity for at least 10 units, then push a lower priority, that new key should returned upon pop", () => {
    // setup
    // ordered in same way as will be added to heap, will use keys as priorities as well
    let test_keys = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 1];
    let heap = setupHelper(test_keys, test_keys);
    // pop
    for(let i = 1; i < 12; i = i + 1){
        expect(heap.pop()).toBe(i);
    }
});

// update tests

test("Test update, have a regular list, though the second element has a much larger element", () => {
    let size = 10;
    let test_keys = Array.from(Array(size).keys());
    let test_priorities = Array.from(Array(size).keys());
    let odd_one_out = 1;
    test_priorities[odd_one_out] = size;
    let heap = setupHelper(test_keys, test_priorities);
    // these pop until odd index should be normal
    for(let i = 0; i < odd_one_out; i = i + 1){
        expect(heap.pop()).toBe(i);
    }
    // debug for sanity if it goes wrong
    // console.log(heap.toString());
    heap.update(odd_one_out, (odd_one_out - size));
    expect(heap.pop()).toBe(odd_one_out);
});

function setupHelper(keyArr, priorityArr){
    if(keyArr.length != priorityArr.length){
        throw "Array lengths do not match!";
    }
    let heap = new MinHeap(keyArr.length);
    for(let i = 0; i < keyArr.length; i = i + 1){
        heap.add(keyArr[i], priorityArr[i]);
    }
    return heap;
}