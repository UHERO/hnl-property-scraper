const PropertyScraper = require('./property-scraper.js');

const scraper = new PropertyScraper(
  process.env.MONGO_URL,
  process.env.MONGO_USER,
  process.env.MONGO_PASS,
  'HonoluluProperty',
  'hnl_county_data',
  'badTMKs',
);

scraper.getMultiUnitTMKs().then(scraper.listMUTMKs).then((tmks) => {
  scraper.scrapeCondosAsync(tmks, 30).then(console.log).catch(console.log);
});
