'use strict'

var Buffer = require('safe-buffer').Buffer
var Base58 = require('bs58')
var cryptoUtils = require('./utils/crypto-utils.js')
var utils = require('./utils/utils.js')

let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js

var KeyVersion3 = 3
var KeyCurrentVersion = 4

/**
 * @typedef {Object} KeyOptions
 * @property {Buffer} salt
 * @property {Buffer} iv
 * @property {String} kdf
 * @property {Number} dklen
 * @property {Number} c
 * @property {Number} n
 * @property {Number} r
 * @property {Number} p
 * @property {String} cipher
 * @property {Buffer} uuid
 * @global
 */

/**
 * Key Object.
 * @typedef {Object} Key
 * @property {Number} version
 * @property {Buffer} id
 * @property {HexString} address
 * @property {Object} crypto
 * @global
 */

/**
 * Account constructor.
 * Class encapsulate main operation with account entity.
 * @constructor
 *
 * @param {Hash} priv Account private key.
 * @param {String} path
 *
 * @example var account = new Account(new Buffer("ac3773e06ae74c0fa566b0e421d4e391333f31aef90b383f0c0e83e4873609d6", "hex") );
 *
 */
var Account = function(priv, path) {
  priv = priv || cryptoUtils.crypto.randomBytes(32)
  this.setPrivateKey(priv)
  this.path = path
}

/**
 * Account factory method.
 * Create random account.
 * @static
 *
 * @return {Account} Instance of Account constructor.
 *
 * @example var account = Account.NewAccount();
 */
Account.NewAccount = function(priv) {
  return new Account(priv)
  //   return new Account(cryptoUtils.crypto.randomBytes(32))
}

Account.prototype = {
  /**
   * Private Key setter.
   *
   * @param {Hash} priv - Account private key.
   *
   * @example account.setPrivateKey("ac3773e06ae74c0fa566b0e421d4e391333f31aef90b383f0c0e83e4873609d6");
   */
  setPrivateKey: function(priv) {
    if (utils.isString(priv) || Buffer.isBuffer(priv)) {
      this.privKey =
        priv.length === 32 ? priv : Base58.decode(priv).slice(1, 33)
      this.pubKey = null
      this.address = null
    }
  },
  /**
   * Private Key getter.
   *
   * @return {Buffer} Account private key.
   *
   * @example var privKey = account.getPrivateKey();
   * //<Buffer 5b ed 67 f9 9c b3 31 9e 0c 6f 6a 03 54 8b e3 c8 c5 2a 83 64 46 4f 88 6f> 24
   */
  getPrivateKey: function() {
    return this.privKey
  },
  /**
   * Get Private Key in hex string format.
   *
   * @return {HexString} Account private key in String format.
   *
   * @example var privKey = account.getPrivateKeyString();
   * //"ac3773e06ae74c0fa566b0e421d4e391333f31aef90b383f0c0e83e4873609d6"
   */
  getPrivateKeyString: function() {
    return this.getPrivateKey().toString('hex')
  },
  /**
   * Public Key getter.
   *
   * @return {Buffer} Account public key.
   *
   * @example var publicKey = account.getPublicKey();
   * //<Buffer c0 96 aa 4e 66 c7 4a 9a c7 18 31 f1 24 72 2a c1 3e b5 df 7f 97 1b 13 1d 46 a2 8a e6 81 c6 1d 96 f7 07 d0 aa e9 a7 67 436b 68 af a8 f0 96 65 17 24 29 ... >
   */
  getPublicKey: function() {
    if (utils.isNull(this.pubKey)) {
      this.pubKey = cryptoUtils.privateToPublic(this.privKey)
    }
    return this.pubKey
  },
  /**
   * Get Public Key in hex string format.
   *
   * @return {HexString} Account public key in String format.
   *
   * @example var publicKey = account.getPublicKey();
   * //"f18ec04019dd131bbcfada4020b001d547244d768f144ef947577ce53a13ad690eb43e4b02a8daa3c168045cd122c0685f083e1656756ba7982721322ebe4da7"
   */
  getPublicKeyString: function() {
    return this.getPublicKey().toString('hex')
  },
  /**
   * Accaunt address getter.
   *
   * @return {Buffer} Account address.
   *
   * @example var address = account.getAddressString();
   */
  getAddressString: function(address_prefix) {
    if (utils.isNull(this.address)) {
      let pkey = PrivateKey.fromBuffer(this.privKey)
      let pubkey = pkey.toPublicKey()
      this.address = pubkey.toAddressString(address_prefix)
    }
    return this.address
  },
  /**
   * Generate key buy passphrase and options.
   *
   * @param {Password} password - Provided password.
   * @param {KeyOptions} opts - Key options.
   *
   * @return {Key} Key Object.
   *
   * @example var key = account.toKey("passphrase");
   */
  toKey: function(password, opts) {
    /*jshint maxcomplexity:17 */

    opts = opts || {}
    var salt = opts.salt || cryptoUtils.crypto.randomBytes(32)
    var iv = opts.iv || cryptoUtils.crypto.randomBytes(16)
    var derivedKey
    var kdf = opts.kdf || 'scrypt'
    var kdfparams = {
      dklen: opts.dklen || 32,
      salt: salt.toString('hex'),
    }
    if (kdf === 'pbkdf2') {
      kdfparams.c = opts.c || 262144
      kdfparams.prf = 'hmac-sha256'
      derivedKey = cryptoUtils.crypto.pbkdf2Sync(
        new Buffer(password),
        salt,
        kdfparams.c,
        kdfparams.dklen,
        'sha256'
      )
    } else if (kdf === 'scrypt') {
      kdfparams.n = opts.n || 4096
      kdfparams.r = opts.r || 8
      kdfparams.p = opts.p || 1
      derivedKey = cryptoUtils.scrypt(
        new Buffer(password),
        salt,
        kdfparams.n,
        kdfparams.r,
        kdfparams.p,
        kdfparams.dklen
      )
    } else {
      throw new Error('Unsupported kdf')
    }
    var cipher = cryptoUtils.crypto.createCipheriv(
      opts.cipher || 'aes-128-ctr',
      derivedKey.slice(0, 16),
      iv
    )
    if (!cipher) {
      throw new Error('Unsupported cipher')
    }
    var ciphertext = Buffer.concat([
      cipher.update(this.privKey),
      cipher.final(),
    ])
    // var mac = cryptoUtils.sha3(Buffer.concat([derivedKey.slice(16, 32), new Buffer(ciphertext, 'hex')]));   // KeyVersion3 deprecated
    var mac = cryptoUtils.sha3(
      Buffer.concat([
        derivedKey.slice(16, 32),
        new Buffer(ciphertext, 'hex'),
        iv,
        new Buffer(opts.cipher || 'aes-128-ctr'),
      ])
    )
    return {
      version: KeyCurrentVersion,
      id: cryptoUtils.uuid.v4({
        random: opts.uuid || cryptoUtils.crypto.randomBytes(16),
      }),
      address: this.getAddressString(),
      crypto: {
        ciphertext: ciphertext.toString('hex'),
        cipherparams: {
          iv: iv.toString('hex'),
        },
        cipher: opts.cipher || 'aes-128-ctr',
        kdf: kdf,
        kdfparams: kdfparams,
        mac: mac.toString('hex'),
        machash: 'sha3256',
      },
    }
  },
  /**
   * Generate key buy passphrase and options.
   * Return in JSON format.
   *
   * @param {Password} password - Provided password.
   * @param {KeyOptions} opts - Key options.
   *
   * @return {String} JSON stringify Key.
   *
   * @example var key = account.toKeyString("passphrase");
   */
  toKeyString: function(password, opts) {
    return JSON.stringify(this.toKey(password, opts))
  },
  /**
   * Restore account from key and passphrase.
   *
   * @param {Key} input - Key Object.
   * @param {Password} password - Provided password.
   * @param {Boolean} nonStrict - Strict сase sensitivity flag.
   *
   * @return {@link Account} - Instance of Account restored from key and passphrase.
   */
  fromKey: function(input, password, nonStrict) {
    /*jshint maxcomplexity:10 */

    var json =
      typeof input === 'object'
        ? input
        : JSON.parse(nonStrict ? input.toLowerCase() : input)
    if (json.version !== KeyVersion3 && json.version !== KeyCurrentVersion) {
      throw new Error('Not supported wallet version')
    }
    var derivedKey
    var kdfparams
    if (json.crypto.kdf === 'scrypt') {
      kdfparams = json.crypto.kdfparams
      derivedKey = cryptoUtils.scrypt(
        new Buffer(password),
        new Buffer(kdfparams.salt, 'hex'),
        kdfparams.n,
        kdfparams.r,
        kdfparams.p,
        kdfparams.dklen
      )
    } else if (json.crypto.kdf === 'pbkdf2') {
      kdfparams = json.crypto.kdfparams
      if (kdfparams.prf !== 'hmac-sha256') {
        throw new Error('Unsupported parameters to PBKDF2')
      }
      derivedKey = cryptoUtils.crypto.pbkdf2Sync(
        new Buffer(password),
        new Buffer(kdfparams.salt, 'hex'),
        kdfparams.c,
        kdfparams.dklen,
        'sha256'
      )
    } else {
      throw new Error('Unsupported key derivation scheme')
    }
    var ciphertext = new Buffer(json.crypto.ciphertext, 'hex')
    var mac

    if (json.version === KeyCurrentVersion) {
      mac = cryptoUtils.sha3(
        Buffer.concat([
          derivedKey.slice(16, 32),
          ciphertext,
          new Buffer(json.crypto.cipherparams.iv, 'hex'),
          new Buffer(json.crypto.cipher),
        ])
      )
    } else {
      // KeyVersion3
      mac = cryptoUtils.sha3(
        Buffer.concat([derivedKey.slice(16, 32), ciphertext])
      )
    }

    if (mac.toString('hex') !== json.crypto.mac) {
      throw new Error('Key derivation failed - possibly wrong passphrase')
    }
    var decipher = cryptoUtils.crypto.createDecipheriv(
      json.crypto.cipher,
      derivedKey.slice(0, 16),
      new Buffer(json.crypto.cipherparams.iv, 'hex')
    )
    var seed = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    while (seed.length < 32) {
      var nullBuff = new Buffer([0x00])
      seed = Buffer.concat([nullBuff, seed])
    }
    this.setPrivateKey(seed)
    return this
  },
}

module.exports = Account

global.account_utils = Account
