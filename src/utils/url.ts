/**
 * Get single query parameter value from url
 */
const getSingleQueryParam = (queryParam: string | string[], arrayResolution = "first") => {
    if (!queryParam) return;
    if (Array.isArray(queryParam)) {
        switch (arrayResolution) {
            case "first":
                return arrayResolution[0];
            case "last":
                return arrayResolution[arrayResolution.length - 1];
            default:
                return;
        }
    }
    return queryParam;
};

export { getSingleQueryParam };
