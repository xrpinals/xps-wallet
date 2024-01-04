import operationTypes from './operation_types'
import appState from './appState'
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js
import publicEncrypt from 'browser-passworder'

export default {
  OperationTypes: operationTypes.types,
  haveEnoughBalance(spendAmountNu, spendAssetId, feeNu, accountBalances) {
    if (spendAmountNu.lte(0) && feeNu.lte(0)) {
      return true
    }
    let feeMatched = false
    let amountMatched = false
    for (let balance of accountBalances) {
      if (balance.assetId === '1.3.0') {
        if (balance.amountNu.lte(feeNu)) {
          return false
        }
        feeMatched = true
      }
      if (balance.assetId === spendAssetId) {
        let balanceToCal = balance.amountNu
        if (balance.assetId === '1.3.0') {
          balanceToCal = balanceToCal.minus(feeNu)
        }
        if (spendAmountNu.gt(balanceToCal)) {
          return false
        }
        amountMatched = true
      }
    }
    return feeMatched && amountMatched
  },
  getOperationTypeName(opType) {
    return operationTypes.types[opType]
  },
  getTxType(tx) {
    if (!tx) {
      return null
    }
    const operations = tx.operations
    if (!operations || !tx.operations.length) {
      return null
    }
    const firstOpTuple = operations[0]
    const opType = firstOpTuple[0]
    return operationTypes.types[opType]
  },
  amountToString(val) {
    return new BigNumber(val)
      .div(Math.pow(10, appState.precision))
      .toFixed(appState.precision)
  },
  opTotalFee(opFeeAmount, gasCount, gasPrice) {
    return this.amountToString(opFeeAmount + gasCount * gasPrice)
  },
  assetAmountToString(assetAmount) {
    // {amount: xxx, asset_id: xxx}
    let asset = appState.getAssetLocal(assetAmount.asset_id)
    if (!asset && assetAmount.asset_id === '1.3.0') {
      asset = { id: '1.3.0', symbol: 'BTC', precision: appState.precision }
    }
    if (asset) {
      return (
        new BigNumber(assetAmount.amount)
          .div(Math.pow(10, asset.precision))
          .toFixed(asset.precision) +
        ' ' +
        asset.symbol
      )
    }
    return assetAmount.amount + ' ' + assetAmount.asset_id
  },
  getTxReceiptStatus(nodeClient, tx) {
    const txType = this.getTxType(tx)
    if (
      ['contract_register', 'contract_invoke', 'transfer_contract'].indexOf(
        txType
      ) >= 0
    ) {
      const txid = tx.trxid
      return nodeClient.getContractTxReceipt(txid).then((receipts) => {
        const receipt = receipts[0]
        if (receipt && receipt.exec_succeed) {
          return 'success'
        } else {
          return 'fail'
        }
      })
    } else {
      let success = tx.block_num && tx.block_num > 0
      return Promise.resolve(success ? 'success' : 'fail')
    }
  },
  bytesToHex(bytes) {
    return TransactionHelper.bytes_to_hex(bytes)
  },
  hexToUtf8(s) {
    if (TransactionHelper.hexToUtf8WithoutMemoPrefix) {
      return TransactionHelper.hexToUtf8WithoutMemoPrefix(s)
    }
    return TransactionHelper.hexToUtf8(s)
  },
  hexToUnicodeString(s) {
    var escaped = ''
    var hex = ''
    if (s.length % 4 > 0) {
      for (i = 0; i < 4 - (s.length % 4); i++) {
        hex += '0'
      }
    }
    hex += s
    for (var i = 0; i < hex.length; i += 4) {
      escaped +=
        '%u' +
        hex.charAt(i) +
        hex.charAt(i + 1) +
        hex.charAt(i + 2) +
        hex.charAt(i + 3)
    }
    return unescape(escaped)
      .split(unescape('%00'))
      .join('')
  },
  hexToString(hexStr) {
    const bytes = TransactionHelper.hex_to_bytes(hexStr)
    const str = String.fromCharCode.apply(null, bytes)
    return str
  },
  isHexString(hexStr) {
    for (let i = 0; i < hexStr.length; i++) {
      const c = hexStr[i]
      if (c >= '0' && c <= '9') {
        continue
      }
      if (c >= 'a' && c <= 'f') {
        continue
      }
      if (c >= 'A' && c <= 'F') {
        continue
      }
      return false
    }
    return true
  },
  base58ToBytes(S) {
    // 把base58格式字符串转换成bytes
    // @param S base58格式的字符串
    const A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    var d = [], //the array for storing the stream of decoded bytes
      b = [], //the result byte array that will be returned
      i, //the iterator variable for the base58 string
      j, //the iterator variable for the byte array (d)
      c, //the carry amount variable that is used to overflow from the current byte to the next byte
      n //a temporary placeholder variable for the current byte
    for (i in S) {
      //loop through each base58 character in the input string
      ;(j = 0), //reset the byte iterator
        (c = A.indexOf(S[i])) //set the initial carry amount equal to the current base58 digit
      if (c < 0)
        //see if the base58 digit lookup is invalid (-1)
        return undefined //if invalid base58 digit, bail out and return undefined
      c || b.length ^ i ? i : b.push(0) //prepend the result array with a zero if the base58 digit is zero and non-zero characters haven't been seen yet (to ensure correct decode length)
      while (j in d || c) {
        //start looping through the bytes until there are no more bytes and no carry amount
        n = d[j] //set the placeholder for the current byte
        n = n ? n * 58 + c : c //shift the current byte 58 units and add the carry amount (or just add the carry amount if this is a new byte)
        c = n >> 8 //find the new carry amount (1-byte shift of current byte value)
        d[j] = n % 256 //reset the current byte to the remainder (the carry amount will pass on the overflow)
        j++ //iterate to the next byte
      }
    }
    while (
      j-- //since the byte array is backwards, loop through it in reverse order
    )
      b.push(d[j]) //append each byte to the result
    return new Uint8Array(b) //return the final byte array in Uint8Array format
  },
  isSameBuffer(buffer1, buffer2) {
    if (buffer1.length !== buffer2.length) {
      return false
    }
    for (let i = 0; i < buffer1.length; i++) {
      const b1 = buffer1[i]
      const b2 = buffer2[i]
      if (b1 !== b2) {
        return false
      }
    }
    return true
  },
  wifToHex(wifStr) {
    // WIF格式私钥转换成hex格式私钥
    // WIF格式是base58+4位checksum,checksum是私钥bytes的两次sha256
    if (!wifStr || wifStr.length < 4) {
      throw new Error('invalid WIF format')
    }
    const rawBytes = this.base58ToBytes(wifStr)
    const privateKeyBytesWithPrefix = rawBytes.subarray(0, rawBytes.length - 4)
    const privateKeyBytes = rawBytes.subarray(1, rawBytes.length - 4)
    const checksumBytes = rawBytes.subarray(rawBytes.length - 4)
    const tr = new TransactionBuilder()
    const checksum1 = tr.sha256(privateKeyBytesWithPrefix)
    const checksum2 = tr.sha256(checksum1)
    const checksum = checksum2.subarray(0, 4)
    if (!this.isSameBuffer(checksumBytes, checksum)) {
      throw new Error('invalid WIF checksum')
    }
    return TransactionHelper.bytes_to_hex(privateKeyBytes)
  },
  formatTimezone(date) {
    const offset = date.getTimezoneOffset()
    const result = new Date(
      date.getTime() +
        (Math.sign(offset) !== -1 ? -60000 * offset : 60000 * Math.abs(offset))
    )
    return result
  },
  getShowErrorMessage(e) {
    console.error('show error', e)
    if (e && e.message) {
      e = e.message
    }
    const originError = e
    e = (e || 'error').toString()
    if (!_.isString(originError)) {
      e = JSON.stringify(originError)
    }
    if (e === '{"isTrusted":true}') {
      if (originError && originError.type === 'error') {
        return 'Connection failed'
      }
      return 'Connected successfully'
    }
    e = e.replace(/bitshares/g, 'xps')
    return e
  },
  isChromeExtension() {
    return typeof chrome !== 'undefined' && !!chrome.windows
  },
  emptyBalance: {
    assetId: '1.3.0',
    assetSymbol: 'BTC',
    amountNu: new BigNumber(0),
    amount: 0,
  },
  localSetItem(key, value) {
    // TODO: 本地缓存记录存储时间，用于短期cache的时候太早数据不使用
    if (window.localStorage) {
      const network = appState.getCurrentNetwork()
      localStorage.setItem(`${network}.${key}`, JSON.stringify(value))
    }
  },
  localGetItem(key) {
    if (window.localStorage) {
      const network = appState.getCurrentNetwork()
      const resultStr = localStorage.getItem(`${network}.${key}`)
      if (!resultStr || resultStr === 'undefined') {
        return undefined
      }
      if (resultStr === 'null') {
        return null
      }
      try {
        return JSON.parse(resultStr)
      } catch (e) {
        return undefined
      }
    }
  },
}
