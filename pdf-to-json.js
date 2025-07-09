const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = './src/assets/Nomenclatura-Color-FAC.pdf'; // Ajusta el path si es necesario
const outputPath = './src/assets/nomenclador-fac.json';

function parseLines(text) {
  // Ajusta este regex según el formato real de tu PDF
  const regex = /^([A-Z0-9]+)\s+(.+)$/gm;
  const result = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const codigo = match[1].trim();
    const descripcion = match[2].trim();
    if (codigo && descripcion) {
      result.push({ codigo, descripcion, federacion: "FAC" });
    }
  }
  return result;
}

fs.readFile(pdfPath, (err, data) => {
  if (err) throw err;
  pdf(data).then(function (pdfData) {
    const text = pdfData.text;
    const registros = parseLines(text);
    fs.writeFileSync(outputPath, JSON.stringify(registros, null, 2), 'utf-8');
    console.log(`✅ Archivo JSON generado con ${registros.length} registros en ${outputPath}`);
  });
});
