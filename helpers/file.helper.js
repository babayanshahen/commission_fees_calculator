const getExtension = (fileName) => {
  const parts = fileName.split('.');
  return parts[parts.length - 1];
}

const isJson = (fileName) => {
  const ext = getExtension(fileName);
  switch (ext.toLowerCase()) {
    case 'json':
      return true;
  }
  return false;
}

module.exports = {
  isJson,
};
