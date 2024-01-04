<template>
  <div>
    <div class="xps-main-container xps-customize-network-container">
      <div class="-customize-network-title">
        {{ $t('customizeNetworkPage.title') }}
      </div>
      <div v-if="!customizeNetworkDone">
        <el-form
          :model="customizeNetworkForm"
          status-icon
          ref="customizeNetworkForm"
          label-width="90pt"
          class="xps-customize-network-inner-container"
        >
          <el-form-item v-bind:label="'Chain ID'" prop="chainId">
            <el-input
              class="-input-chain-id"
              type="text"
              v-model="customizeNetworkForm.chainId"
              style="width: 100pt;"
            ></el-input>
          </el-form-item>
          <el-form-item v-bind:label="'RPC URL'" prop="url">
            <el-input
              class="-input-url"
              type="text"
              placeholder="eg. ws://127.0.0.1:8090"
              v-model="customizeNetworkForm.url"
              style="width: 100pt;"
            ></el-input>
          </el-form-item>

          <div style="margin-top: 30pt;">
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              v-on:click="toAddNetwork(customizeNetworkForm)"
              >{{ $t('customizeNetworkPage.add_network') }}</el-button
            >
          </div>
        </el-form>
      </div>
      <div
        v-if="customizeNetworkDone"
        class="xps-customize-network-done-container"
      >
        <div v-if="customizeNetworkForm.success">
          <p class="-signed-text">Successfully!</p>
        </div>
        <div v-if="!customizeNetworkForm.success">Failed</div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import appState from '../appState'
  import AccountInfo from './AccountInfo.vue'
  import ContractInfoPanel from '../components/ContractInfoPanel.vue'
  import TransactionInfo from '../components/TransactionInfo.vue'
  import AddressOrSelectWalletInput from '../components/AddressOrSelectWalletInput.vue'
  import utils from '../utils'
  let { PrivateKey, key, TransactionBuilder, TransactionHelper } = xps_js

  export default {
    name: 'CustomizeNetwork',
    components: {
      AccountInfo,
      ContractInfoPanel,
      TransactionInfo,
      AddressOrSelectWalletInput,
    },
    data() {
      return {
        customizeNetworkForm: {
          chainId:
            '2e13ba07b457f2e284dcfcbd3d4a3e4d78a6ed89a61006cdb7fdad6d67ef0b12',
        },

        customizeNetworkDone: false,
        data: null,
        signedSignatureHex: null,
        currentAccountInfo: {},
        currentAccount: null,
        closeTimeoutMilli: 5000,
      }
    },
    created() {},
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
      showSuccess(info) {
        this.$message({
          showClose: true,
          message: (info || 'success').toString(),
          type: 'success',
        })
      },
      toAddNetwork(form) {
        const chainId = (form.chainId || '').trim()
        const url = (form.url || '').trim()
        if (!chainId) {
          this.showError(this.$t('customizeNetworkPage.please_input_chain_id'))
          return
        }
        if (!url) {
          this.showError(this.$t('customizeNetworkPage.please_input_node_url'))
          return
        }
        appState.setLocalNetwork(url, chainId)
        // TODO: 通知background.js去更新js
        window.location.reload()
      },
    },
  }
</script>

<style lang="less">
  .xps-customize-network-container1 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-customize-network-container2 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-customize-network-container,
  .xps-customize-network-done-container {
    min-width: 400px;
    min-height: 266pt;
    .-customize-network-title {
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
    .-signed-text {
      color: #a99eb4;
      font-size: 10pt;
      padding: 5pt;
      word-break: break-all;
    }
  }

  .chrome-ext-app-container {
    .xps-customize-network-container {
      padding-left: 0;
      padding-right: 0;
    }
  }
</style>
