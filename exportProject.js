const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'project_snapshot.txt'; // Name of the output file
const PROJECT_DIR = './src'; // Directory to export

/**
 * Recursively reads all files in a directory.
 * @param {string} dir - The directory to traverse.
 * @returns {Promise<string>} - A concatenated string of all file contents.
 */
async function readFilesRecursive(dir) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  let output = '';

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      output += await readFilesRecursive(filePath);
    } else if (file.isFile()) {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const comment = `// ==================== ${filePath} ====================\n`;
      output += `${comment}${content}\n\n`;
    }
  }

  return output;
}

/**
 * Main function to generate the project snapshot.
 */
async function generateProjectSnapshot() {
  try {
    console.log('Generating project snapshot...');
    const content = await readFilesRecursive(PROJECT_DIR);
    await fs.promises.writeFile(OUTPUT_FILE, content, 'utf-8');
    console.log(`Snapshot written to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Error generating project snapshot:', err);
  }
}

generateProjectSnapshot();
