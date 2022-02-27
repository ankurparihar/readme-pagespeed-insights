import constants from "./constants";
import { perfTest, pwaTest, simpleTest } from "./tests";

/**
 * Run lighthouse tests using pagespeed API and return the scores
 * @returns scores
 */
const runTests = async (url: string, categories: string[], strategy: string, options: { [x: string]: any }) => {
    const results = {};

    await Promise.all(
        categories.map((category) => {
            switch (category) {
                case constants.CAT_PWA:
                    return pwaTest(url, strategy);
                case constants.CAT_PERF:
                    return perfTest(url, strategy, options[category].iterations);
                default:
                    return simpleTest(url, category, strategy);
            }
        })
    ).then((scores) => {
        categories.forEach((category, index) => {
            results[category] = scores[index];
        });
    });
    // TODO: catch error
    return results;
};

export default runTests;
