<template>
  <div>
    <div class="xps-main-container xps-broadcast-tx-container">
      <div class="-broadcast-tx-title">{{ $t('broadcastTxPage.title') }}</div>
      <div v-if="!broadcastTxDone">
        <el-form
          :model="broadcastTxForm"
          status-icon
          ref="broadcastTxForm"
          label-width="90pt"
          class="xps-broadcast-tx-inner-container"
        >
          <div>
            <el-input
              class="-input-address"
              v-bind:placeholder="$t('broadcastTxPage.please_input_content')"
              type="textarea"
              :rows="5"
              v-model="broadcastTxForm.content"
              style="width: 80%;"
            ></el-input>
          </div>

          <div style="margin-top: 30pt;">
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              v-on:click="toBroadcastTx(broadcastTxForm.content)"
              >{{ $t('broadcastTxPage.broadcast_now') }}</el-button
            >
          </div>
        </el-form>
      </div>
      <div v-if="broadcastTxDone" class="xps-broadcast-tx-done-container">
        <div class="-broadcast-tx-title">Broadcast result:</div>
        <div v-if="broadcastTxForm.broadcastTxResult">
          <p class="-signed-text">{{ broadcastTxForm.broadcastTxResult }}</p>
        </div>
        <div v-if="!broadcastTxForm.broadcastTxResult">Broadcast failed</div>
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
    name: 'CheckTx',
    components: {
      AccountInfo,
      ContractInfoPanel,
      TransactionInfo,
      AddressOrSelectWalletInput,
    },
    data() {
      return {
        broadcastTxForm: {},

        broadcastTxDone: false,
        data: null,
        broadcastTxResult: null,
        currentAccountInfo: {},
        currentAccount: null,
      }
    },
    created() {
      const account = appState.getCurrentAccount()
      this.currentAccount = account
      if (account) {
        this.currentAddress = account.address
        this.loadCurrentAccountInfo()
      }
    },
    mounted() {
      const flashTxMessage = appState.getFlashTxOnce() // TODO: use getFlashBroadcastTxOnce to replace
      if (flashTxMessage) {
        this.onFlashTxMessage(flashTxMessage)
      }
      appState.onPushFlashTxMessage(this.onFlashTxMessage)

      if (this.broadcastTxForm.content) {
        this.toBroadcastTx(this.broadcastTxForm.content)
      }
    },
    beforeDestroy() {
      appState.offPushFlashTxMessage(this.onFlashTxMessage)
      this.destroyed = true
      if (this.closeTimer) {
        clearTimeout(this.closeTimer)
        this.closeTimer = null
      }
    },
    methods: {
      onFlashTxMessage(msg) {
        const rawData = msg
        const content = rawData.rawData
        this.broadcastTxForm.content = content
        this.$forceUpdate()
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
      toBroadcastTx(content) {
        try {
          if (!content || content.length < 1) {
            this.showError("Can't sign empty text")
            return
          }
          let txJson
          try {
            content = content.trim()
            txJson = JSON.parse(content)
            if (content[0] !== '{') {
              throw new Error()
            }
          } catch (e) {
            this.showError('tx to broadcast must be valid json')
            return
          }

          const nodeClient = appState.getNodeClient()
          nodeClient.apiInstance
            .network_api()
            .exec('broadcast_transaction_synchronous', [txJson])
            .then((data) => {
              this.connected = true
              if (data instanceof String) {
                this.broadcastTxForm.broadcastTxResult = 'txid: ' + data
              } else {
                this.broadcastTxForm.broadcastTxResult =
                  'result: ' + JSON.stringify(data)
              }
            }, this.showError)
        } catch (e) {
          this.showError('some error happen. maybe invalid tx hex')
        }
      },
    },
  }
</script>

<style lang="less">
  .xps-broadcast-tx-container1 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-broadcast-tx-container2 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-broadcast-tx-container,
  .xps-broadcast-tx-done-container {
    min-width: 400px;
    min-height: 266pt;
    .-broadcast-tx-title {
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
    .el-switch__core {
      width: 40px !important;
    }
  }

  .chrome-ext-app-container {
    .xps-broadcast-tx-container {
      padding-left: 0;
      padding-right: 0;
    }
  }
</style>
