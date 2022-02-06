require("dotenv").config();

const express = require("express");
const url = require("url");
const app = express();
const buildSVG = require("./svg");
const runTests = require("./psi-runner");
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`lighthouse-stats app listening at PORT ${port}`);
});

app.get("/", async (req, res) => {
    // results

    const queryObject = url.parse(req.url, true).query;
    const SITE_URL = queryObject.url;
    const strategy = queryObject.strategy || "desktop";
    /**
     * @type {String[]}
     */
    const categories = queryObject.categories // TODO: error handling
        ? queryObject.categories.split(",")
        : ["performance", "accessibility", "best-practices", "seo", "pwa"];
    const theme = queryObject.theme || "agnostic";
    // const performanceTests = Math.min(3, Math.max(1, parseInt(queryObject.tests) || 0));

    if (categories.length === 0) res.send("NA");

    const scores = await runTests(SITE_URL, categories, strategy);

    const offset1 = 500 - categories.length * 100;
    const offset2 = offset1 + (categories.indexOf("performance") > -1 ? 200 : 0);
    const offset3 = offset2 + (categories.indexOf("accessibility") > -1 ? 200 : 0);
    const offset4 = offset3 + (categories.indexOf("best-practices") > -1 ? 200 : 0);
    const offset5 = offset4 + (categories.indexOf("seo") > -1 ? 200 : 0);

    const svg = buildSVG({
        theme,
        scores,
        offsets: [offset1, offset2, offset3, offset4, offset5],
    });

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
});
