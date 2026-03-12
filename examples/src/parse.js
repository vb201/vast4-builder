"use strict";
/**
 * VAST 4.1 XML parser using fast-xml-parser
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVast = parseVast;
const fast_xml_parser_1 = require("fast-xml-parser");
const parserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    cdataPropName: '#cdata',
    parseAttributeValue: false,
    trimValues: true,
    parseTrueNumberOnly: false,
};
/**
 * Parse VAST XML string into structured JSON
 */
function parseVast(xml) {
    const parser = new fast_xml_parser_1.XMLParser(parserOptions);
    const result = parser.parse(xml);
    if (!result.VAST) {
        throw new Error('Invalid VAST XML: Root VAST element not found');
    }
    return result;
}
