const express = require('express'),
    bodyParser = require('body-parser'),
    csv = require('express-csv'),
    PropertyScraper = require('./property-scraper'),
    crypto = require('crypto'),
    fs = require('fs'),
    cors = require('cors'),
    app = express();

var filesInProgress = {};

// app.use(cors());
app.use(express.static('public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

app.use(bodyParser.json());

app.get('/progress/:filename', function(req, res) {
    if (filesInProgress.hasOwnProperty(req.params.filename)) {
        return res.json(filesInProgress[req.params.filename]);
    }
    fs.access(`files/${req.params.filename}.csv`, fs.R_OK, (err) => {
        if (err) {
            return res.json({
                errorMessage: 'Something went wrong checking the progress.',
                error: err
            });
        }
        res.json({ complete: 1 })
    });

});

app.get('/file/:filename', function(req, res) {
    fs.access(`files/${req.params.filename}`, fs.R_OK, (err) => {
        if (err) {
            return res.json({
                errorMessage: 'The requested resource does not exist.',
                error: err
            });
        }
        res.sendFile(`${__dirname}/files/${req.params.filename}`);
    });
});

app.get('/', function (req, res) {
    res.send('This API expects a POST with an array of addresses in Honolulu.');
});

/**
 * Responsible for creating new files and initiating the series of requests.
 */
app.post('/', function (req, res) {
    var filename;
    if (!Array.isArray(req.body)) {
        return res.json({error: 'not an array', submittedValue: JSON.stringify(req.body)});
    }
    filename = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    res.json({id: filename});

    // early return if the file has already been created
    try {
        fs.accessSync(`files/${filename}.csv`, fs.F_OK);
        return;
    } catch (e) { console.log(e); }
    
    filesInProgress[filename] = true;
    fs.writeFile(`files/${filename}.csv`,
        PropertyScraper.columns().map((field) => '"' + String(field).replace(/"/g, '""') + '"').join(',') + '\r\n',
        (err) => {
            if (err) throw err;
            console.log('column headers were written');
        }
    );
    propertyRows(filename, req.body, function(result) {
        var writtenRows = 0;
        result.forEach((row) => {
            fs.appendFile(`files/${filename}.csv`, printRow(row),
                (err) => {
                    if (err) throw err;
                    writtenRows++;
                    console.log('data row was written');
                    if(result.length === writtenRows) {
                        console.log('done writing');
                        delete filesInProgress[filename];
                    }
                }
            );
        });
    });
});

function printRow(row) {
    return JSON.stringify(PropertyScraper.columns().map((key) => row[key])).slice(1,-1) + '\r\n';
}

/**
 * calls the callback with a hashed filename.
 * @param filename
 * @param addressArray
 * @param callback
 */
function propertyRows(filename, addressArray, callback) {
    var resultArray = [],
        addressesProcessed = 0;
    const addressCount = addressArray.length;
    filesInProgress[filename] = {
        addressCount: addressCount,
        addressesCompleted: 0
    };

    addressArray.forEach(function(address, i) {
        console.log(`processing address: "${address}"`);
        PropertyScraper.getAllDataFromAddress(address, function(result) {
            addressesProcessed++;
            filesInProgress[filename].addressesCompleted++;
            console.log(`result: \r\n${JSON.stringify(result)}`);
            resultArray = resultArray.concat(result);
            if (addressesProcessed === addressCount) {
                callback(resultArray);
            }
        });
    });
}

app.listen(process.env.PORT || 3000, function () {
    console.log('property-scraper listening on port 3000!');
});