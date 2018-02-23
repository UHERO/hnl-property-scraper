
const request = require('request'),
  cheerio = require('cheerio'),
  assert = require('assert'),
  csv = require('csv-parser'),
  fs = require('fs'),
  MongoClient = require('mongodb').MongoClient;

function success(response) {
  if (typeof response.statusCode !== 'number') {
    return false;
  }
  return Math.floor(response.statusCode / 100) === 2;
}


class PropertyScraper {
  constructor(mongoURL, mongoUser, mongoPass, dbName, collectionName, badTMKs) {
    this.mongoURL = mongoURL;
    this.mongoUser = mongoUser;
    this.mongoPass = mongoPass;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.badTMKs = badTMKs;
    this.units = [];
    this.stop = false;
  }

  static camelize(str) {
    return str.trim().replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }

  insertObject(db, object) {
    const collection = db.collection(this.collectionName);
    const badTmks = db.collection(this.badTMKs);

    return new Promise((resolve, reject) => {
      collection.insertOne(object, (err, result) => {
        if (err !== null) {
          badTmks.insertOne({ tmk: object.tmk, err }, (error) => {
            if (error) {
              return reject(error);
            }
            return resolve();
          });
          return;
        }
        assert.equal(1, result.result.n);
        assert.equal(1, result.ops.length);
        console.log('Inserted one document into the collection');
        resolve(result);
      });
    });
  }

  insertOneInDB(object) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(`mongodb://${this.mongoUser}:${this.mongoPass}@${this.mongoURL}`, (err, client) => {
        if (err) {
          return reject(err);
        }
        const db = client.db(this.dbName);
        console.log('Connected successfully to the server');
        this.insertObject(db, object).then(() => {
          client.close();
          resolve();
        });
      });
    });
  }

  scrapeByTMKsAsync(tmks, numThreads) {
    // slice 30 off of tmks
    if (tmks.length === 0) {
      console.log('done scraping units');
    }
    const batch = tmks.slice(0, numThreads);
    return Promise.all(batch.map(tmk => this.getAllData(tmk).then(this.insertOneInDB))).then(() => {
      // call this function with the rest
      this.scrapeByTMKsAsync(tmks.slice(numThreads), numThreads);
    });
  }

  scrapeCondosAsync(tmks, numThreads) {
    const batch = tmks.slice(0, numThreads);
    if (tmks.length === 0) {
      this.stop = true;
      console.log('done retrieving units');
    }
    return Promise
      .all(batch.map(tmk => this
        .scrapeOneCondo(tmk)
        .then((condoUnits) => {
          this.units = this.units.concat(condoUnits);
        })))
      .then(() => {
        return new Promise((resolve) => {
          if (this.stop) {
            resolve('done');
          }
          else {
            console.log(`Units retrieved ${this.units.length}`);
            this.scrapeCondosAsync(tmks.slice(numThreads), numThreads);
          }
        });
      });
  }

  parallelScrapingFromFile(numFlows, fileName) {
    this.parseCsvForKeys(fileName, (tmks) => {
      this.parallelScraping(numFlows, tmks);
    });
  }

  parallelScraping(numFlows, tmks) {
    for (let i = 0; i < numFlows; i += 1) {
      this.scrapeByTMKsAsync(tmks, () => console.log('done'));
    }
  }

  parseCsvForKeys(filename, callback) {
    const tmks = [];

    fs.createReadStream(filename)
      .pipe(csv())
      .on('data', ({ TMK }) => {
        tmks.push(`${TMK}0000`);
      }).on('end', () => {
        console.log('TMKs are retrieved');
        callback(tmks);
      });
    return tmks;
  }

  getAllData(tmk) {
    const url = `http://qpublic9.qpublic.net/hi_honolulu_display.php?county=hi_honolulu&KEY=${tmk}&show_history=1&`;
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (error || !success(response)) {
          return reject(Error(`getAllData failed.: ${error}`));
        }
        return resolve(this.getTablesFromPage(tmk, body));
      });
    });
  }

  getTablesFromPage(tmk, body) {
    const $ = cheerio.load(body);
    const allData = { tmk };
    $('table[class=table_class]').each((_, elem) => {
      $(elem).find('td[class=table_header]').find('font').remove();

      const tableName = PropertyScraper.camelize($(elem).find('td[class=table_header]').text());
      if (tableName === 'OwnerAndParcelInformation') {
        allData[tableName] = this.parseOwner($, $(elem));
      } else if (tableName !== '') {
        allData[tableName] = this.parseTableHorizontally($, $(elem));
      }
    });
    return allData;
  }

  parseOwner($, tag) {
    const objects = {};
    $(tag).find('td').each((i, elem) => {
      if ($(elem).hasClass('owner_header') && $(elem).attr('colspan') !== '2') {
        const name = PropertyScraper.camelize((!/^\s+$/.test($(elem).text())) ? $(elem).text() : `missing_${i}`);

        objects[name] = $(elem).next().text().trim();
      }
    });
    return objects;
  }

  parseTableHorizontally($, tag) {
    const names = [];
    $(tag).find('td.sales_header').first().parent()
      .children()
      .each(function (i) {
        const name = PropertyScraper.camelize((!/^\s+$/.test($(this).text())) ? $(this).text() : `missing_${i}`);
        names.push(name);
      });
    return this.extractRows($, tag, names);
  }

  extractRows($, tag, names) {
    const records = [];
    $(tag).find('tr').each(function () {
      if ($(this).children().first().hasClass('sales_value')) {
        const object = {};
        for (let i = 0; i < names.length; i++) {
          object[names[i]] = $(this).find('td.sales_value').eq(i).text()
            .replace(/\s+/g, ' ');
        }
        records.push(object);
      }
    });
    return records;
  }

  getMultiUnitTMKs() {
    return new Promise((resolve, reject) => {
      MongoClient.connect(`mongodb://${this.mongoUser}:${this.mongoPass}@${this.mongoURL}`, (err, client) => {
        if (err) {
          reject(err);
        }
        const db = client.db(this.dbName);
        console.log('Connected successfully to the server');
        const collection = db.collection(this.collectionName);
        collection.find({ 'Condominium/ApartmentUnitInformation': [] }, { tmk: true }).toArray().then(resolve);
      });
    });
  }

  listMUTMKs(condos) {
    return new Promise((resolve) => {
      const MUTMKs = condos.map(elem => elem.tmk);
      resolve(MUTMKs);
    });
  }

  scrapeOneCondo(tmk) {
    return new Promise((resolve, reject) => {
      const url = `http://qpublic9.qpublic.net/hi_honolulu_display.php?county=hi_honolulu&KEY=${tmk}&show_history=1&`;
      request(url, (error, response, body) => {
        if (error || !success(response)) {
          return reject(error);
        }
        console.log('request is successful');
        return resolve(this.getTMKsFromCondo(body));
      });
    });
  }

  getTMKsFromCondo(body) {
    const $ = cheerio.load(body);

    const units = [];

    $('td[class=table_header]').eq(1).parent().parent()
      .children()
      .each((idx, elem) => {
        if (idx > 1) {
          units.push($(elem).text().trim().slice(0, 12));
        }
      });

    return (units);
  }

  getPermitLinks(tmk, callback) {
    const url = 'http://dppweb.honolulu.gov/DPPWeb/default.aspx?' +
            `PossePresentation=BuildingPermitSearch&PosseShowCriteriaPane=No&TMK=${String(tmk).slice(0, 8)}`;
    request(url, (error, response, body) => {
      if (error || !success(response)) {
        callback([]);
        return;
      }

      let $ = cheerio.load(body),
        links = [],
        pvKeywords = ['solar', 'photovoltaic', 'pv'];

      $('table.possegrid tbody tr').each(function (i) {
        if (stringContainsAny($(this).text().toLowerCase(), pvKeywords)
                    && $(this).text().indexOf('Permit application closed') !== -1) {
          $(this).children('td').each(function (j) {
            if (j === 0) {
              links.push($(this).children('span').children('a').attr('href'));
              return false;
            }
          });
        }
      });

      callback(links);
    });
  }

  getPermitValues(link, callback) {
    const url = `http://dppweb.honolulu.gov/DPPWeb/${link}`;
    request(url, (error, response, body) => {
      if (error || !success(response)) {
        callback({});
        return;
      }

      let $ = cheerio.load(body),
        estimatedValue = $('span[id^="EstimatedValueofWork"]').text(),
        acceptedValue = $('span[id^="AcceptedValue"]').text();

      callback({
        waterHeater: $('span[id^="Description"]').text().search(/water heater/i) !== -1,
        jobCompleted: reformatDateString($('span[id^="CompletedDate"]').text()),
        constructionCompleted: reformatDateString($('span[id^="ConstructionCompletedDate"]').text()),
        estimatedDollars: integerFromString(estimatedValue),
        estimatedCents: integerCentsFromString(estimatedValue),
        acceptedDollars: integerFromString(acceptedValue),
        acceptedCents: integerCentsFromString(acceptedValue),
        taxMapKeyLink: $('span[id^=Link_1] a').attr('href'),
      });
    });
  }

  getCensusDetails(link, callback) {
    const url = `http://dppweb.honolulu.gov/DPPWeb/${link}`;
    request(url, (error, response, body) => {
      if (error || !success(response)) {
        callback({});
        return;
      }

      const $ = cheerio.load(body);

      callback({
        censusTract: Number.parseInt($('span[id^="CensusTract"]').text()),
        censusBlock: Number.parseInt($('span[id^="CensusBlock"]').text()),
      });
    });
  }
}

module.exports = PropertyScraper;
