/**
 * Remove duplicates from array
 */
const removeDuplicates = <Type>(array: Type[]) => {
    return array.filter((item, i) => array.indexOf(item) === i);
};

export { removeDuplicates };
