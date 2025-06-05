const db = require('./firebase');

async function readDataset(path = '/yourDataset') {
  const ref = db.ref(path);
  const snapshot = await ref.once('value');
  const data = snapshot.val();
  //console.log('Read data:', data);
  return data;
}


module.exports = { readDataset };