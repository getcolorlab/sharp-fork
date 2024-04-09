const sharp = require('../lib');
const { resolve: pathResolve } = require('path');
const assert = require('assert');
const spawnChild = require('./utils/spawnChild');

// Define input and output files
const inFile = pathResolve(__dirname, 'files/100-0-0-100-fogra.tif');
const swop = pathResolve(__dirname, 'files/swop.icc');

// Helper to get a pixel value (uses `vips`, install with `brew install vips`)
async function getPixelValues(fileName, x, y) {
  const data = await spawnChild(
    'vips',
    [
      `getpoint`,
      `${fileName}`,
      `${x}`, // pixel x
      `${y}`, // pixel y
    ],
  );

  // Remove linebreaks and trim spaces from output and return (output is a string, e.g. '255 128 0 0`)
  return data.replace(/\n/g, '').trim();
}

// Helper to validate if a pixel equals to specific values (uses `vips`, install with `brew install vips`)
async function validatePixelValues(fileName, expectedPixelValues) {
  for (let i = 0; i < 10; i += 1) {
    const pixelValues = await getPixelValues(fileName, i, i);
    assert.strictEqual(pixelValues, expectedPixelValues);
  }
}

// Main function
(async function main () {
  // ##############################################################################
  // Invert without color space change (WORKING)
  // ##############################################################################
  // Source file: 1000x1000 file with CMYK colors 0/100/100/0 in Coated Fogra39
  await validatePixelValues(inFile, '255 0 0 255');
  const outFileFogra = pathResolve(__dirname, 'files/0-100-100-0-fogra.tif');
  await sharp(inFile)
    .toColourspace('cmyk')
    .pipelineColourspace('cmyk')
    .keepIccProfile()
    .negate()
    .toFile(outFileFogra);
  await validatePixelValues(outFileFogra, '0 255 255 0');
  // Output file: 1000x1000 file with CMYK colors 100/0/0/100 (inverted) in Coated Fogra39

  // ##############################################################################
  // Invert with color space change in 2 steps (WORKING)
  // ##############################################################################
  const outFileSwop2 = pathResolve(__dirname, 'files/218-187-153-197-swop.tif');
  await sharp(inFile)
    .toColourspace('cmyk')
    .pipelineColourspace('cmyk')
    .withIccProfile(swop)
    .toFile(outFileSwop2);
  await validatePixelValues(outFileSwop2, '218 187 153 197');
  // Output file: 1000x1000 file with CMYK colors 218/187/153/197 in U.S. Web Coated Swop V2

  const outFileSwopInverted2Steps = pathResolve(__dirname, 'files/37-68-102-58-swop-inverted-2step.tif');
  await sharp(outFileSwop2)
    .toColourspace('cmyk')
    .pipelineColourspace('cmyk')
    .keepIccProfile()
    .negate()
    .toFile(outFileSwopInverted2Steps);
  await validatePixelValues(outFileSwopInverted2Steps, `${255 - 218} ${255 - 187} ${255 - 153} ${255 - 197}`);
  // Output file: 1000x1000 file with CMYK colors 37/68/102/58 in U.S. Web Coated Swop V2, so the values are inverted (resulting value = 255 - source value)

  // ##############################################################################
  // Invert with color space change in 1 step (NOT WORKING)
  // ##############################################################################
  const outFileSwopInverted1Step = pathResolve(__dirname, 'files/37-68-102-58-swop-inverted-1step.tif');
  await sharp(inFile)
    .toColourspace('cmyk')
    .pipelineColourspace('cmyk')
    .withIccProfile(swop)
    .negate()
    .toFile(outFileSwopInverted1Step);
  await validatePixelValues(outFileSwopInverted1Step, `${255 - 218} ${255 - 187} ${255 - 153} ${255 - 197}`);
  // Output file: 1000x1000 file with CMYK colors 37/68/102/58 in U.S. Web Coated Swop V2, so the values are inverted (resulting value = 255 - source value)
})();
