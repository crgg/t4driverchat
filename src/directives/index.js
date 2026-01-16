/**
 * Directives Index
 * Central export and registration for all directives
 */

import clickOutside from './clickOutside';
import lazyLoadImage from './lazyLoadImage';

export default {
  install(app) {
    app.directive('click-outside', clickOutside);
    app.directive('lazy-load', lazyLoadImage);
  },
};

export { clickOutside, lazyLoadImage };
