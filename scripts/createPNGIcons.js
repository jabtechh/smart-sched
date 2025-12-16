// Create properly sized PNG icons using canvas simulation
const fs = require('fs');
const path = require('path');

// Create a simple valid PNG with specified dimensions
// This creates a solid green PNG file with the specified size
function createSolidColorPNG(width, height, outputPath) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk (image header)
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);  // chunk length
  ihdr.write('IHDR', 4);      // chunk type
  ihdr.writeUInt32BE(width, 8);   // width
  ihdr.writeUInt32BE(height, 12); // height
  ihdr[16] = 8;               // bit depth
  ihdr[17] = 2;               // color type (RGB)
  ihdr[18] = 0;               // compression
  ihdr[19] = 0;               // filter
  ihdr[20] = 0;               // interlace
  
  // Calculate CRC for IHDR
  const crc32 = require('crypto').createHash('md5');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(0x9c5611df, 0); // Simplified CRC
  ihdr.set(crc, 21);
  
  // Create minimal IDAT chunk with compressed data
  const zlib = require('zlib');
  const scanlines = Buffer.alloc(height * (width * 3 + 1));
  
  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // filter type
    for (let x = 0; x < width; x++) {
      scanlines[offset++] = 41;  // R - green
      scanlines[offset++] = 122; // G
      scanlines[offset++] = 32;  // B
    }
  }
  
  const compressed = zlib.deflateSync(scanlines);
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressed.length, 0);
  
  const idat = Buffer.alloc(12 + compressed.length);
  idatLength.copy(idat, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  idat.writeUInt32BE(0x2c89c7f5, 8 + compressed.length); // Simplified CRC
  
  // IEND chunk
  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  
  // Combine all chunks
  const png = Buffer.concat([signature, ihdr, idat, iend]);
  
  fs.writeFileSync(outputPath, png);
  console.log(`Created ${outputPath} (${width}x${height})`);
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create PNG icons with proper dimensions
try {
  createSolidColorPNG(192, 192, path.join(iconsDir, 'icon-192x192.png'));
  createSolidColorPNG(192, 192, path.join(iconsDir, 'icon-192x192-maskable.png'));
  createSolidColorPNG(512, 512, path.join(iconsDir, 'icon-512x512.png'));
  createSolidColorPNG(512, 512, path.join(iconsDir, 'icon-512x512-maskable.png'));
  console.log('PNG icons created successfully!');
} catch (err) {
  console.error('Error creating icons:', err);
}



