require("dotenv").config();

const express = require("express");
const url = require("url");
const app = express();
const buildSVG = require("./svg");
const runTests = require("./psi-runner");
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`lighthouse-stats-app listening at PORT ${port}`);
});

app.get("/", async (req, res) => {
    const queryObject = url.parse(req.url, true).query;
    const { url: SITE_URL, strategy = "desktop", theme = "agnostic", perfTestCount = 1 } = queryObject;
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
    }

    const defaultCategories = ["performance", "accessibility", "best-practices", "seo", "pwa"];
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
