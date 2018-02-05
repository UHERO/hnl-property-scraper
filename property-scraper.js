'use strict';
var request = require("request"),
    cheerio = require("cheerio"),
    parser = require('parse-address'),
    assert = require('assert');

function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index == 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function numberCleaner(streetNumber) {
    streetNumber = String(streetNumber);
    if (streetNumber.length < 5 || streetNumber.indexOf('-') !== -1) {
        return streetNumber.replace('-0','-');
    }
    if (streetNumber.charAt(2) == 0) {
        return streetNumber.slice(0, 2) + '-' + streetNumber.slice(3);
    }
    return streetNumber.slice(0,2) + '-' + streetNumber.slice(2);
}

function success(response) {
    if (typeof response.statusCode !== 'number') {
        return false;
    }
    return Math.floor(response.statusCode/100) === 2;
}

function stringContainsAny(string, arrayOfStrings) {
    if (!Array.isArray(arrayOfStrings)) {
        return false;
    }
    for (let testString of arrayOfStrings) {
        if (string.indexOf(testString) !== -1) {
            return true;
        }
    }
    return false;
}

function reformatDateString(dateString) {
    try {
        return (new Date(dateString)).toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
}

function integerFromString(input) {
    return Number.parseInt(String(input).replace(/[^\d\.]*/g,''));
}

function integerCentsFromString(input) {
    return Number.parseInt(input.split('.').pop().slice(0,2));
}

function cellValue($, tableHeader, columnHeader, row) {
    var headerRow = $(`td.table_header:contains("${tableHeader}")`).parent().next(),
        headerRowValues = headerRow.children().map((i, el)=> $(el).text()).get(),
        index = headerRowValues.findIndex((text) => 
            text.split(' ').join('').indexOf(columnHeader.split(' ').join('')) !== -1
        );
    if (index === -1) {
        return 'not found';
    }
    return headerRow.next().children().map((i, el) => $(el).text()).get(index);
}

class PropertyScraper {
    static columns() {
        return [
                'parcelNumber',
                'ownerNames',
                'address',
                'landArea',
                'buildingValue',
                'propertyValue',
                'occupancy',
                'yearBuilt',
                'buildingArea',
                'beds',
                'baths',
                'halfBaths',
                'pv1Date',
                'pv1Value',
                'pv1Cents',
                'pv2Date',
                'pv2Dollars',
                'pv2Cents',
                'whDate',
                'whDollars',
                'censusTract',
                'censusBlock'
            ]
    }
    
    static getTMK(addressString, callback) {
        if (typeof addressString !== 'string' || addressString.length == 0) {
            callback([]);
            return;
        }

        var parsedAddress = parser.parseLocation(addressString),
            options = { method: 'POST',
                url: 'http://qpublic9.qpublic.net/hi_honolulu_nalsearch.php',
                form: {
                    BEGIN: '0',
                    county: 'hi_honolulu',
                    searchType: 'address_search',
                    streetName: parsedAddress.street,
                    streetNumber: numberCleaner(parsedAddress.number)
                }
            };
        
        request(options, function(error, response, body) {
            if (error || !success(response)) {
                callback([]);
                return;
            }
            var $ = cheerio.load(body),
                resultIndex = 0,
                results = [];
            $('.search_value').each(function(i) {
                switch (i % 4) {
                    case 0:
                        results[resultIndex] = { parcelNumber: $(this).text().trim() };
                        break;
                    case 1:
                        results[resultIndex].ownerNames = $(this).html().replace(/(&nbsp;|&#xA0;)/g, '')
                            .split('<br>').map(string => string.trim());
                        break;
                    case 2:
                        results[resultIndex].address = $(this).text().trim();
                        break;
                    case 3:
                        resultIndex++;
                        break;
                }
            });
            callback(results);
        });
    };

    static insertObject(db, collectionName, object, callback) {
        var collection = db.collection(collectionName);

        collection.insertOne(object, function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.result.n);
            assert.equal(1, result.ops.length);
            console.log(`Inserted one documents into the collection`);
            callback(result);
        });
    };

    static insertDocuments(db, collectionName, batch, callback) {
        var collection = db.collection(collectionName);

        collection.insertMany(batch, function(err, result) {
            assert.equal(err, null);
            assert.equal(batch.length, result.result.n);
            assert.equal(batch.length, result.ops.length);
            console.log(`Inserted ${batch.length} documents into the collection`);
            callback(result);
        });
    };

    static insertBatchInDB(batch, url, collectionName) {
        var MongoClient = require("mongodb").MongoClient;

        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);

            PropertyScraper.insertDocuments(db, collectionName, batch, function () {
                db.close();
            });
        });
    };

    static insertOneInDB(object, url, collectionName) {
        const MongoClient = require("mongodb").MongoClient;

        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            console.log('Connected successfully to the server');
            PropertyScraper.insertObject(db, collectionName, object, function () {
                db.close();
            });
        });
    };

    static parseByTMK(tmks){
        const base = "mongodb://127.0.0.1:27017/test1",
            collectionName = "hnl_county_data";
        for (let i = 0; i < tmks.length; i++) {
            PropertyScraper.getAllData(tmks[i], function(object) {
                PropertyScraper.insertOneInDB(object, base, collectionName)
            });
            // PropertyScraper.insertOneInDB(object, base, collectionName);
        }
    }

    static getAllData(tmk, callback) {
        let url = `http://qpublic9.qpublic.net/hi_honolulu_display.php?county=hi_honolulu&KEY=${tmk}&show_history=1&`;
        request(url, function(error, response, body) {
            if (error || !success(response)) {
                callback({});
                return;
            }
            callback(PropertyScraper.getTablesFromPage(tmk, body));
        });
    };

    static getTablesFromPage(tmk, body) {
        cheerio = require('cheerio');
        const $ = cheerio.load(body);
        const allData = {tmk: tmk};
        $('table[class=table_class]').each(function() {
            let tableName = $(this).find('td[class=table_header]').find(`font`).remove();

            tableName = camelize($(this).find('td[class=table_header]').text());
            if (tableName === "OwnerAndParcelInformation") {
                allData[tableName] = PropertyScraper.parseOwner($, $(this));
            } else if (tableName !== "") {
                allData[tableName] = PropertyScraper.parseTableHorizontally($, $(this));
            }
        });
        return (allData);
    };

    static parseOwner($, tag) {
        const objects = {};
        $(tag).find(`td`).each(function (i) {
            if ($(this).hasClass(`owner_header`)) {
                const name = camelize((!/^\s+$/.test($(this).text())) ? $(this).text() : `missing_${i}`);

                objects[name] = $(this).next().text().trim();
            }

        });
        return objects;
    };

    static parseTableHorizontally($, tag) {
        const names = [];
        $(tag).find(`td.sales_header`).first().parent().children().each(function (i) {
            const name = camelize((!/^\s+$/.test($(this).text())) ? $(this).text() : `missing_${i}`);
            names.push(name);
        });
        return PropertyScraper.extractRows($, tag, names);
    };

    static extractRows($, tag, names) {
        const records = [];
        $(tag).find(`tr`).each(function () {
            if ($(this).children().first().hasClass(`sales_value`)) {
                const object = {};
                for (let i = 0; i < names.length; i++) {
                    object[names[i]] = $(this).find(`td.sales_value`).eq(i).text().replace(/\s+/g, " ");
                }
                records.push(object);
            }
        });
        return records;
    };

    static getPropertyValues(tmk, callback) {
        var url = `http://qpublic9.qpublic.net/hi_honolulu_display.php?county=hi_honolulu&KEY=${tmk}`;
        request(url, function(error, response, body) {
            if (error || !success(response)) {
                callback({});
                return;
            }

            var $ = cheerio.load(body);
            
            callback({
                landArea: integerFromString($('td.owner_header:contains("Land Area (approximate sq ft)") + td').text()),
                buildingValue: integerFromString(cellValue($, 'Assessment Information', 'Assessed Building Value')),
                propertyValue: integerFromString(cellValue($, 'Assessment Information', 'Total Property Assessed Value')),
                occupancy: cellValue($, 'Residential Improvement Information', 'Occupancy').trim(),
                yearBuilt: integerFromString(cellValue($, 'Residential Improvement Information', 'Year Built')),
                buildingArea: integerFromString(cellValue($, 'Residential Improvement Information', 'Square Feet')),
                beds: integerFromString(cellValue($, 'Residential Improvement Information', 'Bedrooms')),
                baths: integerFromString(cellValue($, 'Residential Improvement Information', 'Full Baths')),
                halfBaths: integerFromString(cellValue($, 'Residential Improvement Information', 'Half Baths'))
            });
        });
    }

    static getPermitLinks(tmk, callback) {
        var url = 'http://dppweb.honolulu.gov/DPPWeb/default.aspx?' +
            `PossePresentation=BuildingPermitSearch&PosseShowCriteriaPane=No&TMK=${String(tmk).slice(0,8)}`;
        request(url, function(error, response, body) {
            if (error || !success(response)) {
                callback([]);
                return;
            }

            var $ = cheerio.load(body),
                links = [],
                pvKeywords = ['solar', 'photovoltaic', 'pv'];

            $('table.possegrid tbody tr').each(function(i) {
                if (stringContainsAny($(this).text().toLowerCase(), pvKeywords) 
                    && $(this).text().indexOf('Permit application closed') !== -1) {
                    $(this).children('td').each(function(j) {
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

    static getPermitValues(link, callback) {
        var url = `http://dppweb.honolulu.gov/DPPWeb/${link}`;
        request(url, function(error, response, body) {
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

    static getCensusDetails(link, callback) {
        var url = `http://dppweb.honolulu.gov/DPPWeb/${link}`;
        request(url, function(error, response, body) {
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

    static getAllDataFromAddress(address, callback) {
        PropertyScraper.getTMK(address, function(tmks) {
            var tmkCount = tmks.length,
                permitCount = 0,
                processedPermits = 0,
                processedTMKs = 0;

            tmks.forEach(function(tmk) {
                var permits = [],
                    permitsSummary = {},
                    processedCensusData = false;
                
                tmk.ownerNames = tmk.ownerNames.join('; ');
                
                PropertyScraper.getPropertyValues(tmk.parcelNumber, function(parcelResult) {
                    Object.assign(tmk, parcelResult);
                    processedTMKs++;
                    if (processedTMKs == tmkCount && processedPermits == permitCount && processedCensusData) {
                        callback(tmks);
                    }
                });
                
                PropertyScraper.getPermitLinks(tmk.parcelNumber, function(permitLinks) {
                    var collectedCensusData = false;
                    
                    permitCount += permitLinks.length;
                    
                    permitLinks.forEach(function(permitLink) {
                        PropertyScraper.getPermitValues(permitLink, function(permitValues) {
                            if (!collectedCensusData) {
                                collectedCensusData = true;
                                PropertyScraper.getCensusDetails(permitValues.taxMapKeyLink, function(censusData) {
                                    Object.assign(tmk, censusData);
                                    processedCensusData = true;
                                    if (processedTMKs === tmkCount && processedPermits === permitCount) {
                                        callback(tmks);
                                    }
                                });
                            }
                            permits.push(permitValues);
                            if (permits.length !== permitCount) {
                                processedPermits++;
                                return;
                            }
                            
                            // sort the permits by date
                            permits.sort((a, b) => a.jobCompleted - b.jobCompleted);
                            let waterHeaterPermits = permits.filter((permit) => permit.waterHeater);
                            // take the first two pv permits
                            let pvPermits = permits.filter((permit) => !permit.waterHeater);
                            if (pvPermits.length > 0) {
                                permitsSummary.pv1Date = pvPermits[0].jobCompleted;
                                permitsSummary.pv1Value = pvPermits[0].acceptedDollars;
                                permitsSummary.pv1Cents = pvPermits[0].acceptedCents;
                            }
                            if (pvPermits.length > 1) {
                                permitsSummary.pv2Date = pvPermits[1].jobCompleted;
                                permitsSummary.pv2Dollars = pvPermits[1].acceptedDollars;
                                permitsSummary.pv2Cents = pvPermits[1].acceptedCents;
                            }
                            // and the first water heater permit
                            if (waterHeaterPermits.length > 0) {
                                permitsSummary.whDate = waterHeaterPermits[0].jobCompleted;
                                permitsSummary.whDollars = waterHeaterPermits[0].acceptedDollars;
                                permitsSummary.whCents = waterHeaterPermits[0].whCents;
                            }
                            Object.assign(tmk, permitsSummary);
                            if (processedTMKs == tmkCount && processedCensusData) {
                                callback(tmks);
                            }
                            
                            processedPermits++;
                        });
                    });
                });
            });
        });
    }
}

const base = "mongodb://127.0.0.1:27017/test1",
    collectionName = "hnl_county_data";

PropertyScraper.parseByTMK([430040310000]);

module.exports = PropertyScraper;