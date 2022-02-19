require("dotenv").config();

const express = require("express");
const url = require("url");
const app = express();
const buildSVG = require("./svg");
const runTests = require("./psi-runner");
const {
    MAX_PERF_TEST_COUNT,
    STRATEGY_DESKTOP,
    THEME_AGNOSTIC,
    CAT_PERF,
    CAT_BEST,
    CAT_A11Y,
    CAT_SEO,
    CAT_PWA,
} = require("./constants");
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`lighthouse-stats-app listening at PORT ${port}`);
});

app.get("/", async (req, res) => {
    const queryObject = url.parse(req.url, true).query;
    const { url: SITE_URL, strategy = STRATEGY_DESKTOP, theme = THEME_AGNOSTIC, perfTestCount = 1 } = queryObject;
    const perfCount = parseInt(perfTestCount);

    if (!SITE_URL) {
        res.status(400).send("`url` not specified");
        return;
    }

    if (isNaN(perfCount)) {
        res.status(400).send("perfCount param should be a number");
        return;
    } else if (perfCount <= 0) {
        res.status(400).send("perfCount param should be > 0");
        return;
    } else if (perfCount > MAX_PERF_TEST_COUNT) {
        res.status(400).send(`perfCount cannot exceed ${MAX_PERF_TEST_COUNT}`);
        return;
    }

    const defaultCategories = [CAT_PERF, CAT_A11Y, CAT_BEST, CAT_SEO, CAT_PWA];
    let categories = defaultCategories;

    if (queryObject.categories) {
        try {
            categories = queryObject.categories.split(",");
            // remove duplicates
            categories = categories.filter((category, i) => categories.indexOf(category) === i);
            // check for invalid categories
            const invalidCategories = categories.filter((category) => defaultCategories.indexOf(category) === -1);
            if (invalidCategories.length > 0) {
                res.status(400).send(`Invalid categories: ${JSON.stringify(invalidCategories)}`);
                return;
            }
        } catch (error) {
            res.status(400).send("Invalid `categories`, unable to parse");
            return;
        }
    }

    const options = { performance: { iterations: perfCount } };
    const scores = await runTests(SITE_URL, categories, strategy, options);

    const svg = buildSVG(
        theme,
        categories.map((category) => ({ category, score: scores[category] }))
    );

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
});
