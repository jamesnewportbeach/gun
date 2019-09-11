
    var shim = require('./shim');
    var S = require('./settings');
    var sha256hash = require('./sha256');

    const importGen = async (key, salt, opt) => {
      //const combo = shim.Buffer.concat([shim.Buffer.from(key, 'utf8'), salt || shim.random(8)]).toString('utf8') // old
      var opt = opt || {};
      const combo = key + (salt || shim.random(8)).toString('utf8'); // new
      const hash = shim.Buffer.from(await sha256hash(combo), 'binary')
      const jwkHash = S.keyTojwk(hash)
      return await shim.subtle.importKey('jwk', jwkHash, {name:'AES-GCM'}, false, ['encrypt', 'decrypt'])
    }
    module.exports = importGen;
  