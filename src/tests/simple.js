const fetch = require("node-fetch");
const { PAGESPEED_API_URL, API_KEY } = require("../constants");

/**
 * Basic test which requires single API call
 * @param {{url: String, category: String, strategy: String }} param0
 * @returns score
 */
const simpleTest = async ({ url, category, strategy }) => {
    const queryURL = `${PAGESPEED_API_URL}?url=${url}&strategy=${strategy}&category=${category}&key=${API_KEY}`;
    try {
        const response = await fetch(queryURL);
        const json = await response.json();
        const score = json.lighthouseResult.categories[category].score * 100;
        return score;
    } catch (error) {
        return -1;
    }
};

module.exports = simpleTest;
