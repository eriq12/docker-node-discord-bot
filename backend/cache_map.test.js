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
    for(let i = 1; i <= capacity; i = i + 1){
        cache.set(i, i*2);
    }
    // check to make sure all are in the cache
    for(let i = 1; i <= capacity; i = i + 1){
        expect(cache.get(i)).toBe(i*2);
    }
    cache.set(capacity+1, (capacity+1) * 2);
    expect(cache.get(capacity+1)).toBe((capacity+1) * 2);
    // the last accessed one in the second for loop should have been on top and now gone
    expect(cache.get(capacity)).toBe(null);

});