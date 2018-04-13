const casper = require('casper').create();

let PosseId = 0;

casper.start(
    'http://dppweb.honolulu.gov/DPPWeb/Default.aspx?PossePresentation=PropertySearch',
    function () {
    this.fillSelectors('span#TMK_713880_S0_sp', {
        'input[name="TMK_713880_S0"]': '23017013'
    }, false)
});

casper.then(function () {
    const addr = this.getCurrentUrl();
    PosseId = addr.slice(addr.lastIndexOf('=') + 1);
    this.echo(PosseId);
});

casper.then(function () {
  this.click('a#ctl00_cphBottomFunctionBand_ctl05_PerformSearch');
});

casper.then(function () {
  this.echo(this.fetchText('span#AreaInSqFt_713924_38775_sp'));
});

casper.then(function () {
   this.click('a#ctl00_cphTopBand_ctl03_hlkTabLink');
});

casper.then(function () {
    this.click('a#ctl00_cphTopBand_ctl03_hlkTabLink');
});

casper.run();
