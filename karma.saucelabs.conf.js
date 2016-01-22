"use strict";

var customLaunchers = {
  win10chrome: {
    base: "SauceLabs",
    browserName: "chrome",
    platform: "Windows 10"
  },
  androidChrome: {
    base: "SauceLabs",
    browserName: "android",
    platform: "Linux"
  },
  win10firefox: {
    base: "SauceLabs",
    browserName: "firefox",
    platform: "Windows 10"
  },
  iosSafari: {
    base: "SauceLabs",
    browserName: "iphone",
    platform: "OS X 10.10"
  },
  iosSafari92: {
    base: "SauceLabs",
    browserName: "iphone",
    platform: "OS X 10.10",
    version: "9.2"
  },
  win10ie11: {
    base: "SauceLabs",
    browserName: "internet explorer",
    platform: "Windows 10"
  },
  win7ie9: {
    base: "SauceLabs",
    browserName: "internet explorer",
    platform: "Windows 7",
    version: "9.0"
  }
};

module.exports = function(config) {
  config.set({
    sauceLabs: {
      testName: "jsonapi-client full stack tests"
    },
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    frameworks: [ "mocha" ],
    reporters: [ "spec", "saucelabs" ],
    plugins: [ "karma-mocha", "karma-sauce-launcher", "karma-spec-reporter" ],
    singleRun: true,
    autoWatch: false,
    files: [
      "https://cdn.polyfill.io/v2/polyfill.js?features=Promise",
      "dist/jsonapi-client-test.js"
    ],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    concurrency: 5,
    client: {
      captureConsole: true,
      timeout: 10000
    },
    startConnect: true,
    connectOptions: {
      verbose: false,
      verboseDebugging: false
    },
    browserNoActivityTimeout: 30000
  });
};
