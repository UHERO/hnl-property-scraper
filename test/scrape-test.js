var assert = require('chai').assert,
    PropertyScraper = require('./../property-scraper'),
    testAddresses = [
        {address: "91129 Waimapuna PL, Ewa Beach HI 96706", tmk: 910500520000}
    ],
    testProperties = [
        {
            parcelNumber: 910500520000,
            landArea: 3120,
            buildingValue: 221300,
            propertyValue: 497700,
            occupancy: 'SINGLE-FAMILY',
            yearBuilt: 1988,
            buildingArea: 1410,
            beds: 3,
            baths: 2,
            halfBaths: 1
        }
    ],
    testTMKs = [
        {parcelNumber: 910500520000, link: 'Default.aspx?PossePresentation=BuildingPermit&PosseObjectId=47225785'}
    ],
    testLinks = [
        {
            link: 'Default.aspx?PossePresentation=BuildingPermit&PosseObjectId=47225785',
            jobCompleted: '2013-01-29',
            constructionCompleted: '2013-01-29',
            estimatedDollars: 13650,
            estimatedCents: 0,
            acceptedDollars: 13650,
            acceptedCents: 0,
            waterHeater: false,
            taxMapKeyLink: 'Default.aspx?PossePresentation=TaxMapKey&PosseObjectId=161144'
        },
        {
            link: 'Default.aspx?PossePresentation=BuildingPermit&PosseObjectId=47755114',
            jobCompleted: '2013-01-08',
            constructionCompleted: '2013-01-08',
            estimatedDollars: 3900,
            estimatedCents: 0,
            acceptedDollars: 3900,
            acceptedCents: 0,
            waterHeater: true,
            taxMapKeyLink: 'Default.aspx?PossePresentation=TaxMapKey&PosseObjectId=161144'
        }
    ],
    testCensus = [
        {
            link: 'Default.aspx?PossePresentation=TaxMapKey&PosseObjectId=161144',
            censusTract: 8412,
            censusBlock: 1000
        }
    ],
    testAllData = [
        {
            'parcelNumber': '910500520000',
            'ownerNames': 'KIMURA,WAYNE S; KIMURA,EDITH N M; KIMURA,EDITH N M',
            'address': '91-129 WAIMAPUNA PL',
            'landArea': 3120,
            'buildingValue': 221300,
            'propertyValue': 497700,
            'occupancy': 'SINGLE-FAMILY',
            'yearBuilt': 1988,
            'buildingArea': 1410,
            'beds': 3,
            'baths': 2,
            'halfBaths': 1,
            'pv1Date': '2013-01-29',
            'pv1Value': 13650,
            'pv1Cents': 0,
            'pv2Date': '2015-11-10',
            'pv2Dollars': 8900,
            'pv2Cents': 0,
            'whDate': '2013-01-08',
            'whDollars': 3900,
            'censusTract': 8412,
            'censusBlock': 1000
        }
    ];

describe('PropertyScraper.getTMK()', function () {
    it('should return [] if no string is passed in', function (done) {
        PropertyScraper.getTMK('', function (result) {
            assert.equal(result.length, 0);
            done();
        });
    });

    testAddresses.forEach(function (test) {
        it(`should return ${test.tmk} for address: ${test.address}`, function (done) {
            PropertyScraper.getTMK(test.address, function (results) {
                assert.equal(results.length, 1);
                assert.equal(results[0].parcelNumber, test.tmk);
                done();
            });
        });
    });

});

describe('PropertyScraper.getPropertyValues()', function () {
    testProperties.forEach(function (test) {
        describe(`tmk: ${test.parcelNumber}`, function () {
            var result;

            before((done) =>
                PropertyScraper.getPropertyValues(test.parcelNumber, function (propertyValues) {
                    result = propertyValues;
                    done();
                })
            );

            it('should return landArea', () => assert.equal(result.landArea, test.landArea));
            it('should return buildingValue', () => assert.equal(result.buildingValue, test.buildingValue));
            it('should return propertyValue', () => assert.equal(result.propertyValue, test.propertyValue));
            it('should return occupancy', () => assert.equal(result.occupancy, test.occupancy));
            it('should return yearBuilt', () => assert.equal(result.yearBuilt, test.yearBuilt));
            it('should return buildingArea', () => assert.equal(result.buildingArea, test.buildingArea));
            it('should return beds', () => assert.equal(result.beds, test.beds));
            it('should return baths', () => assert.equal(result.baths, test.baths));
            it('should return halfBaths', () => assert.equal(result.halfBaths, test.halfBaths));
        });
    });
});

describe('PropertyScraper.getPermitLinks()', () =>
    testTMKs.forEach((test) =>
        it(`should return ${JSON.stringify(test.links)} for tmk: ${test.parcelNumber}`, (done) =>
            PropertyScraper.getPermitLinks(test.parcelNumber, function (links) {
                assert.equal(links.length, 3);
                assert.equal(links[0], test.link);
                done();
            })
        )
    )
);

describe.only('PropertyScraper.getPermitValues()', function () {
    testLinks.forEach(function (test) {
        var result;

        before((done) =>
            PropertyScraper.getPermitValues(test.link, function (permitValues) {
                result = permitValues;
                done();
            })
        );

        it(`should return jobCompleted date`,
            ()=> assert.equal(result.jobCompleted, test.jobCompleted)
        );

        it('should return constructionCompleted date',
            ()=> assert.equal(result.constructionCompleted, test.constructionCompleted)
        );

        it('should return estimatedDollars and estimatedCents',
            ()=> assert.equal(result.estimatedDollars, test.estimatedDollars)
        );

        it('should return acceptedDollars and acceptedCents',
            ()=> assert.equal(result.acceptedDollars, test.acceptedDollars)
        );

        it('should return acceptedValue',
            ()=> assert.equal(result.taxMapKeyLink, test.taxMapKeyLink)
        );

        it('should return waterHeater indicator', ()=> assert.equal(result.waterHeater, test.waterHeater))
    });
});

describe('PropertyScraper.getCensusDetails()', function () {
    testCensus.forEach(function (test) {
        var result;

        before((done) => PropertyScraper.getCensusDetails(test.link, function (censusDetails) {
            result = censusDetails;
            done();
        }));

        it('should return the censusTract', () => assert.equal(result.censusTract, test.censusTract));

        it('should return the censusBlock', () => assert.equal(result.censusBlock, test.censusBlock));
    });
});

describe.only('PropertyScraper.getAllDataFromAddress()', function () {
    testAddresses.forEach(function (test) {
        var results = {};

        before((done) => PropertyScraper.getAllDataFromAddress(test.address, function (allResults) {
            results = allResults;
            done();
        }));
        
        for (columnHeader in testAllData[0]) {
            if (!testAllData[0].hasOwnProperty(columnHeader)) {
                continue;
            }
            it(`should return ${columnHeader}`, function() {
                assert.equal(results[0][columnHeader], testAllData[0][columnHeader]);
            });
        }
    });
});
