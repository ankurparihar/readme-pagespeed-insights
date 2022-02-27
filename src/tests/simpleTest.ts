import fetch from "node-fetch";
import constants from "../constants";

const { PAGESPEED_API_URL, API_KEY } = constants;

/**
 * Basic test which requires single API call
 * @returns score
 */
const simpleTest = async (url: string, category: string, strategy: string) => {
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

export default simpleTest;
