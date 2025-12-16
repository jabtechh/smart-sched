// Create valid PNG icons using sharp library
const sharp = require('sharp');
const path = require('path');

async function createIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  
  try {
    // Create 192x192 green PNG
    await sharp({
      create: {
        width: 192,
        height: 192,
        channels: 3,
        background: { r: 41, g: 122, b: 32 } // SmartSched green color
      }
    })
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192.png'));
    console.log('Created icon-192x192.png');

    // Create 192x192 maskable PNG
    await sharp({
      create: {
        width: 192,
        height: 192,
        channels: 3,
        background: { r: 41, g: 122, b: 32 }
      }
    })
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192-maskable.png'));
    console.log('Created icon-192x192-maskable.png');

    // Create 512x512 green PNG
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 41, g: 122, b: 32 } // SmartSched green color
      }
    })
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512.png'));
    console.log('Created icon-512x512.png');

    // Create 512x512 maskable PNG
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 41, g: 122, b: 32 }
      }
    })
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512-maskable.png'));
    console.log('Created icon-512x512-maskable.png');

    console.log('All PNG icons created successfully!');
  } catch (err) {
    console.error('Error creating icons:', err);
    process.exit(1);
  }
}

createIcons();





