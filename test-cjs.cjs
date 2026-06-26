const pdfParse = require('pdf-parse');
console.log("require:", typeof pdfParse);
if (typeof pdfParse === 'function') {
    console.log("It's a function");
}
