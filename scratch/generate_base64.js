import fs from 'fs';
import path from 'path';

try {
  const logoPath = 'g:\\LearnBee\\learnbee\\src\\assets\\learnbeelogo.png';
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString('base64');
  
  const outputPath = 'g:\\LearnBee\\learnbee\\supabase\\functions\\saas-platform\\logo_base64.ts';
  fs.writeFileSync(outputPath, `export const LOGO_BASE64 = "${logoBase64}";\n`);
  
  console.log("Success! Created logo_base64.ts");
} catch (err) {
  console.error("Error generating base64 logo", err);
}
