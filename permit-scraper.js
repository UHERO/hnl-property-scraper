const casper = require('casper').create();

casper.start('http://dppweb.honolulu.gov/DPPWeb/Default.aspx?PossePresentation=TaxMapKey&PosseObjectId=52896');

casper.then(function () {
  casper.click('a#ctl00_cphTopBand_ctl03_hlkTabLink');
});

casper.then(function () {
  this.echo(this.getHTML());
});

casper.run();
