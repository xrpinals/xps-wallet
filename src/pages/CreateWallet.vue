<template>
  <div>
    <div v-if="!!!type" class="xps-main-container xps-create-wallet-container">
      <div class="-create-wallet-title">{{ $t('createWalletPage.title') }}</div>
      <el-form
        :model="createWalletForm"
        status-icon
        ref="createWalletForm"
        class="xps-create-wallet-inner-container"
      >
        <el-form-item class="-password-panel" prop="password">
          <el-input
            class="-input-password"
            v-bind:placeholder="$t('createWalletPage.please_set_password')"
            type="password"
            v-model="createWalletForm.password"
            autocomplete="off"
            style="width: 100pt;"
          ></el-input>
          <div class="-wallet-password-rule-desc -rule-panel">
            <p style="height: auto;">
              {{ $t('createWalletPage.please_save_wallet_file_line1') }}
            </p>
            <p>{{ $t('createWalletPage.passworld_length_notice') }}</p>
          </div>
        </el-form-item>
        <!-- <el-form-item :label="$t('createWalletPage.import_raw_private_key')">
          <el-input
            class="-input-password"
            v-bind:placeholder="
              $t('createWalletPage.import_private_key_placeholder')
            "
            type="text"
            v-model="createWalletForm.importRawPrivateKey"
            autocomplete="off"
            style="width: 100pt;"
          ></el-input>
        </el-form-item> -->

        <el-form-item>
          <el-button
            type="primary"
            class="xpswallet-form-btn"
            @click="type = 'import'"
            :disabled="!validPwd"
            >{{ $t('createWalletPage.import_wallet') }}</el-button
          >
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="xpswallet-form-btn"
            @click="generateMnemonic"
            :disabled="!validPwd"
            >{{ $t('createWalletPage.create_wallet') }}</el-button
          >
        </el-form-item>
      </el-form>
    </div>

    <div
      v-if="type === 'create'"
      class="xps-main-container xps-create-wallet-container xps-phrase-wrapper"
    >
      <div class="title">
        {{ $t('createWalletPage.secret_recovery_phrase') }}
      </div>
      <div class="tip">
        {{ $t('createWalletPage.secret_recovery_phrase_tip') }}
      </div>
      <div class="copy" @click="copyMnemonic">
        {{ $t('createWalletPage.copy') }}
      </div>
      <div class="content">
        <div
          v-for="(phrase, index) in createWalletData.mnemonic.split(' ')"
          :key="index"
        >
          <div>{{ index + 1 }}</div>
          <div>{{ phrase }}</div>
        </div>
      </div>
      <el-button type="primary" v-on:click="generateAccount">{{
        $t('createWalletPage.next_step')
      }}</el-button>
    </div>

    <div
      v-if="type === 'import'"
      class="xps-main-container xps-create-wallet-container xps-phrase-wrapper"
    >
      <div class="title">
        {{ $t('createWalletPage.secret_recovery_phrase') }}
      </div>
      <div class="tip">
        {{ $t('createWalletPage.secret_recovery_phrase_restore_tip') }}
      </div>
      <div class="input-content">
        <div v-for="(phrase, index) in Array(12)" :key="phrase">
          <div>{{ index + 1 }}</div>
          <el-input v-model="inputMnemonic[index]"></el-input>
        </div>
      </div>
      <el-button
        key="submitMnemonic"
        type="primary"
        v-on:click="
          initWalletDataByMnemonic(inputMnemonic.join(' '))
          generateAccount()
        "
        :disabled="!inputMnemonic.every(Boolean)"
        >{{ $t('createWalletPage.next_step') }}</el-button
      >
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import copy from 'copy-to-clipboard'
  import BIP32Factory from 'bip32'
  const ecc = require('@bitcoin-js/tiny-secp256k1-asmjs')
  import appState from '../appState'
  import utils from '../utils'
  const bip39 = require('bip39')
  const bitcoin = require('bitcoinjs-lib')

  export default {
    name: 'CreateWallet',
    data() {
      return {
        created: false,
        type: '',
        createdAccount: null,
        createdAccountKeyString: null,
        createWalletForm: {},
        createWalletData: {
          node: undefined,
          mnemonic: '',
          keyPair: '',
          privateKey: '',
          publicKey: '',
        },
        inputMnemonic: ['', '', '', '', '', '', '', '', '', '', '', ''],
      }
    },
    computed: {
      validPwd: function() {
        let password = (this.createWalletForm.password || '').trim()
        if (password.length < 8 || password.length > 30) {
          return false
        }

        return true
      },
    },
    created() {},
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
      generateMnemonic() {
        let mnemonic = bip39.generateMnemonic()
        this.initWalletDataByMnemonic(mnemonic)
        this.type = 'create'
      },
      initWalletDataByMnemonic(mnemonic) {
        let seed = bip39.mnemonicToSeedSync(mnemonic)
        const bip32 = BIP32Factory(ecc)
        let node = bip32.fromSeed(seed)
        let keyPair = node.derivePath("m/44'/0'/0'/0")

        const privateKey = keyPair.toWIF()
        const publicKey = keyPair.publicKey

        this.createWalletData = {
          node,
          mnemonic,
          keyPair,
          privateKeyBuffer: keyPair.privateKey,
          privateKey,
          publicKey,
        }
      },
      copyMnemonic() {
        copy(this.createWalletData.mnemonic)
        this.showSuccess('Copied successfully')
      },
      async generateAccount() {
        const pwd = this.createWalletForm.password.trim()
        const { address } = bitcoin.payments.p2pkh({
          network: appState.IS_PROD
            ? bitcoin.networks.bitcoin
            : bitcoin.networks.testnet,
          pubkey: this.createWalletData.publicKey,
        })
        let account = account_utils.NewAccount(this.createWalletData.privateKey)
        account.address = address

        const walletInfo = {
          pwd,
          account,
          currentDerivePathIndex: 0,
          addresses: [
            {
              address,
              privateKey: this.createWalletData.privateKey,
              publicKey: this.createWalletData.publicKey,
            },
          ],
          mnemonic: this.createWalletData.mnemonic,
        }

        await appState.saveWalletInfo(pwd, walletInfo)

        appState.changeCurrentTab('my_wallet')
      },
    },
  }
</script>

<style lang="less">
  .xps-create-wallet-container1 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-create-wallet-container2 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-create-wallet-container {
    min-width: 400px;
    min-height: 266pt;
  }
  .xps-create-wallet-inner-container,
  .xps-create-wallet-done-inner-container {
    width: 400pt;
    max-width: 100%;
    margin: 10pt auto 0 auto;
    label {
      font-size: 10pt;
      color: #261932;
    }
    .el-input {
      width: 220pt !important;
    }
    .el-input__inner {
      text-align: center;
      border: 0 !important;
      border-bottom: solid 1px #cccccc !important;
      border-radius: 0 !important;
    }
    .-create-wallet-title {
      font-size: 20pt;
      color: #261932;
    }
    .-wallet-password-rule-desc,
    .-rule-panel {
      width: 220pt;
      font-size: 8pt;
      color: #ff0000;
      margin: 10pt auto 0;
      text-align: center;
      p {
        padding: 0;
        margin: 4px;
        line-height: 18px;
        height: 18px;
      }
    }
  }
  .xps-phrase-wrapper {
    text-align: center;

    .title {
      font-size: 14pt;
      font-weight: bold;
    }
    .tip {
      font-size: 12pt;
      color: orange;
      margin: 4pt auto;
    }
    .copy {
      font-size: 10pt;
      color: gray;
      cursor: pointer;
    }
    .content,
    .input-content {
      width: 100%;
      max-width: 250pt;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: repeat(6, minmax(0, 1fr));
      gap: 12pt;
      margin: 20pt auto;
      > div {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        gap: 8pt;
        :first-child {
          width: 10pt;
          flex-shrink: 0;
        }
        :last-child {
          width: 100%;
          flex: 1;
        }
      }
    }

    .content > div {
      :last-child {
        color: white;
        background: gray;
        padding: 5pt 0;
        border-radius: 4pt;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }
</style>
