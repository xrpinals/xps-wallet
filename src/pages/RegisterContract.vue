<template>
  <div>
    <div class="xps-panel xps-register-contract-container">
      <div class="-left-side" v-if="step === 'transfer'">
        <el-form
          :model="contractForm"
          status-icon
          ref="contractForm"
          label-width="90pt"
          class="xps-register-contract-inner-container"
        >
          <el-form-item
            v-bind:label="$t('contractPage.select_contract_file')"
            prop="keystoreFile"
          >
            <div>
              <FileInput
                @select-file="onSelectContractFile"
                :filename="contractForm.contractFilename"
                :fileFormat="'binary'"
                :accept="'.gpc'"
                :placeholder="
                  $t('contractPage.please_select_contract_gpc_file')
                "
              ></FileInput>
            </div>
          </el-form-item>
          <AddressOrSelectWalletInput
            :currentAddress="currentAccount && currentAccount.address"
            @change-current-account="onChangeSelectedAccount"
            class="-transfer-assert-input"
          ></AddressOrSelectWalletInput>

          <el-form-item v-bind:label="$t('contractPage.balance')" prop="amount">
            <el-input
              class="-input-amount"
              placeholder
              type="text"
              :readonly="true"
              v-model="currentAccountBalance"
              style
            >
              <template slot="append">BTC</template>
            </el-input>
          </el-form-item>
          <el-form-item label="Gas Limit" prop="gasLimit">
            <el-input
              class="-input-gas-limit"
              placeholder
              type="text"
              v-model="contractForm.gasLimit"
              style="width: 100pt;"
            ></el-input>
          </el-form-item>
          <el-form-item label="Gas Price" prop="gasPrice">
            <el-input
              class="-input-gas-price"
              placeholder
              type="text"
              v-model="contractForm.gasPrice"
              style
            >
              <template slot="append">BTC</template>
            </el-input>
          </el-form-item>
          <el-form-item class="-control-panel">
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              @click="emulateDeployContract"
              style="margin-left: -80pt;"
              >{{ $t('contractPage.test') }}</el-button
            >
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              @click="toSubmitDeployContract"
              style="margin-left: 0;"
              >{{ $t('contractPage.submit') }}</el-button
            >
          </el-form-item>
        </el-form>
        <el-dialog
          v-bind:title="$t('dialogs.please_confirm_tx_info')"
          :visible.sync="showConfirmDialog"
          width="300pt"
          height="187pt"
          class="-register-contract-confirm-dialog"
          :show-close="true"
          :before-close="closeConfirmDialog"
          center
        >
          <div>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">Gas Limit</div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ contractForm.gasLimit }}
                </div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">Gas Price</div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ contractForm.gasPrice }}
                </div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">
                  {{ $t('contractPage.fee') }}
                </div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{
                    amountToString(contractForm.fee && contractForm.fee.amount)
                  }}
                  BTC
                </div>
              </el-col>
            </el-row>
          </div>
          <span slot="footer" class="dialog-footer">
            <el-button
              class="xpswallet-form-btn"
              type="primary"
              @click="doSubmitDeployContract"
              >{{ $t('contractPage.confirmWithSpace') }}</el-button
            >
          </span>
        </el-dialog>
      </div>

      <!-- contract_sent panel -->
      <div class="-left-side" v-if="step === 'contract_sent'">
        <div style="color: #261932; font-size: 12pt; margin-top: 30pt;">
          {{ $t('transferPage.tx_making') }}
        </div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #6555DF;">
          <i class="el-icon-loading"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: #261932;">
          <p style="height: auto;">
            {{ $t('transferPage.tx_making_and_will_refresh_after_done') }}
          </p>
          <p>{{ $t('transferPage.you_can_also_query_tx_by_tx_hash') }}</p>
        </div>
        <div>
          <el-button
            type="text"
            style="color: #6555DF; font-size: 10pt;"
            @click="toViewTx(lastSentTxId)"
            >{{ lastSentTxId }}</el-button
          >
        </div>
        <div style="margin-top: 15pt;">
          <el-button class="xpswallet-form-btn" @click="backToTransfer">{{
            $t('contractPage.return')
          }}</el-button>
        </div>
      </div>

      <!-- contract_fail panel -->
      <div class="-left-side" v-if="step === 'contract_fail'">
        <div style="color: #261932; font-size: 12pt; margin-top: 30pt;">
          {{ $t('transferPage.tx_failed') }}
        </div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #FF0000;">
          <i class="el-icon-error"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: red;">
          <p
            style="overflow: hidden; text-overflow: ellipsis; margin: 0 auto; max-width: 80%; max-height: 131pt;"
          >
            {{ transferFailError }}
          </p>
        </div>
        <div style="margin-top: 20pt;">
          <el-button
            type="text"
            style="color: #6555DF; font-size: 10pt;"
            @click="toViewTx(lastSentTxId)"
            >{{ lastSentTxId }}</el-button
          >
        </div>
        <div style="margin-top: 15pt;">
          <el-button class="xpswallet-form-btn" @click="backToTransfer">{{
            $t('contractPage.return')
          }}</el-button>
        </div>
      </div>

      <!-- contract_success panel -->
      <div class="-left-side" v-if="step === 'contract_success'">
        <div style="color: #261932; font-size: 12pt; margin-top: 30pt;">
          {{ $t('transferPage.tx_success') }}
        </div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #00DD00;">
          <i class="el-icon-success"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: #261932;">
          <p>{{ $t('transferPage.tx_on_chain_success') }}</p>
          <p>{{ $t('transferPage.you_can_query_tx_status_on_chain') }}</p>
        </div>
        <div>
          <el-button
            type="text"
            style="color: #6555DF; font-size: 10pt;"
            @click="toViewTx(lastSentTxId)"
            >{{ lastSentTxId }}</el-button
          >
        </div>
        <div style="margin-top: 15pt;">
          <el-button class="xpswallet-form-btn" @click="backToTransfer">{{
            $t('contractPage.return')
          }}</el-button>
        </div>
      </div>
      <div class="clearfix"></div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import appState from '../appState'
  import utils from '../utils'
  import KeystoreInput from '../components/KeystoreInput.vue'
  import FileInput from '../components/FileInput.vue'
  import SideNavbar from '../components/SideNavbar.vue'
  import AddressOrSelectWalletInput from '../components/AddressOrSelectWalletInput.vue'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js

  export default {
    name: 'RegisterContract',
    components: {
      KeystoreInput,
      FileInput,
      SideNavbar,
      AddressOrSelectWalletInput,
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
          contractFilename: '',
          filename: appState.getCurrentAddress(),
          transferAssetId: '1.3.0',
          gasLimit: 10000,
          gasPrice: '0.00001',
          contractGpcHex: null,
        },
        currentAccountBalances: [],
        currentAccountBalance: 0,
        currentAccountInfo: {},
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
      onSelectContractFile(fileBytes, filename) {
        this.contractForm.contractFilename = filename
        let gpcHex = utils.bytesToHex(fileBytes)
        this.contractForm.contractGpcHex = gpcHex
      },
      onChangeSelectedAccount(account) {
        this.currentAccount = account
        this.currentAddress = account.address
        this.loadCurrentAccountInfo()
      },
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
                  if (asset.id === '1.3.0') {
                    this.currentAccountBalance = item.amountNu.toFixed(
                      asset.precision
                    )
                  }
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
        this.contractForm.filename = ''
        this.contractForm.gasLimit = 10000
        this.contractForm.gasPrice = '0.00001'
        this.contractForm.transferAssetId = '1.3.0'
        this.contractForm.apiResult = ''
        this.step = 'transfer'
      },
      toViewTx(txId) {
        appState.changeCurrentTab('check_tx', [txId])
      },
      closeConfirmDialog() {
        this.showConfirmDialog = false
      },
      emulateDeployContract() {
        this.emulateState = null
        if (!this.currentAccount) {
          this.showError(
            this.$t('contractPage.please_open_and_unlock_your_wallet_first')
          )
          return
        }
        const gpcHex = this.contractForm.contractGpcHex
        if (!gpcHex) {
          this.showError(
            this.$t('contractPage.please_select_contract_file_first')
          )
          return
        }
        const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey())
        const pubkey = pkey.toPublicKey()
        const nodeClient = appState.getNodeClient()
        appState
          .withApis()
          .then(() => {
            nodeClient
              .registerContractTesting(pubkey, gpcHex)
              .then((data) => {
                const fee = data[0]
                const gasCount = data[1]
                this.contractForm.gasLimit = parseInt(gasCount * 1.1)
                this.contractForm.fee = fee
                this.emulateState = 'success'
                this.showSuccess('Emulate successfully')
              })
              .catch((e) => {
                this.emulateState = 'error'
                this.showError(e)
              })
          })
          .catch(this.showError)
      },
      toSubmitDeployContract() {
        this.showConfirmDialog = true
      },
      doSubmitDeployContract: _.throttle(function() {
        this.showConfirmDialog = false
        if (this.emulateState !== 'success') {
          this.showError(this.$t('contractPage.please_emulate_first'))
          return
        }
        if (!this.currentAccount) {
          this.showError(
            this.$t('contractPage.please_open_and_unlock_your_wallet_first')
          )
          return
        }
        const gpcHex = this.contractForm.contractGpcHex
        if (!gpcHex) {
          this.showError(
            this.$t('contractPage.please_select_contract_file_first')
          )
          return
        }
        const gasLimit = parseInt(this.contractForm.gasLimit)
        const gasPriceNu = new BigNumber(this.contractForm.gasPrice)
        if (gasPriceNu.isNaN()) {
          this.showError(this.$t('contractPage.invalid_gas_price_format'))
          return
        }
        const gasPrice = parseInt(
          gasPriceNu.multipliedBy(Math.pow(10, appState.precision)).toFixed(0)
        )
        if (!gasLimit || gasLimit <= 0) {
          this.showError(this.$t('contractPage.invalid_gas_limit_format'))
          return
        }
        if (gasLimit > 1000000) {
          this.showError(this.$t('contractPage.too_large_gas_limit'))
          return
        }
        if (!gasPrice || gasPrice <= 0) {
          this.showError(this.$t('contractPage.invalid_gas_price_format'))
          return
        }
        const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey())
        const pubkey = pkey.toPublicKey()
        const callerAddress = this.currentAccount.address
        const nodeClient = appState.getNodeClient()
        appState
          .withApis()
          .then(() => {
            let tr = new TransactionBuilder()
            let op = TransactionHelper.new_contract_register_operation_from_gpc(
              callerAddress,
              pubkey,
              gasLimit,
              gasPrice,
              gpcHex
            )
            tr.add_type_operation('contract_register', op)
            tr.set_expire_seconds(500)
            return tr.set_required_fees().then(() => {
              return tr.finalize().then(() => tr)
            })
          })
          .then((tr) => {
            tr.add_signer(pkey, pubkey)
            tr.sign()
            let txid = tr
              .sha256(tr.tr_buffer)
              .toString('hex')
              .substr(0, 40)
            this.lastSentTxId = txid

            appState.bindPayId(txid)

            if (typeof messageToBackground !== 'undefined') {
              messageToBackground('txhash', txid)
            }
            tr.broadcast(function() {})
              .then(() => {
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
            this.step = 'contract_sent'
          })
          .catch(this.showError)
      }, 1000),
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
      amountToString(val) {
        return utils.amountToString(val)
      },
    },
  }
</script>

<style lang="less">
  .xps-register-contract-container {
    min-width: 400px;
    min-height: 381pt;
    background: inherit;
    padding-top: 0;
    width: calc(100% - 117pt);
    padding: 0;
    float: right;
    .-nav-side {
      margin-top: 4pt;
    }
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
      width: 100%;
      background: white;
      min-height: 381pt;
      padding: 0 20pt;
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
    .-register-contract-confirm-dialog {
      .grid-content {
        text-align: center;
      }
    }
    .xps-address-or-select-wallet-input {
      .-address-show-label {
        padding-left: 120pt;
      }
    }
  }

  @media (max-width: 960px) {
    .xps-register-contract-container {
      .-right-side {
        display: none;
      }
      .-left-side {
        width: 100%;
      }
    }
  }

  .xps-register-contract-inner-container,
  .xps-register-contract-done-inner-container {
    min-width: 400pt;
    max-width: 100%;
    margin: 20pt auto 0 auto;
    padding-left: 20pt;
    label {
      font-size: 10pt;
      color: #261932;
    }
    .el-form-item__label {
      text-align: left;
    }
    .el-input {
      width: 220pt !important;
    }
    .el-input-group--append {
      width: 220pt !important;
    }
    .el-input-group__append {
      border-top: 0;
      border-right: 0;
      border-radius: 0;
      background: white;
      border-bottom: solid 1px #cccccc !important;
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
    .xps-register-contract-container {
      padding: 0;
      .el-input {
        width: auto !important;
      }
      .el-form-item__content {
        margin-left: 10pt;
      }
      .el-form-item {
        max-width: 400px;
      }
      .-confirm-contract-address-btn {
        width: 120px;
      }
      .xps-address-or-select-wallet-input {
        max-width: 375px;
        .el-form-item__content {
          margin-left: 0 !important;
        }
        .address-show-label {
          float: right !important;
          padding-left: 0 !important;
        }
        .-change-wallet-btn {
          float: right !important;
        }
      }

      .-contract-address-panel {
        max-width: 375px;
      }
      .-contract-api-panel {
      }
      .-contract-arg-panel {
      }
      .-left-side {
        padding-left: 0;
      }
      .xps-register-contract-inner-container {
        margin: 0;
        padding: 5px 15px;
      }
      .-control-panel {
        width: 400px;
        button {
          max-width: 80px;
        }
      }
    }
    .xps-register-contract-container
      .xps-address-or-select-wallet-input
      .-address-show-label {
      padding-left: 0;
    }
  }

  .chrome-ext-app-container {
    .xps-register-contract-container {
      .xps-register-contract-inner-container {
        margin: 0 !important;
        padding: 5px 15px !important;
        width: 400px !important;
      }
      .-input-amount {
        width: 140pt !important;
      }

      .el-form-item__label {
        width: 75pt !important;
      }
      .el-form-item__content {
        margin-left: 75pt !important;
        padding-left: 20px;
        text-align: left;
      }
      .-change-wallet-btn,
      .-address-show-label {
        padding-left: 10px !important;
        text-align: left;
        float: none !important;
      }
      .-control-panel {
        .el-form-item__content {
          text-align: center;
        }
      }
    }
  }
</style>
