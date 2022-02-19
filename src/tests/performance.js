const fetch = require("node-fetch");
const { PAGESPEED_API_URL, API_KEY, CAT_PERF } = require("../constants");

/**
 * Performance test which requires multiple iterations to get better results
 * @param {{url: String, category: String, strategy: String, }} param0
 * @returns score
 */
const perfTest = async ({ url, strategy, iterations = 1 }) => {
    const category = CAT_PERF;
    const queryURL = `${PAGESPEED_API_URL}?url=${url}&strategy=${strategy}&category=${category}&key=${API_KEY}`;
    try {
        const responses = await Promise.all(new Array(iterations).fill(0).map(() => fetch(queryURL)));
        const jsons = await Promise.all(responses.map((response) => response.json()));
        // Todo invalid json handling
        const scores = jsons.map((json) => json.lighthouseResult.categories[category].score * 100);
        return Math.round(scores.reduce((prev, curr) => prev + curr) / scores.length);
    } catch (error) {
        return -1;
    }
};

module.exports = perfTest;
