var casper = require('casper').create();

var basicSelectorDictionary = {
  developmentPlanAreas: 'span[id^="Description_713925_734875"]',
  floodZones: 'span[id^="Description_713925_734356"]',
  heightLimit: 'span[id^="Description_713925_734869"]',
  lotRestriction: 'span[id^="Description_713925_775450"]',
  neighborhoodBoards: 'span[id^="Description_713925_775587"]',
  SMA: 'span[id^="Description_713925_734863"]',
  slideArea: 'span[id^="Description_713925_831366"]',
  stateLandUse: 'span[id^="Description_713925_734860"]',
  streetSetback: 'span[id^="Description_713925_775513"]',
  zoning: 'span[id^="Description_713925_734850"]',
};

var posseSelectorDictionary = {
  applicationNumber: 'span[id^="ExternalFileNum_713846_"]',
  jobNumber: 'span[id^="ExternalId_713846_"]',
  description: 'span[id^="Description_713846_"]',
  createdDate: 'span[id^="CreatedDate_713846_"]',
  issuedDate: 'span[id^="IssueDate_713846_"]',
  status: 'span[id^="StatusDescription_713846_"]',
  location: 'span[id^="JobLocation_713846_"]',
  jobCompletedDate: 'span[id^="CompletedDate_713846_"]',
  dateConstructionCompleted: 'span[id^="ConstructionCompletedDate_713846_"]',
  staffAssignment: 'span[id^=""]',
  cityProject: 'span[id^=""]',
  jobAddress: 'span[id^=""]',
  estimatedValue: 'span[id^=""]',
  acceptedValue: 'span[id^=""]',
  occupancyGroupCategory: 'span[id^=""]',
  occupancyGroup: 'span[id^=""]',
  ownership: 'span[id^=""]',
  commercialOrResidential: 'span[id^=""]',
  proposedUse: 'span[id^=""]',
  floorLevel: 'span[id^=""]',
  minTypesOfConstruction: 'span[id^=""]',
  actualTypesOfConstruction: 'span[id^=""]',
  numberStoriesExisting: 'span[id^=""]',
  numberFinalStories: 'span[id^=""]',
  existingFloorArea: 'span[id^=""]',
  newFloorArea: 'span[id^=""]',
  totalFloorArea: 'span[id^=""]',
  buildingInspectionRequired: 'span[id^=""]',
  electricalInspectionRequired: 'span[id^=""]',
  plumbingInspectionRequired: 'span[id^=""]',
  plumbingPhases: 'span[id^=""]',
  electricalPhases: 'span[id^=""]',
  remarks: 'span[id^=""]',
  structureCode: 'span[id^=""]',
  requireAffidavit: 'span[id^=""]',
  requireSpecialInspection: 'span[id^=""]',
  requireCalledInspection: 'span[id^=""]',
  floodHazardDistrict: 'span[id^=""]',
  numberUnitsAdded: 'span[id^=""]',
  numberUnitsDeleted: 'span[id^=""]',
  numberRoomsAdded: 'span[id^=""]',
  numberRoomsDeleted: 'span[id^=""]',
  locationPermitCreated: 'span[id^=""]',
  locationPermitIssued: 'span[id^=""]',
};

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