const PropertyScraper = require('./property-scraper.js');

const scraper = new PropertyScraper(
    process.env.MONGO_URL,
    process.env.MONGO_USER,
    process.env.MONGO_PASS,
    'HonoluluProperty',
    'hnlPropertyData',
    'badTMKs'
);

// scraper.parallelScraping(30, './files/TMKS.csv');

scraper.getMultiUnitTMKs(function (object) {
    for (let i = 0; i < 50; i++) {
        scraper.scrapeByTMKsAsync(object, function () {
            return;
        })
    }
});
