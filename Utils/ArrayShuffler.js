class ArrayShuffler {
    shuffle(allIds) {
        let shuffledIds = [];
        let ids = [...allIds];
        while (ids.length > 0) {
            let randomIndex = Math.floor(Math.random() * ids.length);
            shuffledIds.push(ids[randomIndex]);
            ids.splice(randomIndex, 1);
        }
        return shuffledIds;
    }
}

module.exports = ArrayShuffler;
