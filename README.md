# cross-qrcode-generator
Generate a ready-to-print page with QR Codes generated from a CSV file.

This project has been written in a few hours on a machine not dedicated to development so it doesn't use any modern tech, no compilation, no bundling, nothing to do apart from opening the HTML file.

The CSV file format is not specified since it's tied to the upstream workflow that involves manual operation.

It uses modified versions of the following libs to make them work without `npm` or compilation step:
- [`macintosh 3.0.2`](https://www.npmjs.com/package/macintosh).
- [`qrcode.js`](https://davidshimjs.github.io/qrcodejs/).
