<template>
  <div>
    <div
      v-if="!registerDone"
      class="xps-main-container xps-register-account-container"
    >
      <div class="-register-account-title">
        {{ $t('registerAccount.register_account') }}
      </div>
      <el-form
        :model="registerAccountForm"
        status-icon
        ref="registerAccountForm"
        label-width="100pt"
        class="xps-register-account-inner-container"
      >
        <el-form-item
          v-bind:label="$t('registerAccount.account_name')"
          class="-name-panel"
          prop="name"
        >
          <el-input
            class="-input-account-name"
            v-bind:placeholder="$t('registerAccount.please_input_account_name')"
            type="text"
            v-model="registerAccountForm.name"
            autocomplete="off"
            style="width: 100pt;"
          ></el-input>
          <div class="-account-name-rule-desc">
            <p>{{ $t('registerAccount.account_name_rule1') }}</p>
            <p>{{ $t('registerAccount.account_name_rule2') }}</p>
            <p>{{ $t('registerAccount.account_name_rule3') }}</p>
          </div>
        </el-form-item>
        <el-form-item
          v-bind:label="$t('registerAccount.fee')"
          class="-fee-panel"
          prop="feeAmount"
        >
          <div style="text-align: left; padding-left: 50pt;">5BTC</div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="-register-account-btn"
            v-on:click="registerAccount"
            >{{ $t('registerAccount.register_now') }}</el-button
          >
        </el-form-item>
      </el-form>
    </div>
    <div
      v-if="registerDone"
      class="xps-main-container xps-register-account-done-container"
    >
      <div class="-register-account-title" style="color: #261932;">
        {{ $t('registerAccount.register_request_sent_please_refresh_later') }}
      </div>
      <div>
        <div style="color: #261932;font-size: 10pt; padding-top: 35pt;">
          {{ $t('registerAccount.your_account_name') }}
        </div>
        <div style="color: #261932; font-size: 15pt; padding-top: 15pt;">
          {{ registerAccountForm.name }}
        </div>
      </div>
      <div style="margin-top: 40pt;">
        <el-button
          type="primary"
          class="xpswallet-form-btn"
          v-on:click="backToWallet"
          >{{ $t('registerAccount.return_with_space') }}</el-button
        >
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
    name: 'RegisterAccount',
    data() {
      return {
        currentAddress: '',
        currentAccount: '',

        currentAccountBalances: [],
        currentAccountInfo: {},

        registerAccountForm: {},

        registerDone: false,
      }
    },
    created() {
      let account = appState.getCurrentAccount()
      this.currentAccount = account
      this.currentAddress = account.address
    },
    mounted() {
      appState.onChangeCurrentAccount(this.onChangeCurrentAccount)
    },
    beforeDestroy() {
      appState.offChangeCurrentAccount(this.onChangeCurrentAccount)
    },
    methods: {
      onChangeCurrentAccount(account) {
        this.currentAccount = account
      },
      showError(e) {
        e = utils.getShowErrorMessage(e)
        this.$message({
          showClose: true,
          message: e,
          type: 'error',
        })
      },
      showSuccess(info) {
        this.$message({
          showClose: true,
          message: (info || 'success').toString(),
          type: 'success',
        })
      },
      registerAccount: _.throttle(function() {
        let name = (this.registerAccountForm.name || '').trim()
        if (
          name.length < 2 ||
          name.length > 63 ||
          !/^[a-zA-Z][a-zA-Z\d\-]*$/.test(name)
        ) {
          this.showError(this.$t('registerAccount.invalid_account_format'))
          return
        }
        const nodeClient = appState.getNodeClient()
        const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey())
        const pubKey = pkey.toPublicKey()
        appState
          .withApis()
          .then(() => {
            return nodeClient
              .getAccount(name)
              .then((r) => {
                throw new Error(
                  this.$t('registerAccount.account_registered_before')
                )
              })
              .catch(() => {
                // account not registered
                return true
              })
          })
          .then(() => {
            let op = TransactionHelper.new_register_account_operation(
              this.currentAccount.address,
              pubKey,
              name
            )
            let tr = new TransactionBuilder()
            tr.add_type_operation('account_create', op)
            tr.set_expire_seconds(500)
            return tr.set_required_fees().then(() => {
              return tr.finalize().then(() => tr)
            })
          })
          .then((tr) => {
            tr.add_signer(pkey, pubKey)
            tr.sign()
            tr.broadcast(function() {})
              .then(() => {
                this.registerDone = true
              })
              .catch((e) => {
                this.showError(
                  this.$t('registerAccount.register_account_error_with_reason')
                )
              })
          })
          .catch(this.showError)
      }, 1000),
      backToWallet() {
        appState.changeCurrentTab('my_wallet')
      },
    },
  }
</script>

<style lang="less">
  .xps-register-account-container1 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-register-account-container2 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-register-account-container,
  .xps-register-account-done-container {
    min-width: 400px;
    min-height: 266pt;
    .-register-account-title {
      font-size: 20pt;
      color: #261932;
    }
    .-account-name-rule-desc {
      font-size: 8pt;
      color: #cccccc;
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
  .xps-register-account-inner-container {
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

    .-register-account-btn {
      margin-left: -80pt;
    }
  }
  @media (max-width: 600px) {
    .xps-register-account-container,
    .xps-register-account-done-container {
      .xps-register-account-inner-container {
        width: 400px;
        .-name-panel {
          .el-form-item__label {
            width: 60pt;
          }
        }
        .-fee-panel {
          .el-form-item__label {
            width: 60pt;
          }
        }
        .-account-name-rule-desc {
          margin-left: 20px;
        }
      }
    }
  }

  .chrome-ext-app-container {
    .xps-register-account-inner-container {
      width: auto;
    }
  }
</style>
