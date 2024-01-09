<template>
  <div>
    <div v-if="!checkTxDone" class="xps-main-container xps-check-tx-container">
      <div class="-check-tx-title">{{ $t('checkTxPage.title') }}</div>
      <div>
        <el-input
          class="-input-address"
          v-bind:placeholder="$t('checkTxPage.please_input_txid_or_address')"
          type="text"
          v-model="checkTxForm.address"
          style="width: 100pt;"
        ></el-input>
      </div>
      <div style="margin-top: 30pt;">
        <el-button
          type="primary"
          class="xpswallet-form-btn"
          v-on:click="toQueryTx(checkTxForm.address)"
          >{{ $t('checkTxPage.query_now') }}</el-button
        >
      </div>
    </div>
    <div v-if="checkTxDone" class="xps-check-tx-done-container">
      <div v-if="checkTxForm.isTxId">
        <TransactionInfo
          style="margin-top: 5pt;"
          :txid="data.trxid"
        ></TransactionInfo>
      </div>
      <!-- <div v-if="checkTxForm.isAccountAddr && data">
        <AccountInfo
          style="margin-top: 5pt;"
          :accountAddress="data.addr"
          :myself="false"
        ></AccountInfo>
      </div>
      <div v-if="checkTxForm.isContractAddr && data">
        <ContractInfoPanel
          style="margin-top: 5pt;"
          :contractAddress="data.id"
        ></ContractInfoPanel>
      </div>
      <div
        v-if="
          !checkTxForm.isTxId &&
            !checkTxForm.isAccountAddr &&
            !checkTxForm.isContractAddr
        "
      >
        Not supported address type
      </div> -->
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import appState from '../appState'
  import AccountInfo from './AccountInfo.vue'
  import ContractInfoPanel from '../components/ContractInfoPanel.vue'
  import TransactionInfo from '../components/TransactionInfo.vue'
  import utils from '../utils'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js

  export default {
    name: 'CheckTx',
    components: { AccountInfo, ContractInfoPanel, TransactionInfo },
    data() {
      return {
        checkTxForm: {},

        checkTxDone: false,
        data: null,
      }
    },
    created() {
      const tabParams = appState.getCurrentTabParams()
      if (tabParams && tabParams.length > 0) {
        const txidOrAddress = tabParams[0]
        this.checkTxForm.address = txidOrAddress
      }
    },
    mounted() {
      if (this.checkTxForm.address) {
        this.toQueryTx(this.checkTxForm.address)
      }
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
      showSuccess(info) {
        this.$message({
          showClose: true,
          message: (info || 'success').toString(),
          type: 'success',
        })
      },
      toQueryTx(txidOrAddress) {
        txidOrAddress = (txidOrAddress || '').trim()
        if (txidOrAddress.length < 1) {
          this.showError(this.$t('forms.invalid_input_format'))
          return
        }
        let isTxId = txidOrAddress.length === 40
        let addressPrefix = appState.getAddressPrefix()
        let isAccountAddr =
          txidOrAddress.indexOf(addressPrefix) === 0 &&
          txidOrAddress.indexOf(addressPrefix + 'C') !== 0 &&
          txidOrAddress.length > 20
        let isContractAddr =
          txidOrAddress.indexOf(addressPrefix + 'C') === 0 &&
          txidOrAddress.length > 20
        this.checkTxForm.isTxId = isTxId
        this.checkTxForm.isAccountAddr = isAccountAddr
        this.checkTxForm.isContractAddr = isContractAddr
        const nodeClient = appState.getNodeClient()
        appState
          .withApis()
          .then(() => {
            if (isTxId) {
              return nodeClient.getTransactionById(txidOrAddress)
            } else if (isAccountAddr) {
              return nodeClient.getAccountByAddresss(txidOrAddress)
            } else if (isContractAddr) {
              return nodeClient.getSimpleContractInfo(txidOrAddress)
            } else {
              // account name
              return nodeClient.getAccount(txidOrAddress)
            }
          })
          .then((data) => {
            if (!data) {
              data = {
                addr: txidOrAddress,
              }
            }
            this.data = data
            this.checkTxDone = true
            if (!isTxId && !isAccountAddr && !isContractAddr) {
              isAccountAddr = true
              this.checkTxForm.isAccountAddr = isAccountAddr
            }
            return data
          })
          .catch(this.showError)
      },
    },
  }
</script>

<style lang="less">
  .xps-check-tx-container1 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-check-tx-container2 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-check-tx-container,
  .xps-check-tx-done-container {
    min-width: 400px;
    min-height: 266pt;
    .-check-tx-title {
      font-size: 20pt;
      color: #261932;
      margin-bottom: 40pt;
    }
    .-address-rule-desc {
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
  }

  .chrome-ext-app-container {
    .xps-check-tx-container {
      padding-left: 0;
      padding-right: 0;
    }
  }
</style>
