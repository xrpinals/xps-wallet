<template>
  <div>
    <div class="xps-main-container xps-contract-container">
      <div class="-nav-side">
        <SideNavbar
          :items="navbarItems"
          :selectedKey="selectedNavbarItem"
          @select-item="onSelectNavbarItem"
        ></SideNavbar>
      </div>
      <RegisterContract
        v-if="selectedNavbarItem === 'deploy'"
      ></RegisterContract>
      <InvokeContract v-if="selectedNavbarItem === 'invoke'"></InvokeContract>
      <TransferToContract
        v-if="selectedNavbarItem === 'transfer'"
      ></TransferToContract>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import appState from '../appState'
  import utils from '../utils'
  import KeystoreInput from '../components/KeystoreInput.vue'
  import SideNavbar from '../components/SideNavbar.vue'
  import TransferToContract from './TransferToContract.vue'
  import RegisterContract from './RegisterContract.vue'
  import InvokeContract from './InvokeContract.vue'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js

  export default {
    name: 'Contract',
    components: {
      KeystoreInput,
      SideNavbar,
      RegisterContract,
      InvokeContract,
      TransferToContract,
    },
    data() {
      return {
        lastSentTxId: null,
        transferFailError: null,
        showConfirmDialog: false,
        step: 'transfer', // transfer, contract_sent, contract_success, contract_fail
        walletUnlocked: false,
        hideZeroAssets: true,
        contractForm: {
          filename: appState.getCurrentAddress(),
          transferAssetId: '1.3.0',
        },
        currentAccountBalances: [],
        currentAccountInfo: {},

        navbarItems: [
          { key: 'deploy', label: 'contractPage.deploy_nav' },
          { key: 'invoke', label: 'contractPage.invoke_nav' },
          { key: 'transfer', label: 'contractPage.transfer_to_contract_nav' },
        ],
        selectedNavbarItem: 'invoke',
      }
    },
    created() {
      let account = appState.getCurrentAccount()
      this.currentAccount = account
      if (account) {
        this.walletUnlocked = true
        this.currentAddress = account.address
        this.loadCurrentAccountInfo()
      } else {
        this.walletUnlocked = false
      }
      const tabParams = appState.getCurrentTabParams()
      if (tabParams && tabParams.length > 0) {
        const type = tabParams[0]
        const arg = tabParams[1]
        if (type === 'transfer_to_contract') {
          this.selectedNavbarItem = 'transfer'
        }
      }
    },
    mounted() {
      appState.onChangeCurrentAccount(this.onChangeCurrentAccount)
    },
    beforeDestroy() {
      appState.offChangeCurrentAccount(this.onChangeCurrentAccount)
    },
    methods: {
      showError(e) {
        e = utils.getShowErrorMessage(e)
        this.$message({
          showClose: true,
          message: e,
          type: 'error',
        })
      },
      showInfo(info) {
        this.$message({
          showClose: true,
          message: (info || 'info').toString(),
        })
      },
      showSuccess(info) {
        this.$message({
          showClose: true,
          message: (info || 'success').toString(),
          type: 'success',
        })
      },
      onSelectNavbarItem(item) {
        this.selectedNavbarItem = item.key
      },
      onSelectKeystoreFile(keyJson, filename) {},
      loadCurrentAccountInfo() {
        if (!this.currentAccount) {
          return
        }
        const nodeClient = appState.getNodeClient()
        appState
          .withSystemAssets()
          .then((assets) => {
            return nodeClient
              .getAddrBalances(this.currentAccount.address)
              .then((balances) => {
                this.currentAccountBalances.length = 0
                for (let asset of assets) {
                  let balance = balances.filter(
                    (b) => b.asset_id === asset.id
                  )[0]
                  let item = {
                    assetId: asset.id,
                    assetSymbol: asset.symbol,
                    amount: balance ? balance.amount : 0,
                    precision: asset.precision,
                    amountNu: balance
                      ? new BigNumber(balance.amount).div(
                          Math.pow(10, asset.precision)
                        )
                      : new BigNumber(0),
                  }
                  this.currentAccountBalances.push(item)
                }
                return balances
              })
          })
          .then(() => {
            return nodeClient
              .getAccountByAddresss(this.currentAddress)
              .then((accountInfo) => {
                if (accountInfo) {
                  this.currentAccountInfo = accountInfo
                } else {
                  this.currentAccountInfo = {}
                }
              })
          })
          .catch(this.showError.bind(this))
      },
      onChangeCurrentAccount(account) {
        this.currentAccount = account
        this.currentAddress = account.address
      },
      updateCurrentAccountBalances(balances) {
        this.currentAccountBalances = balances
      },
      backToTransfer() {
        this.contractForm = {
          filename: appState.getCurrentAddress(),
          transferAssetId: '1.3.0',
        }
        this.step = 'transfer'
      },
      toViewTx(txId) {
        appState.changeCurrentTab('check_tx', [txId])
      },
      transfer() {
        let form = this.contractForm
        let toAddress = (form.toAddress || '').trim()
        let amount = form.amount
        let amountNu = new BigNumber(amount)
        let assetId = form.transferAssetId
        let asset = appState.getAssetLocal(assetId)
        let feeAsset = appState.getAssetLocal('1.3.0')
        let fee = new BigNumber('0.001')
        let memo = (form.memo || '').trim()
        if (
          !toAddress ||
          toAddress.length < 20 ||
          toAddress.indexOf(appState.getAddressPrefix()) !== 0
        ) {
          this.showError(this.$t('transferPage.invalid_to_address_format'))
          return
        }
        if (amountNu.isNaN() || amountNu.lte(0)) {
          this.showError(this.$t('transferPage.invalid_transfer_amount_format'))
          return
        }
        if (
          !utils.haveEnoughBalance(
            amountNu,
            assetId,
            fee,
            this.currentAccountBalances
          )
        ) {
          this.showError(this.$t('transferPage.not_enough_balance'))
          return
        }
        this.showConfirmDialog = true
      },
      closeConfirmDialog() {
        this.showConfirmDialog = false
      },
      doTransfer() {
        this.showConfirmDialog = false
        let form = this.contractForm
        let toAddress = (form.toAddress || '').trim()
        let amount = form.amount
        let amountNu = new BigNumber(amount)
        let assetId = form.transferAssetId
        let asset = appState.getAssetLocal(assetId)
        let memo = (form.memo || '').trim()
        let amountFull = parseInt(
          amountNu.multipliedBy(Math.pow(10, asset.precision)).toFixed(0)
        )
        const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey())
        const pubKey = pkey.toPublicKey()
        let nodeClient = appState.getNodeClient()
        appState
          .withApis()
          .then(() => {
            let tr = new TransactionBuilder()
            let op = TransactionHelper.new_transfer_operation(
              this.currentAccount.address,
              toAddress,
              amountFull,
              assetId,
              memo
            )
            tr.add_type_operation('transfer', op)
            tr.set_expire_seconds(500)
            return tr.set_required_fees().then(() => {
              return tr.finalize().then(() => tr)
            })
          })
          .then((tr) => {
            tr.add_signer(pkey, pubKey)
            tr.sign()
            let txid = tr
              .sha256(tr.tr_buffer)
              .toString('hex')
              .substr(0, 40)
            this.lastSentTxId = txid
            if (typeof messageToBackground !== 'undefined') {
              messageToBackground('txhash', txid)
            }
            tr.broadcast(function() {})
              .then(() => {
                this.step = 'contract_sent'
                setTimeout(() => {
                  this.getTransaction(txid)
                    .then((tx) => {
                      this.step = 'contract_success'
                      this.loadCurrentAccountInfo()
                    })
                    .catch((e) => {
                      this.step = 'contract_fail'
                      this.transferFailError = this.$t(
                        'contractPage.tx_not_on_chain_please_query_later'
                      )
                    })
                }, 6000)
              })
              .catch((e) => {
                this.step = 'contract_fail'
                this.transferFailError = e.toString()
              })
          })
          .catch(this.showError)
      },
      getTransaction(txid) {
        const nodeClient = appState.getNodeClient()
        return appState.withApis().then(() => {
          return nodeClient.getTransactionById(txid)
        })
      },
      filterBalances(balances, skipZero = false, limit = null) {
        let filtered = balances
        if (skipZero) {
          filtered = balances.filter((item) => item.amount > 0)
        }
        if (limit) {
          filtered = filtered.slice(0, limit)
        }
        return filtered
      },
    },
  }
</script>

<style lang="less">
  .xps-contract-container {
    min-width: 400px;
    min-height: 381pt;
    background: inherit;
    padding-top: 0;
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
    .-nav-side {
      width: 110pt;
      float: left;
      margin-right: 6pt;
    }
    .-left-side {
      width: calc(70% - 116pt);
      float: left;
      background: white;
      min-height: 381pt;
    }
    .-right-side {
      width: calc(30% - 10pt);
      min-width: 250px;
      float: right;
      text-align: left;
      background: white;
      min-height: 381pt;
      margin-left: 10pt;
      padding: 20pt;
    }
    .-asset-symbol-label {
      color: #a99eb4;
      font-size: 7pt;
    }
    .-asset-amount-label {
      color: #261932;
      font-size: 8pt;
      padding-top: 4pt;
      overflow-x: hidden;
      padding-left: 2px;
      padding-right: 2px;
    }
    .-address-row {
      padding-bottom: 10px;
      border-bottom: solid 1px #f3f3f3;
    }
    .-balance-label-row {
      padding-top: 10px;
      padding-bottom: 20px;
    }
    .-account-balances-panel {
      position: relative;
    }
    .-account-balance {
      display: block;
      float: left;
      width: 55pt;
      padding-bottom: 15px;
      text-align: center;
    }
    .transfer-asset-select {
      .el-input {
        width: 40pt !important;
        font-size: 8pt;
        margin-left: 10pt;
        input {
          font-size: 8pt;
          padding: 0;
          text-indent: 5pt;
        }
        .el-input__suffix {
          font-size: 8pt;
          width: 15pt;
        }
      }
    }
    .el-form-item__label {
      color: #a99eb4;
      font-size: 8pt;
    }
    .value-label {
      color: #261932;
      font-size: 8pt;
    }
  }

  @media (max-width: 960px) {
    .xps-contract-container {
      .-right-side {
        display: none;
      }
      .-left-side {
        width: 100%;
      }
    }
  }

  .xps-contract-inner-container,
  .xps-contract-done-inner-container {
    width: 400pt;
    max-width: 100%;
    margin: 20pt auto 0 auto;
    label {
      font-size: 10pt;
      color: #261932;
    }
    .el-input {
      width: 220pt !important;
    }
    .el-input__inner {
      border: 0 !important;
      border-bottom: solid 1px #cccccc !important;
      border-radius: 0 !important;
    }
    .-transfer-title {
      font-size: 20pt;
      color: #261932;
    }
    .-wallet-password-rule-desc,
    .-rule-panel {
      font-size: 8pt;
      color: #ff0000;
      margin-top: 10pt;
      margin-left: 50pt;
      text-align: left;
      p {
        padding: 0;
        margin: 4px;
        line-height: 18px;
        height: 18px;
      }
    }
  }
  @media (max-width: 600px) {
    .xps-contract-container {
      .-nav-side {
        float: none;
        // width: 100%;
        // margin: 0 20pt;
        width: 460px;
        padding: 0 30px;
        margin: 0;
        .xps-nav-side {
          width: 400px;
          margin-left: 0 auto;
          .xps-nav-item {
            float: left;
            margin: 0 5pt;
          }
        }
      }
      .xps-invoke-contract-container {
        float: none;
      }
      .xps-register-contract-container {
        float: none;
      }
      .xps-transfer-contract-container {
        float: none;
      }
    }
  }

  .chrome-ext-app-container {
    .xps-contract-container {
      .-change-wallet-btn {
        padding-left: 50pt;
      }
      .el-input {
        width: 140pt !important;
      }
    }
  }
</style>
