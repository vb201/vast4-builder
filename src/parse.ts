import { XMLParser } from 'fast-xml-parser';
import { Vast4Json } from './types';

const parserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    cdataPropName: '#cdata',
    parseAttributeValue: false,
    trimValues: true,
    parseTrueNumberOnly: false,
};

export function parseVast(xml: string): Vast4Json {
    const parser = new XMLParser(parserOptions);
    const result = parser.parse(xml);

    if (!result.VAST) {
        throw new Error('Invalid VAST XML: Root VAST element not found');
    }

    return result as Vast4Json;
}
