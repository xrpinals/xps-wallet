<template>
  <div>
    <div class="xps-main-container xps-transfer-container">
      <div class="-left-side" v-if="step === 'withdraw'">
        <el-form
          :model="transferForm"
          status-icon
          ref="transferForm"
          label-width="60pt"
          class="xps-transfer-inner-container"
        >
          <AddressOrSelectWalletInput
            :currentAddress="currentAccount && currentAccount.address"
            @change-current-account="onChangeSelectedAccount"
          ></AddressOrSelectWalletInput>

          <el-form-item v-bind:label="$t('accountBalances.wallet_balance')">
            <div style="padding-left: 15px;" class="grid-content">
              <div
                style="display: flex;align-items: center;gap:15px;flex-wrap: wrap;"
              >
                <div
                  v-for="balance in filterBalances(
                    currentAccountBalances,
                    hideZeroAssets,
                    null
                  )"
                  class="-account-balance"
                  :key="balance.assetSymbol"
                >
                  <div class="-asset-symbol-label">
                    {{ balance.assetSymbol }}
                  </div>
                  <div class="-asset-amount-label">
                    {{ balance.amountNu.toFixed(balance.precision) }}
                  </div>
                </div>
              </div>
            </div>
          </el-form-item>

          <el-form-item
            v-bind:label="$t('transferPage.send_to_address')"
            prop="toAddress"
          >
            <el-input
              class="-input-to-address"
              v-bind:placeholder="
                $t('transferPage.please_input_to_address_or_account_name')
              "
              type="text"
              v-model="transferForm.toAddress"
              style
            ></el-input>
          </el-form-item>
          <el-form-item
            v-bind:label="$t('transferPage.transfer_amount')"
            prop="amount"
          >
            <div style="display: flex;align-items: center;">
              <AssetInput
                style="flex: 1;"
                v-model="transferForm.amount"
                :precision="
                  getAssetPrecisionByAssetId(transferForm.transferAssetId)
                "
              ></AssetInput>
              <el-select
                style="flex-shrink: 0;"
                class="transfer-asset-select"
                v-model="transferForm.transferAssetId"
                v-bind:placeholder="$t('transferPage.please_select')"
              >
                <el-option
                  v-for="item in currentAccountBalances"
                  :key="item.assetSymbol"
                  :label="item.assetSymbol"
                  :value="item.assetId"
                ></el-option>
              </el-select>
            </div>
          </el-form-item>
          <el-form-item v-bind:label="$t('transferPage.fee')" prop="feeAmount">
            <span class="label-font">{{ fee }} BTC</span>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              v-on:click="transfer"
              style="margin-left: -50pt;"
              >{{ $t('transferPage.withdraw_right_now') }}</el-button
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
                  {{ $t('transferPage.to_address') }}
                </div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ transferForm.toAddress }}
                </div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">
                  {{ $t('transferPage.transfer_amount_in_dialog') }}
                </div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ transferForm.amount }}
                </div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">
                  {{ $t('transferPage.fee') }}
                </div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ fee }} BTC
                </div>
              </el-col>
            </el-row>
          </div>
          <span slot="footer" class="dialog-footer">
            <el-button
              class="xpswallet-form-btn"
              type="primary"
              @click="doWithdraw"
              >{{ $t('dialogs.confirm') }}</el-button
            >
          </span>
        </el-dialog>
      </div>

      <!-- transfer_sent panel -->
      <div class="-left-side" v-if="step === 'withdraw_sent'">
        <div style="color: #261932; font-size: 12pt; margin-top: 30pt;">
          {{ $t('transferPage.tx_making') }}
        </div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #6555DF;">
          <i class="el-icon-loading"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: #261932;">
          <p>{{ $t('transferPage.tx_making_and_will_refresh_after_done') }}</p>
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
            $t('transferPage.back')
          }}</el-button>
        </div>
      </div>

      <!-- transfer_fail panel -->
      <div class="-left-side" v-if="step === 'withdraw_fail'">
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
            $t('transferPage.back')
          }}</el-button>
        </div>
      </div>

      <!-- transfer_success panel -->
      <div class="-left-side" v-if="step === 'withdraw_success'">
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
            $t('transferPage.back')
          }}</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios'
  import _ from 'lodash'
  import appState from '../appState'
  import utils from '../utils'
  import KeystoreInput from '../components/KeystoreInput.vue'
  import AddressOrSelectWalletInput from '../components/AddressOrSelectWalletInput.vue'
  import AssetInput from '../components/AssetInput.vue'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js

  export default {
    name: 'Withdraw',
    components: { KeystoreInput, AddressOrSelectWalletInput, AssetInput },
    data() {
      return {
        addresses: [],
        lastSentTxId: null,
        transferFailError: null,
        showConfirmDialog: false,
        step: 'withdraw', // withdraw, withdraw_sent, withdraw_success, withdraw_fail
        walletUnlocked: false,
        hideZeroAssets: false,
        transferForm: {
          filename: appState.getCurrentAddress(),
          transferAssetId: '1.3.0',
        },
        currentAccountBalances: [],
        currentAccountInfo: {},
        closeTimeoutMilli: 5000,
        hourFee: 100,
      }
    },
    created() {
      this.getHourFee()
      let account = appState.getCurrentAccount()
      const walletInfo = appState.getWalletInfo()
      this.addresses = !!walletInfo ? walletInfo.addresses : []
      this.currentAccount = account
      if (account) {
        this.walletUnlocked = true
        this.currentAddress = account.address
        this.loadCurrentAccountInfo()
      } else {
        this.walletUnlocked = false
      }
    },
    computed: {
      fee: function() {
        return `0.00001 ~ ${new BigNumber(this.hourFee || 100)
          .multipliedBy(600)
          .dividedBy(new BigNumber(10).pow(8))}`
      },
    },
    mounted() {
      appState.onChangeCurrentAccount(this.onChangeCurrentAccount)

      const flashTxMessage = appState.getFlashTxOnce()
      if (flashTxMessage) {
        this.onFlashTxMessage(flashTxMessage)
      }
      appState.onPushFlashTxMessage(this.onFlashTxMessage)
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
      getHourFee() {
        axios
          .get('https://mempool.space/api/v1/fees/recommended', {
            headers: { 'Content-Type': 'application/json' },
          })
          .then((data) => {
            if (!!data && !!data.data) {
              this.hourFee = data.data.hourFee
            }
          })
      },
      onFlashTxMessage(txMsg) {
        this.transferForm.transferAssetId = txMsg.currency || '1.3.0'
        this.transferForm.amount = txMsg.valueRaw
        this.transferForm.toAddress = txMsg.to
        this.transferForm.memo = txMsg.memo
        this.serialNumber = txMsg.serialNumber
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
                  item.assetId === '1.3.0' &&
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
      onChangeCurrentAccount(account, addresses) {
        this.currentAccount = account
        this.currentAddress = account.address
        this.addresses = addresses
      },
      updateCurrentAccountBalances(balances) {
        this.currentAccountBalances = balances
      },
      backToTransfer() {
        this.transferForm.toAddress = ''
        this.transferForm.amount = 0
        this.transferForm.memo = ''
        this.transferForm.transferAssetId = '1.3.0'
        this.step = 'withdraw'
      },
      toViewTx(txId) {
        appState.changeCurrentTab('check_tx', [txId])
      },
      getAddressByAddressOrAccountName(addressOrAccountName) {
        if (!addressOrAccountName) {
          return Promise.reject('Empty address name')
        }
        if (
          !addressOrAccountName ||
          addressOrAccountName.length < 20 ||
          addressOrAccountName.indexOf(appState.getAddressPrefix()) !== 0
        ) {
          const nodeClient = appState.getNodeClient()
          return appState.withApis().then(() => {
            return nodeClient
              .getAccount(addressOrAccountName)
              .then((account) => account.addr)
          })
        } else {
          return Promise.resolve(addressOrAccountName)
        }
      },
      transfer() {
        let form = this.transferForm
        let toAddress = (form.toAddress || '').trim()
        let amount = form.amount
        let amountNu = new BigNumber(amount)
        let assetId = form.transferAssetId
        let asset = appState.getAssetLocal(assetId)
        let feeAsset = appState.getAssetLocal('1.3.0')
        let fee = new BigNumber('0.000001')
        let memo = (form.memo || '').trim()
        if (amountNu.isNaN() || amountNu.lte(0)) {
          this.showError(this.$t('transferPage.invalid_transfer_amount_format'))
          return
        }

        if (!amountNu.isGreaterThan(0.00118)) {
          this.showError(
            'The withdrawal amount cannot be less than 0.00118 BTC'
          )
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

        if (!toAddress) {
          this.showError('Empty Address or account name')
          return
        }
        this.getAddressByAddressOrAccountName(toAddress)
          .then((toAddress) => {
            this.showConfirmDialog = true
          })
          .catch(() => {
            this.showError(this.$t('transferPage.invalid_to_address_format'))
          })
      },
      closeConfirmDialog() {
        this.showConfirmDialog = false
      },
      doWithdraw: _.throttle(function() {
        this.showConfirmDialog = false
        let form = this.transferForm
        let toAddress = (form.toAddress || '').trim()
        let amount = form.amount
        let amountNu = new BigNumber(amount)
        let assetId = form.transferAssetId
        let asset = appState.getAssetLocal(assetId)
        let memo = (form.memo || '').trim()
        let amountFull = amountNu.toString()

        this.addresses
        const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey())
        const pubKey = pkey.toPublicKey()

        this.getAddressByAddressOrAccountName(toAddress)
          .then((toAddress) => {
            appState
              .withApis()
              .then(() => {
                let tr = new TransactionBuilder()
                let op = TransactionHelper.new_cross_chain_withdraw_operation(
                  this.currentAccount.address,
                  toAddress,
                  amountFull,
                  memo
                )
                tr.add_type_operation('crosschain_withdraw', op)
                tr.set_expire_seconds(500)
                return tr.set_required_fees().then(() => {
                  return tr.finalize().then(() => tr)
                })
                // return tr.finalize().then(() => tr)
              })
              .then((tr) => {
                tr.add_signer(pkey, pubKey)
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
                          this.step = 'withdraw_success'
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
                          this.step = 'withdraw_fail'
                          this.transferFailError = this.$t(
                            'contractPage.tx_not_on_chain_please_query_later'
                          )
                        })
                    }, 6000)
                  })
                  .catch((e) => {
                    this.step = 'withdraw_fail'
                    this.transferFailError = e.toString()
                  })

                this.step = 'withdraw_sent'
              })
              .catch(this.showError)
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
  .xps-transfer-container {
    width: 100%;
    max-width: calc(100% - 40px);
    min-height: 350pt;
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
    .-left-side {
      background: white;
      height: 100%;
    }
    .-asset-symbol-label {
      color: #a99eb4;
      font-size: 7pt;
    }
    .-asset-amount-label {
      color: #261932;
      font-size: 8pt;
      margin-left: 4px;
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
      display: flex;
      align-items: center;
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

  .xps-transfer-inner-container,
  .xps-transfer-done-inner-container {
    width: 100%;
    label {
      font-size: 10pt;
      color: #261932;
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
</style>
