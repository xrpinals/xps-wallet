import appState from '../../appState'
import tokenRpc from '../../rpc/token'
import utils from '../../utils'

const state = {
  account: {
    accountInfos: {}, // address => accountInfo
    accountIdInfos: {}, // accountId => accountInfo
    citizenInfos: {}, // citizenId => citizenInfo
    addressBalances: {}, // address => balances
    addressPayBackBalances: {}, // address => payBackBalances
    addressTokenBalances: {}, // address => tokenBalances
    accountNames: {}, // accountName => accountInfo
    accountLockBalances: {}, // accountId => lockBalances
  },
}

const mutations = {
  CHANGE_ACCOUNT_INFO(state, { address, accountInfo }) {
    state.account.accountInfos[address] = accountInfo
    if (navigator.onLine && window.localStorage) {
      utils.localSetItem(`accountInfo.${address}`, accountInfo)
    }
  },
  CHANGE_ACCOUNT_ID_INFO(state, { accountId, accountInfo }) {
    state.account.accountIdInfos[accountId] = accountInfo
    if (navigator.onLine && window.localStorage) {
      utils.localSetItem(`accountIdInfos.${accountId}`, accountInfo)
    }
  },
  CHANGE_CITIZEN_INFO(state, { citizenId, citizenInfo }) {
    state.account.citizenInfos[citizenId] = citizenInfo
    if (navigator.onLine && window.localStorage) {
      utils.localSetItem(`citizenInfos.${citizenId}`, citizenInfo)
    }
  },
  CHANGE_ADDRESS_BALANCES(state, { address, balances }) {
    state.account.addressBalances[address] = balances
    if (navigator.onLine && window.localStorage) {
      utils.localSetItem(`addressBalances.${address}`, balances)
    }
  },
  CHANGE_ADDRESS_PAY_BACK_BALANCES(state, { address, balances }) {
    state.account.addressPayBackBalances[address] = balances
    if (navigator.onLine && window.localStorage) {
      utils.localSetItem(`addressPayBackBalances.${address}`, balances)
    }
  },
  CHANGE_ADDRESS_TOKEN_BALANCES(state, { address, tokenBalances }) {
    state.account.addressTokenBalances[address] = tokenBalances
    if (navigator.onLine && window.localStorage) {
      utils.localSetItem(`addressTokenBalances.${address}`, tokenBalances)
    }
  },
  CHANGE_ACCOUNT_NAME_INFO_MAPPING(state, { name, account }) {
    state.account.accountNames[name] = account
    if (navigator.onLine && window.localStorage) {
      utils.localSetItem(`accountNames.${name}`, account)
    }
  },
  CHANGE_ACCOUNT_LOCK_BALANCES(state, { accountId, lockBalances }) {
    state.account.accountLockBalances[accountId] = lockBalances
    if (navigator.onLine && window.localStorage) {
      utils.localSetItem(`accountLockBalances.${accountId}`, lockBalances)
    }
  },
}

const actions = {
  changeAccountInfo({ commit }, accountInfo) {
    commit('CHANGE_ACCOUNT_INFO', { address: accountInfo.address, accountInfo })
  },
  getAccountInfo({ commit, state }, address) {
    if (!navigator.onLine) {
      if (window.localStorage) {
        const result = utils.localGetItem(`accountInfo.${address}`)
        if (result) {
          commit('CHANGE_ACCOUNT_INFO', { address, accountInfo: result })
          return Promise.resolve(result)
        }
      }
      return Promise.reject('connection failed')
    }
    const nodeClient = appState.getNodeClient()
    return appState.withSystemAssets().then(() => {
      return nodeClient.getAccountByAddresss(address).then((accountInfo) => {
        if (accountInfo) {
          commit('CHANGE_ACCOUNT_INFO', { address, accountInfo })
        } else {
          commit('CHANGE_ACCOUNT_INFO', { address, accountInfo: null })
        }
        return accountInfo
      })
    })
  },
  getAccountById({ commit, state }, accountId) {
    if (!navigator.onLine) {
      if (window.localStorage) {
        const result = utils.localGetItem(`accountInfo.${accountId}`)
        if (result) {
          commit('CHANGE_ACCOUNT_ID_INFO', { accountId, accountInfo: result })
          return Promise.resolve(result)
        }
      }
      return Promise.reject('connection failed')
    }
    const nodeClient = appState.getNodeClient()
    return appState.withSystemAssets().then(() => {
      return nodeClient.getAccount(accountId).then((accountInfo) => {
        if (accountInfo) {
          commit('CHANGE_ACCOUNT_ID_INFO', { accountId, accountInfo })
        } else {
          commit('CHANGE_ACCOUNT_ID_INFO', { accountId, accountInfo: null })
        }
        return accountInfo
      })
    })
  },
  getCitizenInfo({ commit, state }, citizenId) {
    if (!navigator.onLine) {
      if (window.localStorage) {
        const result = utils.localGetItem(`citizenInfos.${citizenId}`)
        if (result) {
          commit('CHANGE_CITIZEN_INFO', { citizenId, citizenInfo: result })
          return Promise.resolve(result)
        }
      }
      return Promise.reject('connection failed')
    }
    const nodeClient = appState.getNodeClient()
    return appState.withSystemAssets().then(() => {
      return nodeClient.getCitizen(citizenId).then((citizenInfo) => {
        if (citizenInfo) {
          commit('CHANGE_CITIZEN_INFO', { citizenId, citizenInfo })
        } else {
          commit('CHANGE_CITIZEN_INFO', { citizenId, citizenInfo: null })
        }
        return citizenInfo
      })
    })
  },
  getAddressBalances({ commit, state }, address) {
    if (!navigator.onLine) {
      if (window.localStorage) {
        const result = utils.localGetItem(`addressBalances.${address}`)
        if (result) {
          for (let item of result) {
            item.amountNu = new BigNumber(item.amountNu)
          }
          commit('CHANGE_ADDRESS_BALANCES', { address, balances: result })
          return Promise.resolve(result)
        }
      }
      return Promise.reject('connection failed')
    }

    const nodeClient = appState.getNodeClient()
    let assets = null
    return appState
      .withSystemAssets()
      .then((systemAssets) => {
        assets = systemAssets
        return nodeClient.getAddrBalances(address)
      })
      .then((balances) => {
        const accountBalances = []
        for (let asset of assets) {
          let balance = balances.filter((b) => b.asset_id === asset.id)[0]
          let item = {
            assetId: asset.id,
            assetSymbol: asset.symbol,
            amount: balance ? balance.amount : 0,
            precision: asset.precision,
            amountNu: balance
              ? new BigNumber(balance.amount).div(Math.pow(10, asset.precision))
              : new BigNumber(0),
          }
          accountBalances.push(item)
        }
        if (accountBalances.length === 0) {
          accountBalances.push(utils.emptyBalance)
        }
        return accountBalances
      })
      .then((accountBalances) => {
        commit('CHANGE_ADDRESS_BALANCES', {
          address,
          balances: accountBalances,
        })
        return accountBalances
      })
  },
  getAddressPayBackBalances({ commit, state }, address) {
    if (!navigator.onLine) {
      if (window.localStorage) {
        const result = utils.localGetItem(`addressPayBackBalances.${address}`)
        if (result) {
          for (let item of result) {
            item.amountBn = new BigNumber(item.amountBn)
          }
          commit('CHANGE_ADDRESS_PAY_BACK_BALANCES', {
            address,
            balances: result,
          })
          return Promise.resolve(result)
        }
      }
      return Promise.reject('connection failed')
    }

    const nodeClient = appState.getNodeClient()
    let assets = null
    let assetById = (assetId) => {
      for (const asset of assets) {
        if (asset.id === assetId) {
          return asset
        }
      }
      return {}
    }
    return appState
      .withSystemAssets()
      .then((systemAssets) => {
        assets = systemAssets
        return nodeClient.getAddressPayBackBalance(address)
      })
      .then((payBacks) => {
        const accountPayBacks = []
        for (let item of payBacks) {
          const assetId = item[1].asset_id
          const asset = assetById(assetId)
          if (!asset) {
            continue
          }
          const amount = item[1].amount
          const amountBn = new BigNumber(amount).div(
            Math.pow(10, asset.precision)
          )
          const amountBnStr = amountBn.toFixed(asset.precision)
          const obj = {
            citizenName: item[0],
            asset: asset,
            assetId: assetId,
            amount: amount,
            amountBn: amountBn,
            amountBnStr: amountBnStr,
          }
          accountPayBacks.push(obj)
        }
        return accountPayBacks
      })
      .then((accountPayBacks) => {
        commit('CHANGE_ADDRESS_PAY_BACK_BALANCES', {
          address,
          balances: accountPayBacks,
        })
        return accountPayBacks
      })
  },
  getAddressTokenBalances({ commit, state }, address) {
    if (!navigator.onLine) {
      if (window.localStorage) {
        const result = utils.localGetItem(`addressTokenBalances.${address}`)
        if (result) {
          commit('CHANGE_ADDRESS_TOKEN_BALANCES', {
            address,
            tokenBalances: result,
          })
          return Promise.resolve(result)
        }
      }
      return Promise.reject('connection failed')
    }
    return tokenRpc
      .listUserTokenBalances(appState.getTokenExplorerApiUrl(), address, 100, 0)
      .then((data) => {
        const res = data.data.listUserTokenBalances
        const tokenBalances = res.items
        commit('CHANGE_ADDRESS_TOKEN_BALANCES', { address, tokenBalances })
        return tokenBalances
      })
  },
  getAccountByName({ commit, state }, name, useCache) {
    if (!navigator.onLine || useCache) {
      if (window.localStorage) {
        const result = utils.localGetItem(`accountNames.${name}`)
        if (result) {
          commit('CHANGE_ACCOUNT_NAME_INFO_MAPPING', { name, account: result })
          return Promise.resolve(result)
        }
      }
      if (!navigator.onLine) {
        return Promise.reject('connection failed')
      }
    }
    const nodeClient = appState.getNodeClient()
    return appState
      .withSystemAssets()
      .then(() => {
        return nodeClient.getAccountByName(name)
      })
      .then((account) => {
        commit('CHANGE_ACCOUNT_NAME_INFO_MAPPING', { name, account })
        return account
      })
  },
  getAccountLockBalances({ commit, state }, accountId) {
    if (!navigator.onLine) {
      if (window.localStorage) {
        const result = utils.localGetItem(`accountLockBalances.${accountId}`)
        if (result) {
          for (let item of result) {
            item.lock_asset_amount_nu = new BigNumber(item.lock_asset_amount_nu)
          }
          commit('CHANGE_ACCOUNT_LOCK_BALANCES', {
            accountId,
            lockBalances: result,
          })
          return Promise.resolve(result)
        }
      }
      return Promise.reject('connection failed')
    }

    const nodeClient = appState.getNodeClient()
    let assets = null
    let assetById = (assetId) => {
      for (const asset of assets) {
        if (asset.id === assetId) {
          return asset
        }
      }
      return {}
    }
    return appState
      .withSystemAssets()
      .then((systemAssets) => {
        assets = systemAssets
        return nodeClient.getAccountLockBalances(accountId)
      })
      .then((balances) => {
        const accountLockBalances = []
        for (let item of balances) {
          const asset = assetById(item.lock_asset_id)
          if (!asset) {
            continue
          }
          item.lock_asset_amount_nu = new BigNumber(item.lock_asset_amount).div(
            Math.pow(10, asset.precision)
          )
          item.lock_asset_amount_str = item.lock_asset_amount_nu.toFixed(
            asset.precision
          )
          accountLockBalances.push(item)
        }
        return accountLockBalances
      })
      .then((accountLockBalances) => {
        commit('CHANGE_ACCOUNT_LOCK_BALANCES', {
          accountId,
          lockBalances: accountLockBalances,
        })
        return accountLockBalances
      })
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
