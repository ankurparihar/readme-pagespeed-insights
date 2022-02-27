// TODO: Deep freeze
export default {
    API_KEY: process.env.API_KEY,
    PAGESPEED_API_URL: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`, //?url=${queryObject.url}&key=${API_KEY}&strategy=${strategy}&`;

    // categories
    CAT_PERF: "performance",
    CAT_A11Y: "accessibility",
    CAT_BEST: "best-practices",
    CAT_SEO: "seo",
    CAT_PWA: "pwa",

    // theme
    THEME_LIGHT: "light",
    THEME_DARK: "dark",
    THEME_AGNOSTIC: "agnostic",

    // strategy
    STRATEGY_MOBILE: "mobile",
    STRATEGY_DESKTOP: "desktop",

    // misc
    MAX_PERF_TEST_COUNT: 3,
};
