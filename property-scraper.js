'use strict';
const request = require('request'),
    cheerio = require('cheerio'),
    assert = require('assert'),
    csv = require('csv-parser'),
    fs = require('fs'),
    MongoClient = require('mongodb').MongoClient;

function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index == 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function success(response) {
    if (typeof response.statusCode !== 'number') {
        return false;
    }
    return Math.floor(response.statusCode/100) === 2;
}


class PropertyScraper {

    constructor(mongoURL, mongoUser, mongoPass, dbName, collectionName, badTMKs){
        this.mongoURL = mongoURL;
        this.mongoUser = mongoUser;
        this.mongoPass = mongoPass;
        this.dbName = dbName;
        this.collectionName = collectionName;
        this.badTMKs = badTMKs;
    }

    insertObject(db, object, callback) {
        let collection = db.collection(this.collectionName),
            badTmks = db.collection(this.badTMKs);

        collection.insertOne(object, function (err, result) {
            if (err !== null) {
                badTmks.insertOne({tmk: object.tmk, err: err}, function (error) {
                    console.log(error);
                });
                return;
            }
            assert.equal(1, result.result.n);
            assert.equal(1, result.ops.length);
            console.log('Inserted one documents into the collection');
            callback(result);
        });
    };

    insertOneInDB(object) {

        MongoClient.connect(`mongodb://${this.mongoUser}:${this.mongoPass}@${this.mongoURL}`, function (err, client) {
            assert.equal(null, err);
            let db = client.db(this.dbName);
            console.log('Connected successfully to the server');
            this.insertObject(db, object, function () {
                client.close();
            });
        });
    };

    scrapeByTMKsAsync(tmks, callback) {
        if (tmks.length === 0) {
            return callback();
        }
        this.getAllData(tmks.pop(), function (collectedData) {
            this.insertOneInDB(collectedData);
            this.scrapeByTMKsAsync(tmks, callback);
        });
    }

    parallelScraping(numFlows, fileName) {
        this.parseCsvForKeys(fileName, function (tmks) {
            for (let i = 0; i < numFlows; i++) {
                PropertyScraper.scrapeByTMKsAsync(tmks, () => console.log('done'));
            }
        });
    }

    parseCsvForKeys(filename, callback) {
        let tmks = [];

        fs.createReadStream(filename)
            .pipe(csv())
            .on('data', function ({TMK}) {
                tmks.push(`${TMK}0000`);
            }).on('end', function () {
            console.log('TMKs are retrieved');
            callback(tmks);
        });
        return tmks;
    };

    getAllData(tmk, callback) {
        let url = `http://qpublic9.qpublic.net/hi_honolulu_display.php?county=hi_honolulu&KEY=${tmk}&show_history=1&`;
        request(url, function (error, response, body) {
            if (error || !success(response)) {
                callback({});
                return;
            }
            console.log('request is successful');
            callback(this.getTablesFromPage(tmk, body));
        });
    };

    getTablesFromPage(tmk, body) {
        const $ = cheerio.load(body);
        const allData = {tmk: tmk};
        $('table[class=table_class]').each(function () {
            let tableName = $(this).find('td[class=table_header]').find('font').remove();

            tableName = camelize($(this).find('td[class=table_header]').text());
            if (tableName === 'OwnerAndParcelInformation') {
                allData[tableName] = this.parseOwner($, $(this));
            } else if (tableName !== '') {
                allData[tableName] = this.parseTableHorizontally($, $(this));
            }
        });
        return (allData);
    };

    parseOwner($, tag) {
        const objects = {};
        $(tag).find('td').each(function (i) {
            if ($(this).hasClass('owner_header') && $(this).attr('colspan') !== '2') {
                const name = camelize((!/^\s+$/.test($(this).text())) ? $(this).text() : `missing_${i}`);

                objects[name] = $(this).next().text().trim();
            }

        });
        return objects;
    };

    parseTableHorizontally($, tag) {
        const names = [];
        $(tag).find(`td.sales_header`).first().parent().children().each(function (i) {
            const name = camelize((!/^\s+$/.test($(this).text())) ? $(this).text() : `missing_${i}`);
            names.push(name);
        });
        return this.extractRows($, tag, names);
    };

    extractRows($, tag, names) {
        const records = [];
        $(tag).find('tr').each(function () {
            if ($(this).children().first().hasClass('sales_value')) {
                const object = {};
                for (let i = 0; i < names.length; i++) {
                    object[names[i]] = $(this).find(`td.sales_value`).eq(i).text().replace(/\s+/g, ' ');
                }
                records.push(object);
            }
        });
        return records;
    };

    getPermitLinks(tmk, callback) {
        var url = 'http://dppweb.honolulu.gov/DPPWeb/default.aspx?' +
            `PossePresentation=BuildingPermitSearch&PosseShowCriteriaPane=No&TMK=${String(tmk).slice(0, 8)}`;
        request(url, function (error, response, body) {
            if (error || !success(response)) {
                callback([]);
                return;
            }

            var $ = cheerio.load(body),
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
        var url = `http://dppweb.honolulu.gov/DPPWeb/${link}`;
        request(url, function (error, response, body) {
            if (error || !success(response)) {
                callback({});
                return;
            }

            var $ = cheerio.load(body),
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
                taxMapKeyLink: $('span[id^=Link_1] a').attr('href')
            });
        });
    }

    getCensusDetails(link, callback) {
        var url = `http://dppweb.honolulu.gov/DPPWeb/${link}`;
        request(url, function (error, response, body) {
            if (error || !success(response)) {
                callback({});
                return;
            }

            var $ = cheerio.load(body);

            callback({
                censusTract: Number.parseInt($('span[id^="CensusTract"]').text()),
                censusBlock: Number.parseInt($('span[id^="CensusBlock"]').text())
            });
        });
    }

}


module.exports = PropertyScraper;