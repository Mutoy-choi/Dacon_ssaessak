const fs = require('fs');
const path = require('path');

// Read the image file
const imagePath = path.join(__dirname, 'image.png');
const imageBuffer = fs.readFileSync(imagePath);
const base64 = imageBuffer.toString('base64');

// Create the TypeScript content
const content = `// assets/petImages.ts

// Base64 encoded string for the 'Hatchi' character image.
export const HATCHI_IMAGE = \`data:image/png;base64,${base64}\`;
`;

// Write to petImages.ts
const outputPath = path.join(__dirname, 'assets', 'petImages.ts');
fs.writeFileSync(outputPath, content, 'utf8');

console.log('✅ petImages.ts generated successfully!');
console.log(`File size: ${content.length} bytes`);
