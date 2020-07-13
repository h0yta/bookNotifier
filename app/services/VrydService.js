const util = require('./ServiceUtil');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const stringSimilarity = require('string-similarity');
let properties = require('../../resources/properties.json');

const getLibraryBook = async (author, book) => {
  let url = properties.vrydLibraryUrl.replace("#####", book);

  return puppeteer
    .launch()
    .then((browser) => {
      return browser.newPage();
    }).then((page) => {
      return page.goto(url).then(() => {
        return page.content();
      });
    }).then((html) => {
      let $ = cheerio.load(html);
      let resultTitle = $('.product-list-item-link')
        .children()
        .first()
        .text()
        // result may be null here, moves this inside null-check and make a static function.
        .replace(/\(.*\)/gi, '')
        .replace(/:.*/gi, '')
        .trim();

      let resultAuthor = $('.product-list-author')
        .children()
        .text()
        .replace(/[\s]{2,}/gi, '');
      resultAuthor = resultAuthor.split('‚');

      let resultLink = $('.product-list-item-link')
        .first()
        .attr('href');

      let status = 'EJ_TIILGANGLIG_FOR_LAN';
      let store = 'Vaggeryds bibliotek';
      if (authorMatches(resultAuthor, author) && titleMatches(resultTitle, book)) {
        status = 'TILLGANGLIG_FOR_LAN';
      }

      let libBook = {
        'title': book,
        'status': status,
        'store': store,
        'link': util.createBookUrl(url, resultLink)
      }

      return libBook;
    }).catch((err) => {
      console.log(' Error in getLibraryBook in VrydService', err);
    });

}

const authorMatches = (resultAuthors, author) => {
  return resultAuthors.filter(a => {
    return stringSimilarity.compareTwoStrings(a, author) >= 0.8;
  }).length > 0;
}

const titleMatches = (resultTitle, book) => {
  return resultTitle !== null && stringSimilarity.compareTwoStrings(resultTitle, book) >= 0.8;
}

module.exports.getLibraryBook = getLibraryBook;