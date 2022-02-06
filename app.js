require("dotenv").config();

const express = require("express");
const url = require("url");
const app = express();
const fetch = require("node-fetch");
const buildSVG = require("./svg");
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.listen(port, () => {
    console.log(`lighthouse-stats app listening at PORT ${port}`);
});

app.get("/", async (req, res) => {
    // results
    let performance = -1;
    let accessibility = -1;
    let best_practices = -1;
    let seo = -1;
    let pwa = -1;

    const queryObject = url.parse(req.url, true).query;
    const strategy = queryObject.strategy || "desktop";
    const categories = queryObject.categories || 31;
    const theme = queryObject.theme || "agnostic";
    const performanceTests = Math.min(3, Math.max(1, parseInt(queryObject.tests) || 0));
    const pagespeedQueryURL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${queryObject.url}&key=${API_KEY}&strategy=${strategy}&`;
    var procedure =
        ((categories & 1) > 0) +
        ((categories & 2) > 0) +
        ((categories & 4) > 0) +
        ((categories & 8) > 0) +
        ((categories & 16) > 0 ? performanceTests : 0);

    if (procedure === 0) res.send("NA");

    // performance
    const getPerformance = async () => {
        if ((categories & 16) === 16) {
            for (let i = 0; i < performanceTests; i++) {
                console.log("Sending performance request #" + (i + 1));
                await fetch(pagespeedQueryURL + `category=performance`)
                    .then((response) => response.json())
                    .then((json) => {
                        performance = Math.max(
                            performance,
                            Math.round(json.lighthouseResult.categories.performance.score * 100)
                        );
                    })
                    .catch((err) => {
                        // console.log(err)
                    })
                    .finally(() => {
                        procedure--;
                        if (procedure === 0)
                            proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme);
                    });
            }
        }
    };

    // accessibility
    const getA11y = async () => {
        if ((categories & 8) === 8) {
            console.log("Sending a11y request");
            await fetch(pagespeedQueryURL + `category=accessibility`)
                .then((response) => response.json())
                .then((json) => {
                    accessibility = Math.round(json.lighthouseResult.categories.accessibility.score * 100);
                })
                .catch((err) => {
                    // console.log(err)
                })
                .finally(() => {
                    procedure--;
                    if (procedure === 0)
                        proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme);
                });
        }
    };

    // best practices
    const getBestPractices = async () => {
        if ((categories & 4) === 4) {
            console.log("Sending best practices request");
            await fetch(pagespeedQueryURL + `category=best-practices`)
                .then((response) => response.json())
                .then((json) => {
                    best_practices = Math.round(json.lighthouseResult.categories["best-practices"].score * 100);
                })
                .catch((err) => {
                    // console.log(err)
                })
                .finally(() => {
                    procedure--;
                    if (procedure === 0)
                        proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme);
                });
        }
    };

    const getSEO = async () => {
        // seo
        if ((categories & 2) === 2) {
            console.log("Sending SEO request");
            await fetch(pagespeedQueryURL + `category=seo`)
                .then((response) => response.json())
                .then((json) => {
                    seo = Math.round(json.lighthouseResult.categories.seo.score * 100);
                })
                .catch((err) => {
                    // console.log(err)
                })
                .finally(() => {
                    procedure--;
                    if (procedure === 0)
                        proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme);
                });
        }
    };

    // pwa
    const getPWA = async () => {
        if ((categories & 1) === 1) {
            console.log("Sending PWA request");
            await fetch(pagespeedQueryURL + `category=pwa`)
                .then((response) => response.json())
                .then((json) => {
                    const lighthouseResult = json.lighthouseResult;
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
                    let pwa = 0;
                    if (fast_reliable === fast_reliable_total) pwa |= 1;
                    if (installable === installable_total) pwa |= 2;
                    if (optimized === optimized_total) pwa |= 4;
                })
                .catch((err) => {
                    // console.log(err)
                })
                .finally(() => {
                    procedure--;
                    if (procedure === 0)
                        proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme);
                });
        }
    };

    await Promise.all([getPerformance(), getBestPractices(), getA11y(), getSEO(), getPWA()]);
});

const proceed = (performance, accessibility, best_practices, seo, pwa, res, categories, theme) => {
    console.log(
        `Scores: ${performance} performance; ${accessibility} accessibility; ${best_practices} best practices; ${seo} seo; ${pwa} pwa`
    );
    // test
    // performance = 95
    // accessibility = 100
    // best_practices = 76
    // seo = 40
    // pwa = 3
    // prepare svg and send
    let procedure =
        ((categories & 1) > 0) +
        ((categories & 2) > 0) +
        ((categories & 4) > 0) +
        ((categories & 8) > 0) +
        ((categories & 16) > 0);
    const offset1 = 500 - procedure * 100;
    const offset2 = offset1 + ((categories & 16) === 16 ? 200 : 0);
    const offset3 = offset2 + ((categories & 8) === 8 ? 200 : 0);
    const offset4 = offset3 + ((categories & 4) === 4 ? 200 : 0);
    const offset5 = offset4 + ((categories & 2) === 2 ? 200 : 0);
    const svg = buildSVG({
        theme,
        categories,
        scores: { performance, accessibility, best_practices, seo, pwa },
        offsets: [offset1, offset2, offset3, offset4, offset5],
    });
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
    // res.send(`performance: ${performance}, accessibility: ${accessibility}, best-practices: ${best_practices}, seo: ${seo}, pwa: {fast and reliable: ${fast_reliable}/${fast_reliable_total}, installable: ${installable}/${installable_total}, optimized: ${optimized}/${optimized_total}}`)
};
