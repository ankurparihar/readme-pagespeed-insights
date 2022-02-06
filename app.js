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

    if (categories.length === 0) res.send("NA");

    const scores = await runTests(SITE_URL, categories, strategy);

    const svg = buildSVG({ theme, scores });

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
});
