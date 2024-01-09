<template>
  <div>
    <div>
      <div class="xps-panel xps-tx-info-panel">
        <div
          style="color: #261932;font-size: 10pt;text-align: left;margin-bottom: 15px;"
        >
          Transaction Information
        </div>
        <el-row class="-info-line-row">
          <el-col :span="8">
            <div class="grid-content label-font">TxHash</div>
          </el-col>
          <el-col :span="16">
            <div class="grid-content label-font">
              <div>{{ txid }}</div>
            </div>
          </el-col>
        </el-row>
        <el-row class="-info-line-row">
          <el-col :span="8">
            <div class="grid-content label-font">TxReceipt Status</div>
          </el-col>
          <el-col :span="16">
            <div class="grid-content label-font">
              <div>{{ txReceiptStatus }}</div>
            </div>
          </el-col>
        </el-row>
        <el-row class="-info-line-row">
          <el-col :span="8">
            <div class="grid-content label-font">Tx Type</div>
          </el-col>
          <el-col :span="16">
            <div class="grid-content label-font">
              <div>{{ txType }}</div>
            </div>
          </el-col>
        </el-row>
        <el-row class="-info-line-row">
          <el-col :span="8">
            <div class="grid-content label-font">Block Height</div>
          </el-col>
          <el-col :span="16">
            <div class="grid-content label-font">
              <div v-text="txInfo.block_num"></div>
            </div>
          </el-col>
        </el-row>
        <el-row class="-info-line-row">
          <el-col :span="8">
            <div class="grid-content label-font">Expiration</div>
          </el-col>
          <el-col :span="16">
            <div class="grid-content label-font">
              <div v-text="formatTxTimestamp(txInfo.expiration)"></div>
            </div>
          </el-col>
        </el-row>
      </div>
      <div
        class="xps-panel xps-tx-details-panel"
        v-if="txInfo && txInfo.operations && txInfo.operations.length > 0"
      >
        <div class="-xps-details-title">Details</div>
        <div class="-tx-details-panel">
          <div
            v-for="([operationType, operation],
            operationIndex) in txInfo.operations"
            :key="operationIndex"
          >
            <div class="-operation-title">
              {{ getOperationTypeName(operationType) || 'Unknown' }}
            </div>
            <div v-if="getOperationTypeName(operationType) === 'transfer'">
              <TransferOpDetail :operation="operation"></TransferOpDetail>
            </div>
            <div
              v-if="getOperationTypeName(operationType) === 'contract_register'"
            >
              <RegisterContractOpDetail
                :operation="operation"
                :txReceipt="txReceipts[operationIndex]"
              ></RegisterContractOpDetail>
            </div>
            <div
              v-if="getOperationTypeName(operationType) === 'contract_invoke'"
            >
              <InvokeContractOpDetail
                :operation="operation"
                :txReceipt="txReceipts[operationIndex]"
              ></InvokeContractOpDetail>
            </div>
            <div
              v-if="getOperationTypeName(operationType) === 'transfer_contract'"
            >
              <TransferToContractOpDetail
                :operation="operation"
                :txReceipt="txReceipts[operationIndex]"
              ></TransferToContractOpDetail>
            </div>
            <div v-if="getOperationTypeName(operationType) === 'lockbalance'">
              <LockBalanceOpDetail :operation="operation"></LockBalanceOpDetail>
            </div>
            <div
              v-if="getOperationTypeName(operationType) === 'foreclose_balance'"
            >
              <SimpleOpDetail :operation="operation"></SimpleOpDetail>
            </div>
            <div v-if="getOperationTypeName(operationType) === 'pay_back'">
              <SimpleOpDetail :operation="operation"></SimpleOpDetail>
            </div>
            <div
              v-if="getOperationTypeName(operationType) === 'account_create'"
            >
              <SimpleOpDetail :operation="operation"></SimpleOpDetail>
            </div>
            <div
              v-if="
                getOperationTypeName(operationType) ===
                  'crosschain_withdraw_result'
              "
            >
              <SimpleOpDetail :operation="operation"></SimpleOpDetail>
            </div>
            <div
              v-if="getOperationTypeName(operationType) === 'crosschain_record'"
            >
              <SimpleOpDetail :operation="operation"></SimpleOpDetail>
            </div>
            <div
              v-if="
                [
                  'transfer',
                  'contract_register',
                  'contract_invoke',
                  'transfer_contract',
                  'lockbalance',
                  'foreclose_balance',
                  'pay_back',
                  'account_create',
                  'crosschain_withdraw_result',
                  'crosschain_record',
                ].indexOf(getOperationTypeName(operationType)) < 0
              "
            >
              <SimpleOpDetail :operation="operation"></SimpleOpDetail>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { format, distanceInWordsToNow } from 'date-fns'
  import appState from '../appState'
  import utils from '../utils'
  import TransferToContractOpDetail from './TransferToContractOpDetail.vue'
  import TransferOpDetail from './TransferOpDetail.vue'
  import RegisterContractOpDetail from './RegisterContractOpDetail.vue'
  import InvokeContractOpDetail from './InvokeContractOpDetail.vue'
  import LockBalanceOpDetail from './LockBalanceOpDetail.vue'
  import SimpleOpDetail from './SimpleOpDetail.vue'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js
  window.datefns = require('date-fns')

  export default {
    name: 'TransactionInfo',
    props: ['txid'],
    components: {
      TransferToContractOpDetail,
      TransferOpDetail,
      RegisterContractOpDetail,
      InvokeContractOpDetail,
      LockBalanceOpDetail,
      SimpleOpDetail,
    },
    data() {
      return {
        txInfo: {},
        txInfoFound: false,
        txType: null,
        txReceiptStatus: null,
        txReceipts: [],
      }
    },
    created() {},
    watch: {
      txid(newVal, oldVal) {
        this.loadTxInfo()
      },
    },
    mounted() {
      this.loadTxInfo()
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
      toBigNumber(val) {
        return new toBigNumber(val)
      },
      amountToString(val) {
        return utils.amountToString(val)
      },
      opTotalFee(opFeeAmount, gasCount, gasPrice) {
        return utils.opTotalFee(opFeeAmount, gasCount, gasPrice)
      },
      assetAmountToString(assetAmount) {
        return utils.assetAmountToString(assetAmount)
      },
      getOperationTypeName(opType) {
        return utils.getOperationTypeName(opType)
      },
      formatTxTimestamp(txTimeString) {
        if (!txTimeString) {
          return ''
        }
        const dateTz = utils.formatTimezone(new Date(Date.parse(txTimeString)))
        const ago = dateTz.getTime() < new Date().getTime()
        return distanceInWordsToNow(dateTz) + ' ' + (ago ? 'ago' : 'later')
      },
      getOperationTypeName(opType) {
        return utils.getOperationTypeName(opType)
      },
      loadTxInfo() {
        if (!this.txid) {
          return
        }
        const nodeClient = appState.getNodeClient()
        appState
          .withSystemAssets()
          .then(() => {
            return nodeClient
              .getTransactionById(this.txid)
              .then((tx) => {
                if (tx) {
                  this.txInfo = tx
                  this.txInfoFound = true
                  this.txType = utils.getTxType(tx)
                } else {
                  this.txInfo = {}
                  this.txInfoFound = false
                  this.txType = ''
                }
                return tx
              })
              .then((tx) => {
                return nodeClient
                  .getContractTxReceipt(this.txid)
                  .then((receipts) => {
                    // TODO: receipt by operation index
                    this.txReceipts = receipts
                    return tx
                  })
              })
              .then((tx) => {
                return utils.getTxReceiptStatus(nodeClient, tx)
              })
              .then((txReceiptStatus) => {
                this.txReceiptStatus = txReceiptStatus
              })
          })
          .catch(this.showError.bind(this))
      },
    },
  }
</script>

<style lang="less">
  .xps-tx-info-panel,
  .xps-tx-details-panel {
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
    .-info-line-row {
      padding-bottom: 10px;
      padding-top: 10px;
      border-bottom: solid 1px #f3f3f3;
      text-align: left;
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

  .xps-tx-info-panel {
    min-width: 400pt;
    max-width: 100%;
    min-height: 266pt;
    margin: 0 auto;
    padding: 30pt 40pt;
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
  .xps-tx-details-panel {
    padding: 30pt 40pt;
    .-xps-details-title {
      color: #261932;
      font-size: 10pt;
      text-align: left;
      padding-bottom: 10pt;
    }
    .-operation-title {
      color: #261932;
      font-size: 8pt;
      text-align: left;
      padding-left: 20pt;
      padding-right: 20pt;
      margin: 0 -20pt;
      padding-bottom: 10pt;
      height: 20pt;
      line-height: 20pt;
      background: #f6eaff;
    }
    .-tx-details-panel {
    }
  }
</style>
