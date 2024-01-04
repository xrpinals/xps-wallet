<template>
  <div>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Contract Address</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{ txReceipt && txReceipt.contract_registed }}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Caller Address</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{ operation.owner_addr }}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Gas Limit</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{ operation.init_cost }}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Gas Price</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{ amountToString(operation.gas_price) }}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Actual Tx Fee</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>
            {{
              opTotalFee(
                operation.fee.amount,
                operation.init_cost,
                operation.gas_price
              )
            }}
            BTC
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row
      class="-info-line-row"
      v-if="operation.contract_code && operation.contract_code.abi"
    >
      <el-col :span="8">
        <div class="grid-content label-font">API</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>
            <el-tag
              type="info"
              style="margin: 5px 10px;"
              v-for="api in operation.contract_code.abi"
              :key="api"
              >{{ api }}</el-tag
            >
            <el-tag
              type="info"
              style="margin: 5px 10px;"
              v-for="api in operation.contract_code.offline_abi"
              :key="api"
              >{{ api }}</el-tag
            >
          </div>
        </div>
      </el-col>
    </el-row>
    <TxReceiptPanel
      v-if="txReceipt && txReceipt.events"
      :txReceipt="txReceipt"
    ></TxReceiptPanel>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { format, distanceInWordsToNow } from 'date-fns'
  import appState from '../appState'
  import utils from '../utils'
  import TxReceiptPanel from './TxReceiptPanel.vue'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js
  window.datefns = require('date-fns')

  export default {
    name: 'RegisterContractOpDetail',
    props: ['operation', 'txReceipt'],
    components: { TxReceiptPanel },
    data() {
      return {}
    },
    created() {},
    watch: {},
    mounted() {},
    beforeDestroy() {},
    methods: {
      amountToString(val) {
        return utils.amountToString(val)
      },
      opTotalFee(opFeeAmount, gasCount, gasPrice) {
        let acctual_fee = (this.txReceipt || {}).acctual_fee || 0
        return utils.amountToString(acctual_fee)
      },
      assetAmountToString(assetAmount) {
        return utils.assetAmountToString(assetAmount)
      },
      getOperationTypeName(opType) {
        return utils.getOperationTypeName(opType)
      },
    },
  }
</script>

<style lang="less">
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
  }
</style>
