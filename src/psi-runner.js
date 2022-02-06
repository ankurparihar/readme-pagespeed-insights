const fetch = require("node-fetch");

const API_KEY = process.env.API_KEY;
const PAGESPEED_API_URL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`; //?url=${queryObject.url}&key=${API_KEY}&strategy=${strategy}&`;

const simpleTest = async ({ url, category, strategy }) => {
    try {
        const response = await fetch(
            `${PAGESPEED_API_URL}?url=${url}&strategy=${strategy}&category=${category}&key=${API_KEY}`
        );
        const json = await response.json();
        const score = json.lighthouseResult.categories[category].score * 100;
        return score;
    } catch (error) {
        return -1;
    }
};

const pwaTest = async ({ url, strategy }) => {
    try {
        const response = await fetch(
            `${PAGESPEED_API_URL}?url=${url}&strategy=${strategy}&category=pwa&key=${API_KEY}`
        );
        const json = await response.json();
        const { lighthouseResult } = json;
        let fast_reliable = 0;
        let fast_reliable_total = 0;
        let installable = 0;
        let installable_total = 0;
        let optimized = 0;
        let optimized_total = 0;
        lighthouseResult.categories.pwa.auditRefs.forEach((auditRef) => {
            var audit = lighthouseResult.audits[auditRef.id];
            if (audit.scoreDisplayMode === "binary" || audit.scoreDisplayMode === "numeric") {
                if (auditRef.group === "pwa-fast-reliable") {
                    fast_reliable_total++;
                    if (audit && audit.score >= 0.9) {
                        fast_reliable++;
                    }
                } else if (auditRef.group === "pwa-installable") {
                    installable_total++;
                    if (audit && audit.score >= 0.9) {
                        installable++;
                    }
                } else if (auditRef.group === "pwa-optimized") {
                    optimized_total++;
                    if (audit && audit.score >= 0.9) {
                        optimized++;
                    }
                }
            }
        });
        let score = 0;
        if (fast_reliable === fast_reliable_total) score |= 1;
        if (installable === installable_total) score |= 2;
        if (optimized === optimized_total) score |= 4;
        return score;
    } catch (error) {
        return -1;
    }
};

/**
 * Run lighthouse tests using pagespeed API and return the scores
 * @param {String} url
 * @param {String[]} categories
 * @param {String} strategy
 * @returns scores
 */
const runTests = async (url, categories, strategy) => {
    const results = {};

    await Promise.all(
        categories.map((category) => {
            let runner = simpleTest;
            if (category === "pwa") {
                runner = pwaTest;
            }
            return runner({ url, category, strategy });
        })
    ).then((scores) => {
        categories.forEach((category, index) => {
            results[category] = scores[index];
        });
    });

    return results;
};

module.exports = runTests;
