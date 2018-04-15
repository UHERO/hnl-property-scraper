var casper = require('casper').create();

var posseId = 0;

var form = {};

function camelize(str) {
    return str.trim().replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
            return index === 0 ? match.toLowerCase() : match.toUpperCase();
        });
}

// Search by TMK from the main page
casper.start(
    'http://dppweb.honolulu.gov/DPPWeb/Default.aspx?PossePresentation=PropertySearch',
    function () {
        this.fillSelectors('span#TMK_713880_S0_sp', {
            'input[name="TMK_713880_S0"]': '86023112',
        }, false);
    }
);

casper.then(function () {
    this.click('a#ctl00_cphBottomFunctionBand_ctl05_PerformSearch');
});

casper.then(function () {
    var addr = this.getCurrentUrl();
    posseId = addr.slice(addr.lastIndexOf('=') + 1);
});

// Parsing basic info
casper.then(function () {
    form['developmentPlanAreas'] = this.fetchText('span[id^="Description_713925_734875"]');
    form['floodZones'] = this.fetchText('span[id^="Description_713925_734356"]');
    form['heightLimit'] = this.fetchText('span[id^="Description_713925_734869"]');
    form['lotRestriction'] = this.fetchText('span[id^="Description_713925_775450"]');
    form['neighborhoodBoards'] = this.fetchText('span[id^="Description_713925_775587"]');
    form['SMA'] = this.fetchText('span[id^="Description_713925_734863"]');
    form['slideArea'] = this.fetchText('span[id^="Description_713925_831366"]');
    form['stateLandUse'] = this.fetchText('span[id^="Description_713925_734860"]');
    form['streetSetback'] = this.fetchText('span[id^="Description_713925_775513"]');
    form['zoning'] = this.fetchText('span[id^="Description_713925_734850"]');
    this.echo(form.zoning);
});

// Getting to the permits page
casper.then(function () {
    this.click('a#ctl00_cphTopBand_ctl03_hlkTabLink');
});

casper.then(function () {
    // Get the list of links
    var ListOfLinks = this.evaluate(function () {
        var links = [].map.call(document.querySelectorAll('a[href*="BuildingPermit&PosseObjectId"]'), function (link) {
            return link.href;
        })
        return links;
    })
    // Check date of creation

    // Pick beyond 1999

    // Click the post 1999 links
});

casper.run();