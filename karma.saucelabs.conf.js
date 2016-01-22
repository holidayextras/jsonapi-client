"use strict";
/* eslint-disable */
var customLaunchers = {
  sl_chrome: {
    base: "SauceLabs",
    browserName: "chrome",
    platform: "Windows 7",
    version: "35"
  },
  // sl_firefox: {
  //   base: "SauceLabs",
  //   browserName: "firefox",
  //   version: "30"
  // },
  // sl_ios_safari: {
  //   base: "SauceLabs",
  //   browserName: "iphone",
  //   platform: "OS X 10.9",
  //   version: "7.1"
  // },
  // sl_ie_11: {
  //   base: "SauceLabs",
  //   browserName: "internet explorer",
  //   platform: "Windows 8.1",
  //   version: "11"
  // }
};

module.exports = function(config) {
  config.set({
    sauceLabs: {
        testName: "jsonapi-client full stack tests"
    },
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    reporters: [ "dots", "saucelabs" ],
    singleRun: true,
    basePath: "",
    frameworks: [ "mocha" ],
    files: [
      "dist/jsonapi-client-test.js"
    ],
    port: 9876,
    colors: true,
    logLevel: config.LOG_DEBUG,
    autoWatch: false,
    concurrency: 1,
    client: {
      captureConsole: true,
      timeout: 10000
    },
    startConnect: true,
    connectOptions: {
      verbose: true,
      verboseDebugging: true,
    },
    browserNoActivityTimeout: 30000
  });
};
