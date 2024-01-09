<template>
  <div>
    <el-row
      class="-info-line-row"
      v-for="(val, key) in operation"
      :key="key"
      v-if="key !== 'fee'"
    >
      <el-col :span="4">
        <div class="grid-content label-font">{{ key }}</div>
      </el-col>
      <el-col :span="20">
        <div class="grid-content label-font">
          <div>{{ val }}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="4">
        <div class="grid-content label-font">Fee</div>
      </el-col>
      <el-col :span="20">
        <div class="grid-content label-font">
          <div>{{ opTotalFee(operation.fee.amount, 0, 0) }} BTC</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { format, distanceInWordsToNow } from 'date-fns'
  import appState from '../appState'
  import utils from '../utils'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js
  window.datefns = require('date-fns')

  export default {
    name: 'SimpleOpDetail',
    props: ['operation'],
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
