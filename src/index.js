'use strict';

const PLUGIN_REGEX = /cdn\s(.*)/;
const PLUGIN_KEYWORD = 'cdn';

const icon = require('../assets/icon.png');
const cdnjs = require('cdnjs-api');
const debounce = require('debounce');
const { memoize } = require('cerebro-tools');

const CDNJS_LIBRARY_DETAIL_URL = 'https://cdnjs.com/libraries/%name%';

// Cache cdnjs responses
const MEMOIZE_OPTIONS = {
  promise: 'then',
  maxAge: 1000 * 60 * 60 * 24, // 1 DAY
  preFetch: true
}

/**
 * Plugin entry point
 */
const plugin = ({ term, display, actions, hide }) => {

  const match = term.match(PLUGIN_REGEX);

  if (match) {
    let term = match[1].trim();
    
    debounce(
      search(term, display, actions, hide),
      300
    );
  }   
}

/**
 * Search packages on cdnjs.com
 */
const search = memoize((term, display, actions, hide) => {

  display({
    id: 'loading',
    title: `Searching for ${term} on cdnjs.com`,
    icon: icon
  });

  cdnjs.search(term, {
    fields: {
      description: true,
      version: true,
      homepage: true
    }
  }).then(result => {

    hide("loading");

    let results = result.slice(0, 10).map((item) => {
      return {
        title: `${item.name} (${item.version})`,
        subtitle: item.description,
        icon: icon,
        onSelect: (event) => {
          actions.copyToClipboard(item.latest);
        },
        onKeyDown: (event) => {
          if (event.ctrlKey && event.keyCode === 13) {
            let libraryURL = CDNJS_LIBRARY_DETAIL_URL.replace('%name%', item.name);
            actions.open(libraryURL);
          }
        }
      }
    });

    if (results.length > 0) {
      display(results);
      return;
    }

    display({ title: `No results found for ${term}`, icon: icon });

  });
}, MEMOIZE_OPTIONS);

module.exports = {
  fn: plugin,
  name: 'Search cdnjs.com',
  keyword: PLUGIN_KEYWORD,
  icon,
};