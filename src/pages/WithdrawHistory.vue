<template>
  <div class="xps-main-container">
    <el-table
      :data="txns"
      :row-style="{ fontSize: '10px' }"
      empty-text="no withdraw transaction"
      size="mini"
    >
      <el-table-column prop="from" label="From">
        <template slot-scope="scope">
          <i
            v-if="scope.row.owned"
            style="margin-right: 1px"
            class="el-icon-s-custom"
          ></i>
          <span @click="copyText(scope.row.from)">{{ scope.row.from }}</span
          ><i style="margin-left: 5px;" class="el-icon-copy-document"> </i>
        </template>
      </el-table-column>
      <el-table-column prop="to" label="To">
        <template slot-scope="scope">
          <span @click="copyText(scope.row.to)">{{ scope.row.to }}</span
          ><i style="margin-left: 5px;" class="el-icon-copy-document"> </i>
        </template>
      </el-table-column>
      <el-table-column
        width="110"
        prop="amount"
        label="Amount"
      ></el-table-column>
      <el-table-column width="90" prop="status" label="Status">
        <template slot-scope="scope">
          <el-tag
            size="mini"
            :type="'processing' === scope.row.status ? 'primary' : 'info'"
            >{{ scope.row.status }}</el-tag
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
  import appState from '../appState.js'
  import copy from 'copy-to-clipboard'
  export default {
    name: 'WithdrawHistory',
    data() {
      return {
        waitingTxns: [],
        processingTxns: [],
        tableData: [],
      }
    },
    computed: {
      txns() {
        return [...this.processingTxns, ...this.waitingTxns]
      },
    },
    created() {
      const walletInfo = appState.getWalletInfo()
      const addresses = !!walletInfo ? walletInfo.addresses : []

      const nodeClient = appState.getNodeClient()
      nodeClient.getCrosschainTransaction('0').then((data) => {
        this.waitingTxns =
          (data.filter((item) => item.op_type === 61) || []).map((item) => {
            let from = ''
            let to = ''
            let amount = ''

            const op = item.real_transaction.operations.filter((_data) =>
              _data.includes(61)
            )

            if (op[0] && op[0][1]) {
              const opData = op[0][1]
              from = opData.withdraw_account
              to = opData.crosschain_account
              amount = opData.amount + ' ' + opData.asset_symbol
            }
            return {
              from,
              to,
              amount,
              status: 'waiting',
              owned: addresses.some((add) => add.address === from),
            }
          }) || []
      })
      nodeClient.getCrosschainTransaction('1').then((data) => {
        this.processingTxns =
          (data.filter((item) => item.op_type === 61) || []).map((item) => {
            let from = ''
            let to = ''
            let amount = ''

            const op = item.real_transaction.operations.filter((_data) =>
              _data.includes(61)
            )

            if (op[0] && op[0][1]) {
              const opData = op[0][1]
              from = opData.withdraw_account
              to = opData.crosschain_account
              amount = opData.amount + ' ' + opData.asset_symbol
            }
            return {
              from,
              to,
              amount,
              status: 'processing',
              owned: addresses.some((add) => add.address === from),
            }
          }) || []
      })
    },
    methods: {
      showSuccess(info) {
        this.$message({
          showClose: true,
          message: (info || 'success').toString(),
          type: 'success',
        })
      },
      copyText(text) {
        copy(text)
        this.showSuccess('Copied successfully')
      },
    },
  }
</script>
<style lang="less" scoped></style>
