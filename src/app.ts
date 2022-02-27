import "dotenv/config";

import { parse as parseURL } from "url";

import express from "express";

import constants from "./constants";
import { urlOptions } from "./interfaces/options";
import runTests from "./psi-runner";
import buildSVG from "./svg";
import { getSingleQueryParam } from "./utils/url";
import { removeDuplicates } from "./utils/utils";

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`lighthouse-stats-app listening at PORT ${port}`);
});

const processURL = (
    url: string
): urlOptions & {
    error?: string;
} => {
    const queryObject = parseURL(url, true).query;
    const SITE_URL = getSingleQueryParam(queryObject.url);

    if (!SITE_URL) {
        return {
            error: "`url` not specified",
        };
    }

    const strategy = getSingleQueryParam(queryObject.strategy) || constants.STRATEGY_DESKTOP;
    const theme = getSingleQueryParam(queryObject.theme) || constants.THEME_AGNOSTIC;
    const perfTestCount = getSingleQueryParam(queryObject.perfTestCount) || "1";
    const perfCount = parseInt(perfTestCount);

    if (isNaN(perfCount)) {
        return {
            error: "perfCount param should be a number",
        };
    } else if (perfCount <= 0) {
        return {
            error: "perfCount param should be > 0",
        };
    } else if (perfCount > constants.MAX_PERF_TEST_COUNT) {
        return {
            error: `perfCount cannot exceed ${constants.MAX_PERF_TEST_COUNT}`,
        };
    }

    const defaultCategories = [
        constants.CAT_PERF,
        constants.CAT_A11Y,
        constants.CAT_BEST,
        constants.CAT_SEO,
        constants.CAT_PWA,
    ];
    let categories = defaultCategories;

    if (queryObject.categories) {
        try {
            categories = getSingleQueryParam(queryObject.categories).split(",");
            // remove duplicates
            categories = removeDuplicates(categories);
            // check for invalid categories
            const invalidCategories = categories.filter((category) => defaultCategories.indexOf(category) === -1);
            if (invalidCategories.length > 0) {
                return {
                    error: `Invalid categories: ${JSON.stringify(invalidCategories)}`,
                };
            }
        } catch (error) {
            return {
                error: "Invalid `categories`, unable to parse",
            };
        }
    }

    return {
        SITE_URL,
        strategy,
        categories,
        theme,
        perfCount,
    };
};

app.get("/", async (req, res) => {
    const { SITE_URL, strategy, categories, theme, perfCount, error } = processURL(req.url);

    if (error) {
        res.status(400).send(error);
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
