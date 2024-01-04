<template>
  <div>
    <div>
      <div class="xps-panel xps-account-info-panel">
        <el-row class="-address-row">
          <el-col :span="4">
            <div class="grid-content label-font" v-if="myself">
              {{ $t('accountInfoPage.my_address') }}
            </div>
            <div class="grid-content label-font" v-if="!myself">
              {{ $t('accountInfoPage.account_address') }}
            </div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font">
              <div>{{ accountAddress }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="grid-content label-font">
              {{ $t('accountInfoPage.account_name') }}
            </div>
          </el-col>
          <!-- <el-col :span="8">
            <div class="grid-content label-font" style="text-align: left;">
              <div v-if="infoAccountInfo.name">{{ infoAccountInfo.name }}</div>
              <div
                v-if="!infoAccountInfo.name"
                class="-not-registered-account-btn"
                v-on:click="toRegisterAccount()"
              >
                {{ $t('accountInfoPage.not_registered') }}
              </div>
              <span
                style="color: #A64EB5; float: right; margin-top: -18px; margin-right: 30px;"
                v-if="myself"
                v-on:click="opened = false"
                >{{ $t('keystoreInput.change_wallet') }}</span
              >
            </div>
          </el-col> -->
        </el-row>
        <AccountBalancesSidebar
          style="margin-top: 20px;"
          :accountBalances="infoAccountBalances"
          :accountTokenBalances="infoAccountTokenBalances"
          :defaultLimit="showAccountBalancesLimit"
          :isMyWallet="myself"
        ></AccountBalancesSidebar>
      </div>
      <AccountLockBalancesPanel
        v-if="infoAccountInfo && infoAccountInfo.name"
        :currentAccount="myself ? infoAccount : null"
        :accountName="infoAccountInfo.name"
        :myself="myself"
        @balance-update="toUpdateAccountBalances"
      ></AccountLockBalancesPanel>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import appState from '../appState'
  import utils from '../utils'
  import KeystoreInput from '../components/KeystoreInput.vue'
  import AccountBalancesSidebar from '../components/AccountBalancesSidebar.vue'
  import AccountLockBalancesPanel from '../components/AccountLockBalancesPanel.vue'
  import tokenRpc from '../rpc/token'

  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js

  export default {
    name: 'AccountInfo',
    props: ['accountAddress', 'myself'],
    components: {
      KeystoreInput,
      AccountBalancesSidebar,
      AccountLockBalancesPanel,
    },
    data() {
      return {
        infoAccount: '',
        hideZeroAssets: false,
        showAccountBalancesLimit: 5,

        infoAccountBalances: [utils.emptyBalance],
        infoAccountTokenBalances: [], // TODO
        infoAccountInfo: {},

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
      accountAddress(newVal, oldVal) {
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
      toUpdateAccountBalances() {
        this.loadInfoAccountInfo()
      },
      loadInfoAccountInfo() {
        if (!this.accountAddress) {
          return
        }

        this.$store
          .dispatch('account/getAccountInfo', this.accountAddress)
          .then((accountInfo) => {
            if (accountInfo) {
              this.infoAccountInfo = accountInfo
            } else {
              this.infoAccountInfo = {}
            }
          })
          .catch(this.showError)

        this.$store
          .dispatch('account/getAddressBalances', this.accountAddress)
          .then((accountBalances) => {
            this.infoAccountBalances = accountBalances
          })
          .catch(this.showError)
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
      toRegisterAccount() {
        if (!this.myself) {
          return
        }
        appState.changeCurrentTab('register_account')
      },
      onSelectKeystoreFile(fileJson, filename) {
        this.unlockWalletForm.keystoreFileJson = fileJson
        this.unlockWalletForm.keystoreFile = filename
      },
    },
  }
</script>

<style lang="less">
  .xps-account-info-panel {
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
    .-balance-label-row {
      padding-top: 10px;
      padding-bottom: 20px;
    }
    .-account-balance {
      width: 20% !important;
    }
    .-not-registered-account-btn {
      color: #6555df;
      font-size: 8pt;
      cursor: pointer;
    }
  }

  .xps-account-info-panel {
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
    .xps-account-balances-side-bar {
      .-balance-title-panel {
        text-align: left;
        padding-left: 50pt;
      }
      .-switch-panel {
        text-align: right;
        padding-right: 50pt;
      }
    }
  }
</style>
