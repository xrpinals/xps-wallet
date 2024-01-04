<template>
  <div class="xps-account-balances-side-bar">
    <el-row style="margin-bottom: 20pt;">
      <el-col :span="8">
        <div class="grid-content -balance-title-panel">
          <div class="label-font">
            {{ $t('accountBalances.wallet_balance') }}
          </div>
        </div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content -switch-panel">
          <el-switch v-model="hideZeroAssets"></el-switch>
          <span class="label-font">{{
            $t('accountBalances.hide_zero_balances')
          }}</span>
        </div>
      </el-col>
    </el-row>
    <div class="-account-balances-panel">
      <div
        v-for="(balance, index) in filterBalances(
          accountBalances,
          hideZeroAssets,
          showAccountBalancesLimit
        )"
        class="-account-balance"
        :key="index"
      >
        <div class="-asset-symbol-label">{{ balance.assetSymbol }}</div>
        <div class="-asset-amount-label">
          {{ balance.amountNu.toFixed(balance.precision) }}
        </div>
      </div>
      <div
        v-if="
          showAccountBalancesLimit &&
            filterBalances(accountBalances, hideZeroAssets, null).length >
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
    <div class="-account-balances-panel" v-if="accountTokenBalances.length > 0">
      <h4 style="font-size: 16px; padding: 10px 0; color: #a99eb4;">Tokens</h4>
      <div
        v-for="(balance, index) in filterTokenBalances(
          accountTokenBalances,
          hideZeroAssets,
          showAccountBalancesLimit
        )"
        class="-account-balance"
        @click="toTransferToken(balance)"
        :key="index"
      >
        <div class="-asset-symbol-label">{{ balance.token_symbol }}</div>
        <div class="-asset-amount-label">
          {{
            (parseFloat(balance.amount) / balance.precision).toFixed(
              balance.precision.toString().length - 1
            )
          }}
        </div>
      </div>
      <div
        v-if="
          showAccountBalancesLimit &&
            filterTokenBalances(accountTokenBalances, hideZeroAssets, null)
              .length > showAccountBalancesLimit
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

    <!-- begin dialogs -->
    <el-dialog
      title="Transfer Token"
      :visible.sync="transferTokenDialogVisible"
      width="500px"
      center
    >
      <div>
        <el-form :model="transferTokenForm">
          <el-form-item label="Token" :label-width="'120'">
            <span>{{ transferTokenForm.token_symbol }}</span>
          </el-form-item>
          <el-form-item label="Token Contract" :label-width="'120'">
            <span>{{ transferTokenForm.contract_addr }}</span>
          </el-form-item>
          <el-form-item label="To address" :label-width="'120'">
            <el-input
              v-model="transferTokenForm.to"
              placeholder="input your address"
              autocomplete="on"
            ></el-input>
          </el-form-item>
          <el-form-item label="Amount" :label-width="'120'">
            <el-input
              v-model="transferTokenForm.amount"
              :placeholder="'max: ' + transferTokenForm.max_amount"
              autocomplete="off"
            ></el-input>
          </el-form-item>
          <!-- <el-form-item label="Memo" :label-width="'120'">
            <el-input
              v-model="transferTokenForm.memo"
              autocomplete="off"
            ></el-input>
          </el-form-item> -->
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="transferTokenDialogVisible = false"
          >Cancel</el-button
        >
        <el-button type="primary" @click="doTransferToken(transferTokenForm)"
          >OK</el-button
        >
      </span>
    </el-dialog>
    <!-- end dialogs -->
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
    name: 'AccountBalancesSidebar',
    props: [
      'accountBalances',
      'accountTokenBalances',
      'isMyWallet',
      'defaultLimit',
    ],
    components: {},
    data() {
      return {
        hideZeroAssets: true,
        showAccountBalancesLimit: null,
        transferTokenForm: {},
        transferTokenDialogVisible: false,
      }
    },
    created() {
      this.showAccountBalancesLimit = this.defaultLimit
    },
    watch: {},
    mounted() {},
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
      filterBalances(balances, skipZero = false, limit = null) {
        let filtered = balances
        if (skipZero) {
          filtered = balances.filter((item) => item.amount > 0)
        }
        if (limit) {
          filtered = filtered.slice(0, limit)
        }
        if (filtered.length === 0) {
          filtered = [utils.emptyBalance]
        }
        return filtered
      },
      filterTokenBalances(balances, skipZero = false, limit = null) {
        let filtered = balances
        if (skipZero) {
          filtered = balances.filter((item) => parseFloat(item.amount) > 0)
        }
        if (limit) {
          filtered = filtered.slice(0, limit)
        }
        if (filtered.length === 0) {
          filtered = []
        }
        return filtered
      },
      showAllBalances() {
        this.showAccountBalancesLimit = null
      },
      toTransferToken(tokenBalance) {
        if (!this.isMyWallet) {
          return
        }
        this.transferTokenForm = {
          token_symbol: tokenBalance.token_symbol,
          contract_addr: tokenBalance.contract_addr,
          to: null,
          amount: null,
          memo: null,
          precision: tokenBalance.precision,
          max_amount: (
            parseFloat(tokenBalance.amount) / tokenBalance.precision
          ).toFixed(tokenBalance.precision.toString().length - 1),
        }
        this.transferTokenDialogVisible = true
      },
      doTransferToken(form) {
        const to = (form.to || '').trim()
        if (!to) {
          this.showError('invalid to address')
          return
        }
        const amount = new BigNumber(form.amount)
        if (amount.isNaN() || amount.lte(0) || amount.gt(form.max_amount)) {
          this.showError('invalid amount to transfer')
          return
        }
        this.transferTokenDialogVisible = false
        let contractArg =
          to + ',' + amount.multipliedBy(form.precision).toFixed(0)
        if (form.memo) {
          contractArg = contractArg + ',' + form.memo
        }
        appState.pushFlashTx({
          to: form.contract_addr,
          contractApi: 'transfer',
          contractArg: contractArg,
          gasLimit: 10000,
        })
        appState.changeCurrentTab('contract', [])
      },
    },
  }
</script>

<style lang="less">
  .xps-account-balances-side-bar {
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
    .-balance-title-panel {
      text-align: left;
    }
    .-switch-panel {
      text-align: right;
    }
  }
</style>
