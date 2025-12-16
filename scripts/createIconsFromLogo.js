const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logoPath = path.join(__dirname, '../src/assets/ptc_smartsched_logo_primary.png');
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function createIcons() {
  try {
    // Create 192x192 icon
    await sharp(logoPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192.png'));
    console.log('Created icon-192x192.png');

    // Create 192x192 maskable icon
    await sharp(logoPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192-maskable.png'));
    console.log('Created icon-192x192-maskable.png');

    // Create 512x512 icon
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512.png'));
    console.log('Created icon-512x512.png');

    // Create 512x512 maskable icon
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512-maskable.png'));
    console.log('Created icon-512x512-maskable.png');

    console.log('All PWA icons created successfully from logo!');
  } catch (error) {
    console.error('Error creating icons:', error);
    process.exit(1);
  }
}

createIcons();
