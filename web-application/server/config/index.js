/**************************************************************************************************
 *          Configuration
 *
 * Load the appropriate configuration file based on the value of NODE_ENV and merge it with the 
 * defaults configuration file.  Return the merged configuration object.
 *
 **************************************************************************************************/

var _ = require("lodash");
var defaults = require("./default.js");
var config = require("./" + (process.env.NODE_ENV || "development") + ".js");
module.exports = _.merge({}, defaults, config);
