<template>
  <div>
    <div class="xps-main-container xps-transfer-container">
      <!-- transfer panel -->
      <div class="-left-side">
        <el-form
          :model="transferForm"
          status-icon
          ref="transferForm"
          label-width="80pt"
          class="xps-transfer-inner-container"
        >
          <AddressOrSelectWalletInput
            :currentAddress="currentAccount && currentAccount.address"
          ></AddressOrSelectWalletInput>

          <el-form-item label="Layer 1 Balance">
            <div style="padding-left: 15px;" class="label-font">
              {{ balance }} BTC
            </div>
          </el-form-item>
          <el-form-item label="Deposit Amount" prop="amount">
            <div style="display: flex;align-items: center;">
              <AssetInput
                style="flex: 1;"
                v-model="transferForm.amount"
                :precision="8"
              ></AssetInput>
              <span class="label-font">BTC</span>
            </div>
          </el-form-item>
          <el-form-item v-bind:label="$t('transferPage.fee')" prop="fee">
            <div style="display: flex;align-items: center;">
              <div style="flex: 1;">
                <el-radio-group
                  size="mini"
                  v-model="feeType"
                  @input="onChangeFeeType"
                >
                  <el-radio class="label-font" label="economyFee"
                    >economy</el-radio
                  >
                  <el-radio class="label-font" label="hourFee"
                    >hourFee</el-radio
                  >
                  <el-radio class="label-font" label="halfHourFee"
                    >halfHour</el-radio
                  >
                  <el-radio class="label-font" label="fastestFee"
                    >fastest</el-radio
                  >
                </el-radio-group>
              </div>

              <div style="width: 100px;display: flex;align-items: center;">
                <el-input type="number" v-model="transferForm.fee"></el-input>
                <span class="label-font">Sat/B</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="xpswallet-form-btn"
              v-on:click="deposit"
              style="margin-left: -50pt;"
              :disabled="disabledBtn"
              :loading="loading"
              >Deposit immediately</el-button
            >
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import axios from 'axios'
  import appState from '../appState'
  import utils from '../utils'
  import KeystoreInput from '../components/KeystoreInput.vue'
  import AddressOrSelectWalletInput from '../components/AddressOrSelectWalletInput.vue'
  import AssetInput from '../components/AssetInput.vue'
  import mempoolJS from '@mempool/mempool.js'
  import { ECPairFactory } from 'ecpair'
  const bitcoin = require('bitcoinjs-lib')
  const ecc = require('@bitcoin-js/tiny-secp256k1-asmjs')

  const mempoolJSConfig = appState.IS_PROD
    ? {
        hostname: 'mempool.space',
      }
    : {
        hostname: 'mempool.space',
        network: 'testnet',
      }

  export default {
    name: 'Deposit',
    components: { KeystoreInput, AddressOrSelectWalletInput, AssetInput },
    data() {
      return {
        loading: false,
        depositDestAddress: '',
        currentAccount: '',
        balance: 0,
        fees: {},
        addressTxsUtxo: [],
        feeType: '',
        transferForm: {
          amount: '',
          fee: '',
        },
      }
    },
    created() {
      this.getFee()
      this.currentAccount = appState.getCurrentAccount()

      const nodeClient = appState.getNodeClient()
      nodeClient.getCurrentMultisigAccount().then((data) => {
        this.depositDestAddress = data.bind_account_hot
      })
    },
    watch: {
      currentAccount(val) {
        !!val.address && this.getBalance(val.address)
      },
    },
    computed: {
      disabledBtn() {
        if (
          !!!this.balance ||
          !!!this.transferForm.amount ||
          !!!this.transferForm.fee
        )
          return true

        if (
          BigNumber(this.transferForm.amount || 0).isGreaterThanOrEqualTo(
            this.balance
          ) ||
          BigNumber(this.transferForm.fee || 0).isLessThanOrEqualTo(0)
        )
          return true

        return false
      },
    },
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
      async getBalance(address) {
        const {
          bitcoin: { addresses, transactions },
        } = mempoolJS(mempoolJSConfig)
        const addressTxsUtxo = await addresses.getAddressTxsUtxo({ address })
        const txHexData = await Promise.all(
          addressTxsUtxo.map((utxo) =>
            transactions.getTxHex({ txid: utxo.txid })
          )
        )
        this.addressTxsUtxo = addressTxsUtxo
          .sort((a, b) => b.value - a.value)
          .map((utxo, index) => {
            utxo.txHex = txHexData[index]
            return utxo
          })
        this.balance = (
          (addressTxsUtxo || []).reduce(
            (pre, current) => BigNumber(pre).plus(current.value || 0),
            0
          ) || 0
        )
          .div(10 ** 8)
          .toString()
      },
      async getFee() {
        const {
          bitcoin: { fees },
        } = mempoolJS(mempoolJSConfig)

        this.fees = await fees.getFeesRecommended()
      },
      onChangeFeeType(type) {
        this.feeType = type
        this.transferForm.fee = BigNumber(this.fees[type] || '0').toFixed()
      },
      async deposit() {
        this.loading = true

        try {
          const amount = BigNumber(this.transferForm.amount).multipliedBy(
            10 ** 8
          )
          const fee = BigNumber(this.transferForm.fee)

          const OVERHEAD_SIZE = 10
          const INPUT_SIZE = 148
          const OUTPUT_SIZE = 34
          const MAX_TRX_SIZE = 100 * 1000

          let isOk = false
          let trxBytes = BigNumber(0)
          let utxoSpent = BigNumber(0)
          let feeSpent = BigNumber(0)
          const inputs = []

          for (let index = 0; index < this.addressTxsUtxo.length; index++) {
            const utxo = this.addressTxsUtxo[index]
            if (utxo.value <= 546) {
              continue
            }

            utxoSpent = utxoSpent.plus(utxo.value)
            inputs.push(utxo)
            trxBytes = BigNumber(inputs.length)
              .multipliedBy(INPUT_SIZE)
              .plus(OUTPUT_SIZE * 2)
              .plus(OVERHEAD_SIZE)

            if (trxBytes.isGreaterThan(MAX_TRX_SIZE)) {
              showError('Too large trx size')
              return
            }

            feeSpent = trxBytes.multipliedBy(fee)

            if (utxoSpent.isGreaterThanOrEqualTo(feeSpent.plus(amount))) {
              isOk = true
              break
            }
          }

          if (!isOk) {
            showError('Not enough balance')
            return
          }

          const ECPair = ECPairFactory(ecc)
          const alice = ECPair.fromPrivateKey(
            this.currentAccount.getPrivateKey()
          )
          const psbt = new bitcoin.Psbt({
            network: appState.IS_PROD
              ? bitcoin.networks.bitcoin
              : bitcoin.networks.testnet,
          })
          psbt.setVersion(1)

          psbt.addInputs(
            inputs.map((input) => ({
              hash: input.txid,
              index: input.vout,
              sequence: 0xffffffff,
              nonWitnessUtxo: Buffer.from(input.txHex, 'hex'),
            }))
          )
          psbt.addOutput({
            address: this.depositDestAddress,
            value: amount.toNumber(),
          })

          const change = utxoSpent.minus(amount).minus(feeSpent)
          if (change.isGreaterThan(546)) {
            psbt.addOutput({
              address: this.currentAccount.address,
              value: change.toNumber(),
            })
          }

          psbt.signAllInputs(alice)
          psbt.finalizeAllInputs()

          try {
            const txData = await axios.post(
              appState.IS_PROD
                ? 'http://api.xrpinals.com:1222/mempool/api/tx'
                : 'http://api.xrpinals.com:1222/mempool/testnet/api/tx',
              psbt.extractTransaction().toHex(),
              { headers: { 'Content-Type': 'text/html' } }
            )

            const txid = txData.data
            this.getBalance(this.currentAccount.address)
            const url = `https://mempool.space${
              appState.IS_PROD ? '' : '/testnet'
            }/tx/${txid}`
            this.$alert(
              `<a style="word-break: break-all;" href="${url}" target="_blank">${url}</a>`,
              'Deposit successful',
              { dangerouslyUseHTMLString: true, showConfirmButton: false }
            )
          } catch (error) {
            console.error('asdasd', error)
          }
        } catch (error) {
          console.error(error)
        } finally {
          this.loading = false
        }
      },
    },
  }
</script>

<style lang="less">
  .xps-transfer-container {
    width: 100%;
    max-width: calc(100% - 40px);
    min-height: 350pt;
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
    .-left-side {
      background: white;
      height: 100%;
    }
    .-asset-symbol-label {
      color: #a99eb4;
      font-size: 7pt;
    }
    .-asset-amount-label {
      color: #261932;
      font-size: 8pt;
      margin-left: 4px;
    }
    .-address-row {
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
      display: flex;
      align-items: center;
    }
    .transfer-asset-select {
      .el-input {
        width: 40pt !important;
        font-size: 8pt;
        margin-left: 10pt;
        input {
          font-size: 8pt;
          padding: 0;
          text-indent: 5pt;
        }
        .el-input__suffix {
          font-size: 8pt;
          width: 15pt;
        }
      }
    }
    .el-form-item__label {
      color: #a99eb4;
      font-size: 8pt;
    }
    .value-label {
      color: #261932;
      font-size: 8pt;
    }
  }

  .xps-transfer-inner-container,
  .xps-transfer-done-inner-container {
    width: 100%;
    label {
      font-size: 10pt;
      color: #261932;
    }
    .el-input__inner {
      border: 0 !important;
      border-bottom: solid 1px #cccccc !important;
      border-radius: 0 !important;
    }
    .-transfer-title {
      font-size: 20pt;
      color: #261932;
    }
    .-wallet-password-rule-desc,
    .-rule-panel {
      font-size: 8pt;
      color: #ff0000;
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
</style>
