const perfTest = require("./tests/performance");
const pwaTest = require("./tests/pwa");
const simpleTest = require("./tests/simple");

/**
 * Run lighthouse tests using pagespeed API and return the scores
 * @param {String} url
 * @param {String[]} categories
 * @param {String} strategy
 * @param {{String: Object}} options
 * @returns scores
 */
const runTests = async (url, categories, strategy, options) => {
    const results = {};

    await Promise.all(
        categories.map((category) => {
            switch (category) {
                case "pwa":
                    return pwaTest({ url, strategy });
                case "performance":
                    return perfTest({ url, strategy, iterations: options[category].iterations });
                default:
                    return simpleTest({ url, category, strategy });
            }
        })
    ).then((scores) => {
        categories.forEach((category, index) => {
            results[category] = scores[index];
        });
    });

    return results;
};

module.exports = runTests;
