<template>
  <el-row class="-info-line-row">
    <el-col :span="8">
      <div class="grid-content label-font">Event Logs</div>
    </el-col>
    <el-col :span="16">
      <div class="grid-content label-font">
        <div>
          <div v-for="(event, index) in txReceipt.events" :key="index">
            <div>Event Name: {{ event.event_name }}</div>
            <div style="overflow: hidden; text-overflow: ellipsis;">
              Argument: {{ event.event_arg }}
            </div>
          </div>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script>
  import _ from 'lodash'
  import { format, distanceInWordsToNow } from 'date-fns'
  import appState from '../appState'
  import utils from '../utils'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js
  window.datefns = require('date-fns')

  export default {
    name: 'TxReceiptPanel',
    props: ['txReceipt'],
    components: {},
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
        return utils.opTotalFee(opFeeAmount, gasCount, gasPrice)
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
