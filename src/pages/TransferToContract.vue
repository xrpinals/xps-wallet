<template>
  <div>
    <div class="xps-panel xps-transfer-contract-container">
      <div class="-left-side" v-if="step === 'transfer'">
        <el-form
          :model="contractForm"
          status-icon
          ref="contractForm"
          label-width="90pt"
          class="xps-transfer-contract-inner-container"
        >
          <el-form-item
            v-bind:label="$t('contractPage.contract_address')"
            prop="contractAddress"
          >
            <el-input
              class="-input-contract-address"
              v-bind:placeholder="
                $t('contractPage.please_input_contract_address')
              "
              type="text"
              v-model="contractForm.contractAddress"
              style
            ></el-input>
          </el-form-item>
          <AddressOrSelectWalletInput
            :currentAddress="currentAccount && currentAccount.address"
            @change-current-account="onChangeSelectedAccount"
          ></AddressOrSelectWalletInput>
          <el-form-item
            v-bind:label="$t('contractPage.transfer_amount')"
            prop="amount"
          >
            <AssetInput
              class="-input-amount-field"
              v-model="contractForm.amount"
              :precision="
                getAssetPrecisionByAssetId(contractForm.transferAssetId)
              "
              style="width: 167pt;"
            ></AssetInput>
            <el-select
              class="transfer-asset-select"
              v-model="contractForm.transferAssetId"
              v-bind:placeholder="$t('contractPage.please_select')"
            >
              <el-option
                v-for="item in currentAccountBalances"
                :key="item.assetSymbol"
                :label="item.assetSymbol"
                :value="item.assetId"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-bind:label="$t('contractPage.memo_info')" prop="memo">
            <el-input
              class="-input-memo"
              placeholder
              type="text"
              v-model="contractForm.memo"
              style="width: 100pt;"
            ></el-input>
          </el-form-item>
          <el-form-item label="Gas Limit" prop="gasLimit">
            <AssetInput
              class="-input-gas-limit"
              v-model="contractForm.gasLimit"
              :precision="0"
              :min="0"
              :max="2000000"
            ></AssetInput>
          </el-form-item>
          <el-form-item label="Gas Price" prop="gasPrice">
            <AssetInput
              class="-input-gas-price"
              v-model="contractForm.gasPrice"
              :precision="getAssetPrecisionByAssetId('1.3.0')"
              :hasAppend="true"
            >
              <template slot="append">BTC</template>
            </AssetInput>
          </el-form-item>

          <el-form-item class="-control-panel">
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              @click="emulateTransferToContract"
              style="margin-left: -80pt;"
              >{{ $t('contractPage.test') }}</el-button
            >
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              @click="toSubmitTransferToContract"
              style="margin-left: 0;"
              >{{ $t('contractPage.transferWithSpace') }}</el-button
            >
          </el-form-item>
        </el-form>
        <el-dialog
          v-bind:title="$t('dialogs.please_confirm_tx_info')"
          :visible.sync="showConfirmDialog"
          width="300pt"
          height="187pt"
          :show-close="true"
          :before-close="closeConfirmDialog"
          center
        >
          <div>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">
                  {{ $t('contractPage.contract_address') }}
                </div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ contractForm.contractAddress }}
                </div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">
                  {{ $t('contractPage.transfer_amount') }}
                </div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ contractForm.amount }}
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
                <div class="grid-content label-font value-label">0.001BTC</div>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="8">
                <div class="grid-content label-font">
                  {{ $t('contractPage.memo_info') }}
                </div>
              </el-col>
              <el-col :span="16">
                <div
                  class="grid-content label-font value-label"
                  style="text-overflow: ellipsis; overflow-x: hidden;"
                >
                  {{ contractForm.memo }}
                </div>
              </el-col>
            </el-row>
          </div>
          <span slot="footer" class="dialog-footer">
            <el-button
              class="xpswallet-form-btn"
              type="primary"
              @click="doSubmitTransferToContract"
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

      <div class="-right-side">
        <AccountBalancesSidebar
          :accountBalances="currentAccountBalances"
          :defaultLimit="null"
        ></AccountBalancesSidebar>
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
  import SideNavbar from '../components/SideNavbar.vue'
  import AccountBalancesSidebar from '../components/AccountBalancesSidebar.vue'
  import AddressOrSelectWalletInput from '../components/AddressOrSelectWalletInput.vue'
  import AssetInput from '../components/AssetInput.vue'

  let {
    PrivateKey,
    key,
    TransactionBuilder,
    TransactionHelper,
    NodeClient,
  } = xps_js

  export default {
    name: 'TransferToContract',
    components: {
      KeystoreInput,
      SideNavbar,
      AccountBalancesSidebar,
      AddressOrSelectWalletInput,
      AssetInput,
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
          contractAddress: null,
          memo: null,
          amount: null,
          filename: appState.getCurrentAddress(),
          transferAssetId: '1.3.0',
          gasLimit: 10000,
          gasPrice: '0.00001',
          apiResult: null,
        },
        currentAccountBalances: [
          {
            assetId: '1.3.0',
            assetSymbol: 'BTC',
            amount: 0,
            precision: appState.precision,
            amountNu: new BigNumber(0),
          },
        ],
        currentAccountBalance: 0,
        currentAccountInfo: {},
        emulateState: null,
        closeTimeoutMilli: 5000,
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
      const flashTxMessage = appState.getFlashTxOnce()
      if (flashTxMessage) {
        this.onFlashTxMessage(flashTxMessage)
      }
      appState.onPushFlashTxMessage(this.onFlashTxMessage)
    },
    mounted() {
      appState.onChangeCurrentAccount(this.onChangeCurrentAccount)
    },
    beforeDestroy() {
      appState.offChangeCurrentAccount(this.onChangeCurrentAccount)
      appState.offPushFlashTxMessage(this.onFlashTxMessage)
      this.destroyed = true
      if (this.closeTimer) {
        clearTimeout(this.closeTimer)
        this.closeTimer = null
      }
    },
    methods: {
      onFlashTxMessage(txMsg) {
        this.contractForm.transferAssetId = txMsg.currency || '1.3.0'
        this.contractForm.contractAddress = txMsg.to || ''
        this.contractForm.amount = txMsg.valueRaw || ''
        setTimeout(() => {
          this.contractForm.amount = txMsg.valueRaw || ''
        }, 100)
        this.contractForm.memo = txMsg.memo || txMsg.contractArg || ''
        this.contractForm.gasLimit = txMsg.gasLimit || 10000
        this.contractForm.gasPrice = txMsg.gasPrice || '0.00001'
      },
      getAssetPrecisionByAssetId(assetId) {
        return appState.getAssetPrecisionByAssetId(assetId)
      },
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
        this.contractForm.contractAddress = ''
        this.contractForm.apiName = ''
        this.contractForm.apiArg = ''
        this.contractForm.gasLimit = 10000
        this.contractForm.gasPrice = '0.00001'
        this.contractForm.transferAssetId = '1.3.0'
        this.contractForm.apiResult = ''
        this.contractForm.amount = 0
        this.contractForm.memo = ''
        this.step = 'transfer'
      },
      toViewTx(txId) {
        appState.changeCurrentTab('check_tx', [txId])
      },
      closeConfirmDialog() {
        this.showConfirmDialog = false
      },
      emulateTransferToContract() {
        this.emulateState = null
        if (!this.currentAccount) {
          this.showError(
            this.$t('contractPage.please_open_and_unlock_your_wallet_first')
          )
          return
        }
        const contractId = this.contractForm.contractAddress
        if (!contractId) {
          this.showError(this.$t('contractPage.please_input_contract_address'))
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
        if (new BigNumber(gasLimit).isNaN() || gasLimit < 0) {
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
        let amount = this.contractForm.amount
        let amountNu = new BigNumber(amount)
        let assetId = this.contractForm.transferAssetId
        let asset = appState.getAssetLocal(assetId)
        let memo = (this.contractForm.memo || '').trim()
        let amountFull = parseInt(
          amountNu.multipliedBy(Math.pow(10, asset.precision)).toFixed(0)
        )
        const apiArg = this.contractForm.apiArg || ''
        const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey())
        const pubkey = pkey.toPublicKey()
        const nodeClient = appState.getNodeClient()
        appState
          .withApis()
          .then(() => {
            nodeClient
              .transferToContractTesting(
                pubkey,
                contractId,
                amount,
                asset.symbol,
                memo
              )
              .then((data) => {
                const fee = data[0]
                const gasCount = data[1]
                this.contractForm.gasLimit = parseInt(gasCount * 1.1)
                if (this.contractForm.gasLimit === 0) {
                  this.contractForm.gasLimit += 100
                }
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
      toSubmitTransferToContract() {
        this.showConfirmDialog = true
      },
      doSubmitTransferToContract: _.throttle(function() {
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
        const contractId = this.contractForm.contractAddress
        if (!contractId) {
          this.showError(this.$t('contractPage.please_input_contract_address'))
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
        if (new BigNumber(gasLimit).isNaN() || gasLimit < 0) {
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
        let amount = this.contractForm.amount
        let amountNu = new BigNumber(amount)
        let assetId = this.contractForm.transferAssetId
        let asset = appState.getAssetLocal(assetId)
        let memo = (this.contractForm.memo || '').toString().trim()
        let amountFull = parseInt(
          amountNu.multipliedBy(Math.pow(10, asset.precision)).toFixed(0)
        )

        const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey())
        const pubkey = pkey.toPublicKey()
        const callerAddress = this.currentAccount.address
        const nodeClient = appState.getNodeClient()

        appState
          .withApis()
          .then(() => {
            let tr = new TransactionBuilder()
            let op = TransactionHelper.new_transfer_to_contract_operation(
              callerAddress,
              pubkey,
              contractId,
              gasLimit,
              gasPrice,
              assetId,
              amountFull,
              memo
            )
            tr.add_type_operation('transfer_contract', op)
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
                      if (utils.isChromeExtension()) {
                        this.closeTimer = setTimeout(() => {
                          if (!this.destroyed) {
                            window.close()
                          }
                          this.closeTimer = null
                        }, this.closeTimeoutMilli)
                      }
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
    },
  }
</script>

<style lang="less">
  .xps-transfer-contract-container {
    min-width: 400px;
    min-height: 381pt;
    background: inherit;
    width: calc(100% - 117pt);
    float: right;
    padding: 0;
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
      width: 70%;
      background: white;
      min-height: 381pt;
      // padding: 0 20pt;
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
    .-right-side {
      width: calc(30% - 10pt);
      min-width: 215px;
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
    .-transfer-contract-api-result {
      color: #261932;
      font-size: 8pt;
      padding: 20pt;
    }
    .-input-amount {
      width: 170pt !important;
    }
    .-input-gas-price.asset-input-wrapper {
      .el-input {
        width: 170pt !important;
        .el-input__inner {
          width: 170pt !important;
        }
      }
    }
  }

  .chrome-ext-app-container .xps-transfer-contract-container {
    .-input-gas-price.asset-input-wrapper {
      .el-input {
        width: 88pt !important;
        .el-input__inner {
          width: 88pt !important;
        }
      }
    }
  }

  @media (max-width: 960px) {
    .xps-transfer-contract-container {
      .-right-side {
        display: none;
      }
      .-left-side {
        width: 100%;
      }
    }
  }

  .xps-transfer-contract-inner-container,
  .xps-transfer-contract-done-inner-container {
    min-width: 360pt;
    margin: 20pt auto 0 auto;
    // padding-left: 20pt;
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
    .xps-transfer-contract-container {
      padding: 0;
      .el-input {
        width: auto !important;
      }
      .el-form-item {
        max-width: 400px;
      }
      .el-form-item__content {
        margin-left: 10pt;
      }
      .-confirm-contract-address-btn {
        width: 120px;
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
      .xps-transfer-contract-inner-container {
        margin: 0;
        padding: 0;
      }
      .-control-panel {
        width: 400px;
        button {
          max-width: 80px;
        }
      }
    }
  }

  .chrome-ext-app-container {
    .xps-transfer-contract-container {
      .-input-amount {
        width: 88pt !important;
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
        padding-left: 10px;
      }
      .-control-panel {
        .el-form-item__content {
          text-align: center;
        }
      }
      .xps-transfer-contract-inner-container {
        margin: 0 !important;
        padding: 5px 15px !important;
        width: 400px !important;
        .el-form-item__label {
          text-align: left;
        }
      }

      .-input-gas-limit {
        width: 140pt !important;
        .-input-amount {
          width: 140pt !important;
        }
      }
      .-input-amount-field,
      .-input-gas-price {
        width: 88pt !important;
      }
      .-input-gas-price {
        width: 88pt !important;
        .-input-amount {
          width: 88pt !important;
          input {
            width: 88pt !important;
          }
        }
      }
    }
  }
</style>
