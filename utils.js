const fs = require('fs');
const pathLib = require('path');

function isDirectory(file) {
  let stats;
  try {
    stats = fs.statSync(file);
  } catch (e) {
    return false;
  }
  return stats && stats.isDirectory();
}

function getPackageConfig(path) {
  const packagePath = pathLib.join(path, 'package.json');
  if (!fs.existsSync(packagePath)) return false;

  let config;
  try {
    const packageJson = fs.readFileSync(packagePath, 'utf-8');
    config = JSON.parse(packageJson);
  } catch (e) {
    return {};
  }
  return config;
}

module.exports = { isDirectory, getPackageConfig };
