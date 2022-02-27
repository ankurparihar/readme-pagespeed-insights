import fetch from "node-fetch";

import constants from "../constants";

const { PAGESPEED_API_URL, API_KEY, CAT_PWA } = constants;

/**
 * Test to get PWA score
 * @returns score
 */
const pwaTest = async (url: string, strategy: string) => {
    try {
        const response = await fetch(
            `${PAGESPEED_API_URL}?url=${url}&strategy=${strategy}&category=${CAT_PWA}&key=${API_KEY}`
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
            const audit = lighthouseResult.audits[auditRef.id];
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

export default pwaTest;
