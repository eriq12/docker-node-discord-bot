const {CacheMap} = require("./src/storage_data_structures/cache_map");

test("Basic over set test cache", () => {
    let cache = new CacheMap(1);
    cache.set("first", "will be dropped");
    expect(cache.get("first")).toBe("will be dropped");
    cache.set("second", "what\'s new to the cache");
    expect(cache.get("first")).toBe(null);
    expect(cache.get("second")).toBe("what\'s new to the cache");
});

test("Basic small data size test cache", () => {
    // setup
    let capacity = 10;
    let cache = new CacheMap(capacity);
    for(let i = 1; i <= capacity; i++){
        cache.set(i, i*2);
    }
    // check to make sure all are in the cache
    for(let i = capacity; i > 0; i--){
        expect(cache.get(i)).toBe(i*2);
    }
    cache.set(capacity+1, (capacity+1) * 2);
    expect(cache.get(capacity+1)).toBe((capacity+1) * 2);
    // the last accessed one in the second for loop should have been on top and now gone
    expect(cache.get(1)).toBe(null);
});

test("Basic test for which one will be removed", () => {
    // setup
    let capacity = 5;
    let cache = new CacheMap(capacity);
    // set values
    for(let i = 1; i <= capacity; i++){
        cache.set(i, i * 2);
    }
    // now, get 5 one times, 2 four times, 3 five times, 1 two times, then finally 4 three times
    // the hidden weight for each of the values should be: 1 - 3, 2 - 5, 3 - 6, 4 - 4, 5 - 2, with 5 on top
    let order = [5,2,3,1,4]
    let frequencies = [1,4,5,2,3]
    for(let i = 0; i < capacity; i++){
        for(let freq = 0; freq < frequencies[i]; freq++){
            expect(cache.get(order[i])).toBe(order[i]*2);
        }
    }
    // now with 5 on top, set a new one, which should replace 5
    cache.set(6, "new phone")
    // checking that the new is here and 5 is gone
    expect(cache.get(5)).toBe(null)
    expect(cache.get(6)).toBe("new phone")
});