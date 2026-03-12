const { create } = require('xmlbuilder2');

// Test regular text
const test1 = {
    root: {
        text: 'Regular text',
    },
};

console.log('Regular text:');
console.log(create(test1).end({ prettyPrint: true }));

// Test CDATA using builder API
const doc = create({ version: '1.0', encoding: 'UTF-8' });
const root = doc.ele('root');
root.ele('cdata').dat('This should be CDATA');

console.log('\nCDATA method:');
console.log(doc.end({ prettyPrint: true }));

// Test simple approach
const test3 = {
    root: {
        impression: '<![CDATA[https://example.com/track?param=value]]>',
    },
};

console.log('\nSimple CDATA:');
console.log(create(test3).end({ prettyPrint: true }));
