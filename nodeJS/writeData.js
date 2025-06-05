const db = require('./firebase');

async function writeDataset(path = '/yourDataset', dataset = []) {
  const ref = db.ref(path);
  await ref.set(dataset);
  console.log('Wrote data successfully.');
}

module.exports = { writeDataset };