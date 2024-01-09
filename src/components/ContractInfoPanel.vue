<template>
  <div>
    <div>
      <div class="xps-panel xps-contract-info-panel">
        <el-row class="-address-row">
          <el-col :span="4">
            <div class="grid-content label-font">
              {{ $t('contractPage.contract_address') }}
            </div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font">
              <div>{{ contractAddress }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="grid-content label-font">
              {{ $t('contractPage.create_tx_id') }}
            </div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font" style="text-align: left;">
              <div>{{ contractInfo.registered_trx }}</div>
            </div>
          </el-col>
        </el-row>
        <el-row class="-creator-row">
          <el-col :span="4">
            <div class="grid-content label-font">
              {{ $t('contractPage.creator') }}
            </div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font">
              <div>{{ contractInfo.owner_address }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="grid-content label-font">
              {{ $t('contractPage.contract_create_height') }}
            </div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font" style="text-align: left;">
              <div>{{ contractInfo.registered_block }}</div>
            </div>
          </el-col>
        </el-row>
        <el-row class="-balance-label-row">
          <el-col :span="24">
            <div class="grid-content label-font">
              {{ $t('contractPage.balance') }}
            </div>
          </el-col>
          <!-- <el-col :span="8">
            <div class="grid-content label-font">&nbsp;</div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font">&nbsp;</div>
          </el-col>
          <el-col :span="4">
            <div class="grid-content">
              <div style="text-align: right;">
                <el-switch v-model="hideZeroAssets"></el-switch>
                <span class="label-font">{{
                  $t('accountBalances.hide_zero_balances')
                }}</span>
              </div>
            </div>
          </el-col> -->
        </el-row>
        <div class="-account-balances-panel">
          <div
            v-for="balance in filterBalances(
              contractBalances,
              hideZeroAssets,
              showAccountBalancesLimit
            )"
            class="-account-balance"
            :key="balance.assetSymbol"
          >
            <div class="-asset-symbol-label">{{ balance.assetSymbol }}</div>
            <div class="-asset-amount-label">
              {{ balance.amountNu.toFixed(balance.precision) }}
            </div>
          </div>
          <div
            v-if="
              showAccountBalancesLimit &&
                filterBalances(contractBalances, hideZeroAssets, null).length >
                  showAccountBalancesLimit
            "
          >
            <i
              class="el-icon-arrow-down"
              v-on:click="showAllBalances"
              style="cursor: pointer;"
            ></i>
          </div>
          <div class="clearfix"></div>
        </div>
      </div>
      <div
        class="xps-panel xps-contract-apis-panel"
        v-if="contractInfo.type_of_contract === 'normal_contract'"
      >
        <div class="-contract-api-title">API</div>
        <div class="-contract-apis-panel">
          <div
            v-for="api in contractInfo.code_printable.abi"
            class="-api-item"
            :key="api"
          >
            <div class="-api-label">{{ api }}</div>
          </div>
          <div
            v-for="api in contractInfo.code_printable.offline_abi"
            class="-api-item"
            :key="api"
          >
            <div class="-api-label">{{ api }}</div>
          </div>
          <div class="clearfix"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import appState from '../appState'
  import utils from '../utils'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js

  export default {
    name: 'ContractInfoPanel',
    props: ['contractAddress'],
    components: {},
    data() {
      return {
        infoAccount: '',
        hideZeroAssets: false,
        showAccountBalancesLimit: 5,

        contractBalances: [
          {
            assetId: '1.3.0',
            assetSymbol: 'BTC',
            amountNu: new BigNumber(0),
            amount: 0,
          },
        ],
        contractInfo: {},

        unlockWalletForm: {
          keystoreFile: null,
          keystoreFileInput: null,
          keystoreFileJson: null,
          password: '',
        },
      }
    },
    created() {},
    watch: {
      contractAddress(newVal, oldVal) {
        this.loadInfoAccountInfo()
      },
    },
    mounted() {
      this.loadInfoAccountInfo()
    },
    beforeDestroy() {},
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
      showWarning(info) {
        this.$message({
          showClose: true,
          message: (info || 'warning').toString(),
          type: 'warning',
        })
      },
      showAllBalances() {
        this.showAccountBalancesLimit = null
      },
      loadInfoAccountInfo() {
        if (!this.contractAddress) {
          return
        }
        const nodeClient = appState.getNodeClient()
        appState
          .withSystemAssets()
          .then((assets) => {
            return nodeClient
              .getContractBalances(this.contractAddress)
              .then((balances) => {
                this.contractBalances.length = 0
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
                  this.contractBalances.push(item)
                }
                return balances
              })
          })
          .then(() => {
            return nodeClient
              .getSimpleContractInfo(this.contractAddress)
              .then((accountInfo) => {
                if (accountInfo) {
                  this.contractInfo = accountInfo
                } else {
                  this.contractInfo = {}
                }
              })
          })
          .catch(this.showError.bind(this))
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
  .xps-contract-info-panel {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
    .-asset-symbol-label {
      color: #a99eb4;
      font-size: 7pt;
    }
    .-asset-amount-label {
      color: #261932;
      font-size: 12pt;
      padding-top: 4pt;
      overflow-x: hidden;
      padding-left: 2px;
      padding-right: 2px;
    }
    .-address-row {
      padding-bottom: 10px;
      border-bottom: solid 1px #f3f3f3;
    }
    .-creator-row {
      margin-top: 10px;
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
      width: 20%;
      padding-bottom: 15px;
    }
    .-not-registered-account-btn {
      color: #6555df;
      font-size: 8pt;
      cursor: pointer;
    }
  }

  .xps-contract-info-panel {
    min-width: 400pt;
    max-width: 100%;
    min-height: 266pt;
    margin: 0 auto;
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
    .-selectKeyStoreFile {
      cursor: pointer;
    }
    .-unlock-keystore-file-btn {
      margin-left: -80pt;
    }
  }
  .xps-contract-apis-panel {
    padding: 15px;
    .-contract-api-title {
      color: #261932;
      font-size: 8pt;
      text-align: left;
      padding-left: 40pt;
      padding-bottom: 10pt;
    }
    .-contract-apis-panel {
      .-api-item {
        display: block;
        float: left;
        min-width: 55pt;
        padding: 0 30pt 15px 30pt;
        text-align: center;
        .-api-label {
          color: #261932;
          font-size: 8pt;
        }
      }
    }
  }
</style>
