var casper = require('casper').create();

var restCasper = require('casper').create();

//var restCasper = require('casper').create();

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
  staffAssignment: 'span[id^="StaffAssignment_713848_"]',
  cityProject: 'span[id^="CityProject_713848_"]',
  jobAddress: 'span[id^="JobAddress_713848_"]',
  estimatedValue: 'span[id^="EstimatedValueofWork_713848_"]',
  acceptedValue: 'span[id^="AcceptedValue_713848_"]',
  occupancyGroupCategory: 'span[id^="OccupancyGroupCategory_713848_"]',
  occupancyGroup: 'span[id^="OccupancyGroupAssessed_713848_"]',
  ownership: 'span[id^="OwnershipAssessed_713848_"]',
  commercialOrResidential: 'span[id^="CommercialResidential_713848_"]',
  proposedUse: 'span[id^="ProposedUse_713848_"]',
  floorLevel: 'span[id^="FloorLevel_713848_"]',
  minTypesOfConstruction: 'span[id^="TypesofConstructionMin_713848_"]',
  actualTypesOfConstruction: 'span[id^="TypesofConstructionActual_713848_"]',
  numberStoriesExisting: 'span[id^="ExistingStories_713848_"]',
  numberFinalStories: 'span[id^="FinalStories_713848_"]',
  existingFloorArea: 'span[id^="ExistingFloorArea_713848_"]',
  newFloorArea: 'span[id^="NewFloorArea_713848_"]',
  totalFloorArea: 'span[id^="TotalFloorArea_713848_"]',
  buildingInspectionRequired: 'span[id^="BldgInspYesNo_713848_"]',
  electricalInspectionRequired: 'span[id^="ElecInspYesNo_713848_"]',
  plumbingInspectionRequired: 'span[id^="PlumbInspYesNo_713848_"]',
  plumbingPhases: 'span[id^="PlumbingPhases_713848_"]',
  electricalPhases: 'span[id^="ElectricalPhases_713848_"]',
  remarks: 'span[id^="Remarks_713848_"]',
  structureCode: 'span[id^="StructureCode_713848_"]',
  requireAffidavit: 'span[id^="RequireAffidavit_713848_"]',
  requireSpecialInspection: 'span[id^="RequireSpecialInspection_713848_"]',
  requireCalledInspection: 'span[id^="RequireCalledInspection_713848_"]',
  floodHazardDistrict: 'span[id^="FloodHazardTypes_713848_"]',
  numberUnitsAdded: 'span[id^="NumUnitsAdd_713848_"]',
  numberUnitsDeleted: 'span[id^="NumRoomsDel_713848_"]',
  numberRoomsAdded: 'span[id^="NumRoomsAdd_713848_"]',
  numberRoomsDeleted: 'span[id^="NumRoomsDel_713848_"]',
  locationPermitCreated: 'span[id^="LocationJobCreated_713848_"]',
  locationPermitIssued: 'span[id^="LocationPermitIssued_713848_"]',
    otherWork: 'span[id^="OtherWork_713849_"]',
    drivewayTypes: 'span[id^="DrivewayTypes_713850_"]',
    lenOfDriveway: 'span[id^="DrivewayLength_713850_"]',
    sidewalkTypes: 'span[id^="SidewalkTypes_713850_"]',
    lenOfSidewalk: 'span[id^="SidewalkLength_713850_"]',
    curbingTypes: 'span[id^="CurbingTypes_713850_"]',
    lenOfCurbing: 'span[id^="CurbingLength_713850_"]',
    numShowersToReplace: 'span[id^="ShowerCount_713850_"]',
    numFaucetsToReplace: 'span[id^="FaucetCount_713850_"]',
    numUrinalsToReplace: 'span[id^="UrinalNotobeReplaced_713850_"]',
    numToiletsToReplace: 'span[id^="ToiletCount_713850_"]',
    sewerConnectionPermitNo: 'span[id^="SewerConnPermitNo_713850_"]',
};

var posseButtons = {
    planReviewFee: 'input[id^="Commercial_713848_"]',
    certifOfOccupancyNeeded: 'input[id^="BldgShallNotBeOccUntilCOIssued_713848_"]',
    floodHazardComplied: 'input[id^="FloodHazardComplied_713848_"]',
    floodHazardExempt: 'input[id^="FloodHazardExempt_713848_"]',
    floodHazardElevation: 'input[id^="AsBuiltElevationCertification_713848_"]',
    workNewBuilding: 'input[id^="NewBuilding_713849_"]',
    workFoundationOnly: 'input[id^="FoundationOnly_713849_"]',
    workShellOnly: 'input[id^="ShellOnly_713849_"]',
    workAddition: 'input[id^="Addition_713849_"]',
    workAlteration: 'input[id^="Alteration_713849_"]',
    workRepair: 'input[id^="Repair_713849_"]',
    workDemolition: 'input[id^="Demolition_713849_"]',
    workFence: 'input[id^="Fence_713849_"]',
    workRetainingWall: 'input[id^="RetainingWall_713849_"]',
    workElectrical: 'input[id^="ElectricalWork_713849_"]',
    workElectricalMeter: 'input[id^="ElectricalMeterOnly_713849_"]',
    workFireAlarm: 'input[id^="FireAlarm_713849_"]',
    workPlumbing: 'input[id^="PlumbingWork_713849_"]',
    workFireSprinkler: 'input[id^="FireSprinkler_713849_"]',
    workAC: 'input[id^="AirConditioning_713849_"]',
    workOhana: 'input[id^="Ohana_713849_"]',
    workADU: 'input[id^="AccessoryDwellingUnitADU_713849_"]',
    workPool: 'input[id^="Pool_713849_"]',
    workEVCharger: 'input[id^="TOWElecVehCharger_713849_"]',
    workSolar: 'input[id^="Solar_713849_"]',
    workSolarPVInstall: 'input[id^="TOWSolarPhotovoltaic_713849_"]',
    workPVInstallWBattery: 'input[id^="TOWSolarPhotovoltaicWithBatter_713849_"]',
    workHeatPump: 'input[id^="HeatPump_713849_"]',
    workAntenna: 'input[id^="Antenna_713849_"]',
    workTemporary: 'input[id^="Temporary1_713849_"]',
    workRelocationTo: 'input[id^="RelocationTo_713849_"]',
    workRelocationFrom: 'input[id^="RelocationFrom_713849_"]',
    drivewayNew: 'input[id^="DrivewayNew1_713850_"]',
    drivewayExisting: 'input[id^="Existing_713850_"]',
    drivewayPrivate: 'input[id^="Private1_713850_"]',
    drivewayRepair: 'input[id^="TOWDrivewayRepair_713850_"]',
    sidewalkRepair: 'input[id^="TOWSidewalkRepair_713850_"]',
    occupancyCommercial: 'input[id^="OccupancyGroupCommercial_713850_"]',
    occupancyHotel: 'input[id^="OccupancyGroupHotel_713850_"]',
    occupancyIndustrial: 'input[id^="OccupancyGroupIndustrial_713850_"]',
    occupancyResidential: 'input[id^="OccupancyGroupResidential_713850_"]',
};

function camelize(str) {
    return str.trim().replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
            return index === 0 ? match.toLowerCase() : match.toUpperCase();
        });
}

function postPermit(appNumber, data) {
  restCasper.start();
  var postAddress = 'http://localhost:8000/permits/' + String(appNumber);

  restCasper.then( function() {
    restCasper.open(postAddress, {
      method: 'post',
      data: data // this data is json of a permit
    });
  });

  restCasper.run();
}

function postTmk(tmk, result) {
  restCasper.start();

  var postAddress = 'http://localhost:8000/tmks/' + String(tmk);

  restCasper.then( function() {
    restCasper.open(postAddress, {
      method: 'post',
      data: {'body': String(result)} // this data is json of a permit
    });
  });

  restCasper.run();
}

function parse(tmk) {

  var posseId = 0;

  var form = {};

  var result = false;

  casper.start(
    'http://dppweb.honolulu.gov/DPPWeb/Default.aspx?PossePresentation=PropertySearch',
    function () {
      casper.fillSelectors('span#TMK_713880_S0_sp', {
        'input[name="TMK_713880_S0"]': String(tmk),
      }, false);
    }
  );

  casper.then(function () {
    casper.click('a#ctl00_cphBottomFunctionBand_ctl05_PerformSearch');
  });

  casper.then(function () {
    var addr = casper.getCurrentUrl();
    posseId = addr.slice(addr.lastIndexOf('=') + 1);
  });

// Parsing basic info
  casper.then(function (form) {
    for (var key in basicSelectorDictionary) {
      form[key] = casper.fetchText(basicSelectorDictionary[key]);
    }
  });

// Getting to the permits page
  casper.then(function () {
    casper.click('a#ctl00_cphTopBand_ctl03_hlkTabLink');
  });

  casper.then(function () {

    var links = casper.getElementsAttribute('a[href*="BuildingPermit&PosseObjectId"]', 'href');

    links.forEach(function (link) {
      casper.thenOpen('http:' + link, function() {
        // TODO check if link is already present in the database
        var permit = form;
        // Parsing the permit
        for (var key in posseSelectorDictionary) {
          permit[key] = casper.fetchText(posseSelectorDictionary[key]);
        }
        for (var key in posseButtons) {
          permit[key] = casper.getElementAttribute(posseButtons[key], 'value');
        }
        console.log('Collected permit: ', permit.applicationNumber);
        postPermit(permit.applicationNumber, permit);
      });
    });
  });

  result = true;

  casper.run(function () {
    casper.echo('TMK processed: ', tmk);
    postTmk(tmk, result);
    casper.exit();
  });
}

function parseBunch(num) {
  var reqLink = 'http://localhost:8000/tmks/?num=' + String(num);

  restCasper.start();

  restCasper.then( function () {
    restCasper.open(reqLink, {
      method: 'get',
      enctype: 'application/json'
    }).then( function () {
      tmks = JSON.parse(restCasper.getPageContent());
      tmks.data.forEach(function (record) {
        parse(record.tmk);
      })
    });
  });

  restCasper.run();
}

parseBunch(2);

// Search by TMK from the main page
