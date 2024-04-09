const sharp = require('../lib');
const icc = require('icc');
const { resolve: pathResolve } = require('path');
const assert = require('assert');

// Define input and output files
const inFile = pathResolve(__dirname, 'files/sticker.jpg');
const outFile = pathResolve(__dirname, 'files/sticker-OUT.jpg');

(async function main () {
  console.log('HALLO1', inFile);

  // Get ICC profile from inFile
  const metaInFile = await sharp(inFile).metadata();
  assert.ok(metaInFile.icc instanceof Buffer, 'icc not set in inFile');
  const { description: iccDescrInFile } = icc.parse(metaInFile.icc);

  // Convert, keep ICC from inFile
  await sharp(inFile)
    .pipelineColourspace('cmyk')
    .toColourspace('cmyk')
    .keepIccProfile()
    .toFile(outFile);

  // Extract metadata from outFile, assert icc profile is present
  const metaOutFile = await sharp(outFile).metadata();
  assert.ok(metaOutFile.icc instanceof Buffer, 'icc not set in outFile');

  // Check if description of ICC profile in output file matches description of ICC profile in input file
  const { description: iccDescrOutFile } = icc.parse(metaOutFile.icc);
  assert.strictEqual(iccDescrOutFile, iccDescrInFile);

  console.log('HALLO3', outFile);
})();
