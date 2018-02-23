const PropertyScraper = require('./property-scraper.js');

const scraper = new PropertyScraper(
  process.env.MONGO_URL,
  process.env.MONGO_USER,
  process.env.MONGO_PASS,
  'HonoluluProperty',
  'hnl_county_data',
  'badTMKs',
);

// (new Promise((resolve) => {
//   scraper.getMultiUnitTMKs((condos) => {
//     listMUTMKs(condos, resolve);
//   });
// })).then((tmks) => {
//   scraper.scrapeCondosAsync(tmks, console.log);
// });

scraper.getMultiUnitTMKs().then(scraper.listMUTMKs).then((tmks) => {
  scraper.scrapeCondosAsync(tmks, 30).then(console.log).catch(console.log);
});


// scraper.getMultiUnitTMKs((condos) => {
//   listMUTMKs(condos, (MUTMKs) => {
//     const units = [];
//     while (MUTMKs.length > 0) {
//       scraper.scrapeOneCondo(MUTMKs.pop(), units.push);
//     }
//   });
// });
//
// scraper.scrapeOneCondo(230170130000, console.log);
// // scraper.getMultiUnitTMKs(console.log);
