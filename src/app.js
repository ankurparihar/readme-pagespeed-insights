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
    const { url: SITE_URL, strategy = "desktop", theme = "agnostic" } = queryObject;

    if (!SITE_URL) {
        res.status(400).send("`url` not specified");
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

    const scores = await runTests(SITE_URL, categories, strategy);

    const svg = buildSVG({ theme, scores });

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
});
