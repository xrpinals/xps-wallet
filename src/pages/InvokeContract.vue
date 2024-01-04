<template>
  <div>
    <div class="xps-panel xps-invoke-contract-container">
      <div class="-left-side" v-if="step === 'transfer'">
        <el-form
          :model="contractForm"
          status-icon
          ref="contractForm"
          label-width="60pt"
          class="xps-invoke-contract-inner-container"
        >
          <el-form-item
            class="-contract-address-panel"
            v-bind:label="$t('contractPage.contract_address')"
            prop="toAddress"
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
            <el-button
              type="primary"
              class="xpswallet-form-btn -confirm-contract-address-btn"
              @click="loadContractApis"
              style
              >{{ $t('contractPage.confirm') }}</el-button
            >
          </el-form-item>
          <el-form-item
            class="-contract-api-panel"
            v-bind:label="$t('contractPage.contract_api')"
            prop="apiName"
          >
            <el-select
              v-model="contractForm.apiName"
              filterable
              @change="onApiNameChange"
              v-bind:placeholder="$t('contractPage.please_input_contract_api')"
            >
              <el-option
                v-for="item in contractForm.contractApisOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            class="-contract-arg-panel"
            v-bind:label="$t('contractPage.contract_arg')"
            prop="apiArg"
          >
            <el-input
              class="-input-contract-arg"
              v-bind:placeholder="$t('contractPage.please_input_invoke_arg')"
              type="text"
              v-model="contractForm.apiArg"
              style
            ></el-input>
          </el-form-item>
          <AddressOrSelectWalletInput
            :currentAddress="currentAccount && currentAccount.address"
            @change-current-account="onChangeSelectedAccount"
          ></AddressOrSelectWalletInput>
          <el-form-item v-bind:label="$t('contractPage.balance')" prop="amount">
            <el-input
              class="-input-amount -contract-balance-input"
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

          <div class="-control-panel" style="text-align: center;padding: 10pt;">
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              @click="emulateInvokeContract"
              >{{ $t('contractPage.test') }}</el-button
            >
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              @click="toSubmitInvokeContract"
              >{{ $t('contractPage.submit') }}</el-button
            >
          </div>
          <el-form-item v-if="emulateState === 'success'">
            <div class="-invoke-contract-api-result">
              API result: {{ contractForm.apiResult }}
            </div>
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
                  {{ contractForm.contractAddress }}
                </div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">
                  {{ $t('contractPage.contract_api') }}
                </div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ contractForm.apiName }}
                </div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">
                  {{ $t('contractPage.contract_arg') }}
                </div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ contractForm.apiArg }}
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
                <div class="grid-content label-font">Gas Limit</div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">
                  {{ contractForm.gasLimit }}
                </div>
              </el-col>
            </el-row>
          </div>
          <span slot="footer" class="dialog-footer">
            <el-button
              class="xpswallet-form-btn"
              type="primary"
              @click="doSubmitInvokeContract"
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
  import SideNavbar from '../components/SideNavbar.vue'
  import AddressOrSelectWalletInput from '../components/AddressOrSelectWalletInput.vue'
  import AssetInput from '../components/AssetInput.vue'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js

  export default {
    name: 'InvokeContract',
    components: {
      KeystoreInput,
      SideNavbar,
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
          filename: appState.getCurrentAddress(),
          transferAssetId: '1.3.0',
          gasLimit: 10000,
          gasPrice: '0.00001',
          apiResult: null,
          contractApisOptions: [],
          contractApis: [],
        },
        currentAccountBalances: [],
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
      onFlashTxMessage(txMsg) {
        this.contractForm.transferAssetId = txMsg.currency || '1.3.0'
        this.contractForm.contractAddress = txMsg.to || ''
        this.contractForm.apiName = txMsg.contractApi || ''
        this.contractForm.apiArg = txMsg.contractArg || ''
        this.contractForm.gasLimit = txMsg.gasLimit || 10000
        this.contractForm.gasPrice = txMsg.gasPrice || '0.00001'
        if (this.contractForm.contractAddress && this.contractForm.apiName) {
          setTimeout(() => {
            this.emulateInvokeContract()
          }, 500)
        }
      },
      getAssetPrecisionByAssetId(assetId) {
        return appState.getAssetPrecisionByAssetId(assetId)
      },
      onApiNameChange(newVal) {
        this.$forceUpdate()
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
      loadContractApis() {
        const contractAddress = (this.contractForm.contractAddress || '').trim()
        if (!contractAddress) {
          return
        }
        const nodeClient = appState.getNodeClient()
        appState
          .withApis()
          .then(() => {
            return nodeClient.getSimpleContractInfo(contractAddress)
          })
          .then((contract) => {
            this.contractForm.contractInfo = contract
            if (!this.contractForm.contractApis) {
              this.contractForm.contractApis = []
            }
            this.contractForm.contractApis.length = 0
            this.contractForm.contractApisOptions = []
            if (
              contract &&
              contract.code_printable &&
              contract.code_printable.abi
            ) {
              let apis = []
              const specialApis = [
                'init',
                'on_deposit',
                'on_deposit_asset',
                'on_upgrade',
                'on_destroy',
              ]
              for (let api of contract.code_printable.abi) {
                if (specialApis.indexOf(api) < 0) {
                  apis.push(api)
                }
              }
              for (let api of contract.code_printable.offline_abi) {
                if (apis.indexOf(api) < 0) {
                  apis.push(api)
                }
              }
              apis.forEach((item) => {
                this.contractForm.contractApis.push(item)
              })
              // this.contractForm.contractApis = apis;
              for (let api of apis) {
                this.contractForm.contractApisOptions.push({
                  value: api,
                  label: api,
                })
              }
            }
          })
          .catch(this.showError)
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
      onChangeSelectedAccount(account) {
        this.currentAccount = account
        this.currentAddress = account.address
        this.loadCurrentAccountInfo()
      },
      backToTransfer() {
        this.contractForm.contractAddress = ''
        this.contractForm.contractApis.length = 0
        this.contractForm.apiName = ''
        this.contractForm.apiArg = ''
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
      emulateInvokeContract() {
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
        const apiName = this.contractForm.apiName
        if (!apiName) {
          this.showError(
            this.$t('contractPage.please_input_to_invoke_contract_api')
          )
          return
        }
        const apiArg = this.contractForm.apiArg || ''
        const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey())
        const pubkey = pkey.toPublicKey()
        const nodeClient = appState.getNodeClient()
        appState
          .withApis()
          .then(() => {
            nodeClient
              .invokeContractTesting(pubkey, contractId, apiName, apiArg)
              .then((data) => {
                const fee = data.fee
                const gasCount = data.gas_count
                this.contractForm.gasLimit = parseInt(gasCount * 1.1)
                this.contractForm.fee = fee
                this.contractForm.apiResult = (data.result || '').toString()
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
      toSubmitInvokeContract() {
        this.showConfirmDialog = true
      },
      doSubmitInvokeContract: _.throttle(function() {
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
        const apiName = this.contractForm.apiName
        if (!apiName) {
          this.showError(
            this.$t('contractPage.please_input_to_invoke_contract_api')
          )
          return
        }
        const apiArg = this.contractForm.apiArg || ''
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
            let op = TransactionHelper.new_contract_invoke_operation(
              callerAddress,
              pubkey,
              gasLimit,
              gasPrice,
              contractId,
              apiName,
              apiArg.toString()
            )
            tr.add_type_operation('contract_invoke', op)
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
  .xps-invoke-contract-container {
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
    .-invoke-contract-api-result {
      color: #261932;
      font-size: 8pt;
      padding: 20pt;
      margin-left: -40pt;
      width: 100%;
      word-break: break-all;
    }
    .-confirm-contract-address-btn {
      width: 100pt;
      height: 20pt;
      line-height: 20pt;
      font-size: 10pt;
      padding: 1pt;
      margin-left: 20pt;
    }
    .xps-address-or-select-wallet-input {
      .-address-show-label {
        padding-left: 10pt !important;
      }
    }
    .-input-gas-price.asset-input-wrapper {
      .el-input {
        width: 170pt !important;
        .el-input__inner {
          width: 170pt !important;
        }
      }
    }
    .-input-gas-limit.asset-input-wrapper {
      .el-input {
        width: 220pt !important;
      }
    }
  }

  .chrome-ext-app-container .xps-invoke-contract-container {
    .-input-gas-price.asset-input-wrapper {
      .el-input {
        width: 88pt !important;
        .el-input__inner {
          width: 88pt !important;
        }
      }
    }
    .-invoke-contract-api-result {
      max-width: 250px;
    }
  }

  @media (max-width: 960px) {
    .xps-invoke-contract-container {
      .-right-side {
        display: none;
      }
      .-left-side {
        width: 100%;
      }
    }
  }

  .xps-invoke-contract-inner-container,
  .xps-invoke-contract-done-inner-container {
    min-width: 500pt;
    margin: 20pt auto 0 auto;
    padding-left: 20pt;
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
    .el-form-item__content {
      text-align: left;
      padding-left: 30pt;
    }
  }

  @media (max-width: 600px) {
    .xps-invoke-contract-container {
      padding: 0;
      .el-input {
        width: auto !important;
      }
      .-contract-balance-input {
        width: 140pt !important;
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
      .xps-invoke-contract-inner-container {
        margin: 0 !important;
        padding: 5px 15px !important;
        width: 400px !important;
        .el-form-item__label {
          text-align: left;
        }
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
    .xps-invoke-contract-container {
      .-input-amount {
        width: 88pt !important;
      }
      .-contract-balance-input {
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
