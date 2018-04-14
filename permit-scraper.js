const casper = require('casper').create();

const PosseId = 0;

class PermitScraper {
  static parseByTmk(tmk) {
    casper.start(
      'http://dppweb.honolulu.gov/DPPWeb/Default.aspx?PossePresentation=PropertySearch',
      function () {
        this.fillSelectors('span#TMK_713880_S0_sp', {
          'input[name="TMK_713880_S0"]': tmk,
        }, false);
      },
    );

    casper.then(function () {
      this.click('a#ctl00_cphBottomFunctionBand_ctl05_PerformSearch');
    });

    casper.then(function () {
      const addr = this.getCurrentUrl();
      const PosseId = addr.slice(addr.lastIndexOf('=') + 1);
    });

    casper.then(function () {
      this.echo(this.fetchText('span#AreaInSqFt_713924_38775_sp'));
    });

    casper.then(function () {
      this.click('a#ctl00_cphTopBand_ctl03_hlkTabLink');
    });

    casper.then(function () {
      this.click('a#ctl00_cphTopBand_ctl04_hlkTabLink');
    });

    casper.run();
  }
}

