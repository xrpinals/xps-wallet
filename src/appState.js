import BIP32Factory from 'bip32'
import { ECPairFactory } from 'ecpair'
import EventEmitter from 'eventemitter3'
import publicEncrypt from 'browser-passworder'
const bip39 = require('bip39')
const bitcoin = require('bitcoinjs-lib')
const ecc = require('@bitcoin-js/tiny-secp256k1-asmjs')

const IS_PROD = true

const EE = new EventEmitter()

const networkList = [
  {
    chainId: IS_PROD
      ? '5790bf95b0fc2531eb44bdfe6032f60afb3649b781c4152ee197eb927749c404'
      : 'ae54f23a9ba5221f90fcd9e694b3e73fcff8bc2cc028d69a724f046a8e293713',
    key: 'mainnet',
    name: 'Mainnet',
    url: IS_PROD ? 'ws://api.xrpinals.com:1223' : 'ws://121.5.130.149:8910',
  },
]

mergeNetworkListWithLocalNetwork()

function setLocalNetwork(url, chainId) {
  setStorage(
    'local_network',
    JSON.stringify({
      chainId: chainId,
      key: 'local',
      name: 'Local',
      url: url,
    })
  )
}

function getLocalNetwork() {
  const info = getStorage('local_network')
  if (!info) {
    return null
  }
  try {
    return JSON.parse(info)
  } catch (e) {
    return null
  }
}

function mergeNetworkListWithLocalNetwork() {
  const network = getLocalNetwork()
  if (!network) {
    return networkList
  }
  let found = false
  for (let item of networkList) {
    if (item.key === network.key && item.url !== network.url) {
      item.url = network.url
      item.chainId = network.chainId
      item.name = network.name
      found = true
      break
    }
  }
  if (!found) {
    networkList.push(network)
  }
  return networkList
}

function getNetworkByKey(networkKey) {
  for (let n of networkList) {
    if (n.key === networkKey) {
      return n
    }
  }
  return null
}

const state = {
  currentWalletInfo: undefined,
  currentTab: 'my_wallet',
  currentTabParams: null,
  currentNetwork: 'mainnet',
  currentLanguage: 'english',
  currentKeystoreFileJson: null,
  currentKeystorePassword: '',
  currentAccount: null,
  currentAddress: null,
  apisInstance: null,
  nodeClient: null,

  systemAssets: [], // [{id: ..., symbol: ..., precision: ..., issuer: ..., options: ..., current_feed: ...}]

  flashTxMessage: null, // received tx message from postMessage

  payCallback: null,
  lastSerialNumber: null,

  tokenExplorerApiUrl: 'http://106.12.185.216/graphql',
}

let { NodeClient } = xps_js
let { Apis, ChainConfig } = xps_js.bitshares_ws

ChainConfig.setChainId(networkList[0].chainId)

function setStorage(key, value) {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.setItem(key, value)
    } catch (e) {}
  }
}

function getStorage(key) {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key)
    } catch (e) {}
  }
}

async function unLock(pwd) {
  try {
    state.currentPwd = pwd
    state.currentWalletInfo = await getWalletInfoByPwd(pwd)

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.session.set({ pwd: state.currentWalletInfo.pwd })
    } else {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('pwd', state.currentWalletInfo.pwd)
      }
    }

    return Promise.resolve(state.currentWalletInfo.account)
  } catch (error) {
    return Promise.reject('Incorrect password')
  }
}

const changeCurrentTabEventName = 'changeCurrentTab'
const changeCurrentNetworkEventName = 'changeCurrentNetwork'
const changeCurrentLanguageEventName = 'changeCurrentLanguage'
const changeCurrentAccountEventName = 'changeCurrentAccount'
const changeCurrentAddressEventName = 'changeCurrentAddress'
const pushFlashTxMessageEventName = 'pushFlashTxMessage'
const connectionCloseEventName = 'connectionClose'

const languageConfigStorageKey = 'languageConfig'

state.currentLanguage = getStorage(languageConfigStorageKey) || 'english'

function getLocationHash() {
  if (typeof location !== 'undefined') {
    return location.hash
  } else {
    return ''
  }
}

// receive params
const locationHash = getLocationHash()
switch (locationHash) {
  case '#transfer':
    {
      state.currentTab = 'transfer'
    }
    break
  case '#invoke_contract':
    {
      state.currentTab = 'contract'
    }
    break
  case '#transfer_to_contract':
    {
      state.currentTab = 'contract'
      state.currentTabParams = ['transfer_to_contract']
    }
    break
  case '#check_tx':
    {
      state.currentTab = 'check_tx'
      state.currentTabParams = []
    }
    break
  case '#sign_raw':
    {
      state.currentTab = 'sign_raw'
      state.currentTabParams = []
    }
    break
  default: {
    if (locationHash && locationHash.indexOf('#locktocitizen=') === 0) {
      const lockToCitizenName = locationHash.substr('#locktocitizen='.length)
      state.currentTab = 'my_wallet'
      state.currentTabParams = ['locktocitizen', lockToCitizenName]
    }
  }
}
location.hash = ''

async function saveWalletInfo(pwd, walletInfo) {
  const encryptWalletData = await publicEncrypt.encrypt(pwd, walletInfo)

  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ walletInfo: encryptWalletData })
    } else {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('walletInfo', encryptWalletData)
      }
    }

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.session.set({ pwd: walletInfo.pwd })
    } else {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('pwd', walletInfo.pwd)
      }
    }

    state.currentWalletInfo = walletInfo
    state.currentAccount = state.currentWalletInfo.account
    state.currentAddress = state.currentWalletInfo.account.address
    EE.emit(
      changeCurrentAccountEventName,
      state.currentAccount,
      state.currentWalletInfo.addresses
    )
    return Promise.resolve()
  } catch (e) {
    console.error(e)
  }
}

/* @return {
          pwd: string
          addresses: string[]
          mnemonic: string
          privateKey: string
          publicKey: string
        } | undefined
  */
async function getWalletInfoByPwd(pwd) {
  try {
    let walletInfo
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const data = await chrome.storage.local.get('walletInfo')
      if (!!data) walletInfo = data.walletInfo
    } else {
      if (typeof localStorage !== 'undefined') {
        walletInfo = localStorage.getItem('walletInfo', walletInfo)
      }
    }
    if (undefined !== walletInfo && !!Object.keys(walletInfo || {}).length) {
      const decryptWalletInfo = await publicEncrypt.decrypt(pwd, walletInfo)
      const currentAddress = decryptWalletInfo.account.address
      decryptWalletInfo.account = account_utils.NewAccount(
        decryptWalletInfo.addresses.find(
          ({ address }) => address === currentAddress
        ).privateKey
      )
      decryptWalletInfo.account.address = currentAddress
      return Promise.resolve(decryptWalletInfo)
    }

    return Promise.resolve(undefined)
  } catch (e) {
    return Promise.reject(e)
  }
}

function changeCurrentNetwork(network) {
  network = network || 'mainnet'
  if (state.nodeClient && state.currentNetwork === network) {
    return
  }
  const oldNetwork = state.currentNetwork
  state.currentNetwork = network
  const networkObj = getNetworkByKey(network)
  if (networkObj) {
    const chainRpcUrl = networkObj.url
    Apis.setAutoReconnect(true)
    state.apisInstance = Apis.instance(chainRpcUrl, true)
    state.apisInstance.closeCb = () => {
      EE.emit(connectionCloseEventName)
    }
    window.apisInstance = state.apisInstance
    state.nodeClient = new NodeClient(state.apisInstance)
    if (typeof localSave !== 'undefined') {
      localSave.setItem('networkKey', networkObj.key)
      localSave.setItem('apiPrefix', chainRpcUrl)
      localSave.setItem('chainId', networkObj.chainId)
    }
    ChainConfig.setChainId(networkObj.chainId)
    ChainConfig.address_prefix = networkObj.address_prefix || ''
  }
  EE.emit(changeCurrentNetworkEventName, state.currentNetwork)
  if (oldNetwork && oldNetwork != network) {
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
}

export default {
  IS_PROD,
  EE,
  precision: 8,
  pushFlashTx(txMsg) {
    state.flashTxMessage = txMsg
    if (txMsg) {
      if (txMsg.callback) {
        state.payCallback = txMsg.callback
      }
      if (txMsg.serialNumber) {
        state.lastSerialNumber = txMsg.serialNumber
      }
    }
    EE.emit(pushFlashTxMessageEventName, txMsg)
  },
  getFlashTxOnce() {
    const msg = state.flashTxMessage
    state.flashTxMessage = null
    return msg
  },
  onPushFlashTxMessage(listener) {
    EE.on(pushFlashTxMessageEventName, listener)
  },
  offPushFlashTxMessage(listener) {
    EE.off(pushFlashTxMessageEventName, listener)
  },
  changeCurrentTab(tabKey, params) {
    state.currentTab = tabKey
    state.currentTabParams = params
    EE.emit(changeCurrentTabEventName, state.currentTab, params)
  },
  onChangeCurrentTab(listener) {
    EE.on(changeCurrentTabEventName, listener)
  },
  offChangeCurrentTab(listener) {
    EE.off(changeCurrentTabEventName, listener)
  },
  getCurrentTab() {
    return state.currentTab
  },
  getCurrentTabParams() {
    return state.currentTabParams
  },
  clearCurrentTabParams() {
    state.currentTabParams.length = 0
  },
  getNetworkList() {
    return networkList
  },
  mergeNetworkListWithLocalNetwork() {
    mergeNetworkListWithLocalNetwork()
  },
  setLocalNetwork(url, chainId) {
    setLocalNetwork(url, chainId)
  },
  getWalletInfo() {
    return state.currentWalletInfo
  },
  async getMnemonicByPwd(pwd) {
    try {
      const walletInfo = await getWalletInfoByPwd(pwd)
      if (walletInfo) return Promise.resolve(walletInfo.mnemonic)
    } catch (error) {
      return Promise.reject(error)
    }
  },
  saveWalletInfo,
  async isExistWallet() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const data = await chrome.storage.local.get('walletInfo')
        if (!!!data) return Promise.resolve(false)

        return Promise.resolve(!!data.walletInfo)
      } else {
        if (typeof localStorage !== 'undefined') {
          return Promise.resolve(!!localStorage.getItem('walletInfo'))
        }
      }
    } catch (e) {
      console.error(e)
    }
  },
  isLocked() {
    return !!state.currentWalletInfo
  },
  accountAddNewAddress() {
    const walletInfo = JSON.parse(JSON.stringify(state.currentWalletInfo || {}))
    walletInfo.currentDerivePathIndex = walletInfo.currentDerivePathIndex + 1

    let seed = bip39.mnemonicToSeedSync(walletInfo.mnemonic)
    const bip32 = BIP32Factory(ecc)
    let node = bip32.fromSeed(seed)
    let keyPair = node.derivePath(
      `m/44'/0'/0'/${walletInfo.currentDerivePathIndex}`
    )
    const privateKey = keyPair.toWIF()
    const publicKey = keyPair.publicKey

    const { address } = bitcoin.payments.p2pkh({
      network: IS_PROD ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
      pubkey: publicKey,
    })

    walletInfo.addresses.push({ address, privateKey, publicKey })
    walletInfo.account = account_utils.NewAccount(privateKey)
    walletInfo.account.address = address
    saveWalletInfo(walletInfo.pwd, walletInfo)
  },
  accountImportNewAddress(privateKey) {
    const walletInfo = JSON.parse(JSON.stringify(state.currentWalletInfo || {}))
    if (
      walletInfo.addresses.some(
        ({ privateKey: _privateKey }) => _privateKey === privateKey
      )
    )
      return

    const ECPair = ECPairFactory(ecc)
    let keyPair = ECPair.fromWIF(privateKey)
    if (!keyPair.compressed) {
      keyPair = ECPair.fromPrivateKey(keyPair.privateKey, {
        compressed: true,
      })
    }
    const publicKey = keyPair.publicKey
    const { address } = bitcoin.payments.p2pkh({
      network: IS_PROD ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
      pubkey: publicKey,
    })

    walletInfo.addresses.push({
      address,
      privateKey,
      publicKey,
      imported: true,
    })
    walletInfo.account = account_utils.NewAccount(privateKey)
    walletInfo.account.address = address
    saveWalletInfo(walletInfo.pwd, walletInfo)
  },
  async unLockWithSessionStorage() {
    try {
      let pwd
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const data = await chrome.storage.session.get('pwd')
        pwd = !!data ? data.pwd : undefined
      } else {
        if (typeof sessionStorage !== 'undefined') {
          pwd = sessionStorage.getItem('pwd')
        }
      }
      if (!!!pwd) {
        return Promise.resolve('')
      }
      const account = await unLock(pwd)
      return Promise.resolve(account)
    } catch (error) {}
  },
  unLock,
  changeAddress(address) {
    if (state.currentAccount.address === address) return

    const walletInfo = JSON.parse(JSON.stringify(state.currentWalletInfo || {}))

    walletInfo.account = account_utils.NewAccount(
      walletInfo.addresses.find(({ address: _address }) => address === _address)
        .privateKey
    )
    walletInfo.account.address = address
    state.currentAccount = walletInfo.account
    saveWalletInfo(walletInfo.pwd, walletInfo)

    EE.emit(
      changeCurrentAccountEventName,
      state.currentAccount,
      state.currentWalletInfo.addresses
    )
  },
  changeCurrentAccount(account) {
    state.currentAccount = account

    if (account) {
      if (state.currentAddress !== account.address) {
        this.changeCurrentAddress(account.address)
      }
      EE.emit(
        changeCurrentAccountEventName,
        state.currentAccount,
        state.currentWalletInfo.addresses
      )
    } else {
      this.changeCurrentAddress(null)
    }
  },
  getCurrentAccount() {
    return state.currentAccount
  },
  onChangeCurrentAccount(listener) {
    EE.on(changeCurrentAccountEventName, listener)
  },
  offChangeCurrentAccount(listener) {
    EE.off(changeCurrentAccountEventName, listener)
  },

  changeCurrentAddress(address) {
    state.currentAddress = address
    EE.emit(changeCurrentAddressEventName, state.currentAddress)
  },
  getCurrentAddress() {
    return state.currentAddress
  },
  onChangeCurrentAddress(listener) {
    EE.on(changeCurrentAddressEventName, listener)
  },
  offChangeCurrentAddress(listener) {
    EE.off(changeCurrentAddressEventName, listener)
  },
  onConnectionClose(listener) {
    EE.on(connectionCloseEventName, listener)
  },
  offConnectionClose(listener) {
    EE.off(connectionCloseEventName, listener)
  },
  getLastUsedNetwork() {
    if (typeof localSave === 'undefined') {
      return null
    }
    const key = localSave.getItem('networkKey')
    if (!key) {
      return null
    }
    const networkObj = getNetworkByKey(key)
    return networkObj
  },
  changeCurrentNetwork,
  getApisInstance() {
    return state.apisInstance
  },
  getNodeClient() {
    if (!state.nodeClient) changeCurrentNetwork(networkList[0].key)
    return state.nodeClient
  },
  withApis() {
    const nodeClient = this.getNodeClient()
    if (!nodeClient) {
      return null
    }
    return nodeClient.afterInited()
  },
  withSystemAssets() {
    const nodeClient = this.getNodeClient()
    if (!nodeClient) {
      return null
    }
    if (state.systemAssets.length > 0) {
      return Promise.resolve(state.systemAssets)
    }
    return this.withApis().then(() => {
      return nodeClient.listAssets('', 100).then((assets) => {
        state.systemAssets = assets
        return assets
      })
    })
  },
  getSystemAssets() {
    return state.systemAssets
  },
  getAssetLocal(assetId) {
    if (!state.systemAssets) {
      return null
    }
    for (let asset of state.systemAssets) {
      if (asset.id === assetId) {
        return asset
      }
    }
    return null
  },
  getAssetPrecisionByAssetId(assetId) {
    const asset = this.getAssetLocal(assetId)
    if (asset) {
      return asset.precision
    } else {
      if (assetId === '1.3.0') {
        return 8 // BTC precision
      } else {
        return 8 // default precision
      }
    }
  },
  bindPayId(txid, payId, callback) {
    let payPushApiUrl =
      callback || state.payCallback || 'http://wallet.xps.cash/api'
    payId = payId || state.lastSerialNumber
    if (!payId || !txid) {
      return
    }
    try {
      let xhr = new XMLHttpRequest()
      xhr.onreadystatechange = function() {}
      xhr.open('POST', payPushApiUrl, true)
      xhr.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'BindPayId',
          params: [payId, txid],
        })
      )
    } catch (e) {}
  },
  onChangeCurrentNetwork(listener) {
    EE.on(changeCurrentNetworkEventName, listener)
  },
  offChangeCurrentNetwork(listener) {
    EE.off(changeCurrentNetworkEventName, listener)
  },
  getCurrentNetwork() {
    return state.currentNetwork
  },
  getCurrentNetworkObj() {
    const networkKey = this.getCurrentNetwork()
    return getNetworkByKey(networkKey)
  },
  changeCurrentLanguage(lang) {
    state.currentLanguage = lang
    setStorage(languageConfigStorageKey, lang)
    EE.emit(changeCurrentLanguageEventName, state.currentLanguage)
  },
  onChangeCurrentLanguage(listener) {
    EE.on(changeCurrentLanguageEventName, listener)
  },
  offChangeCurrentLanguage(listener) {
    EE.off(changeCurrentLanguageEventName, listener)
  },
  getCurrentLanguage() {
    return state.currentLanguage
  },
  getAddressPrefix() {
    return ChainConfig.address_prefix
  },
  getTokenExplorerApiUrl() {
    return state.tokenExplorerApiUrl
  },
}
