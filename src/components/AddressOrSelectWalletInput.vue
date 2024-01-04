<template>
  <div class="xps-address-or-select-wallet-input">
    <div v-if="currentAddress && walletUnlocked">
      <el-form-item
        v-bind:label="$t('keystoreInput.from_address')"
        ng-if="false"
        class="-address-select-panel"
        prop="currentAddress"
        style="text-align: left;"
      >
        <span class="label-font -address-show-label">{{ currentAddress }}</span>
        <span
          style="font-size: 12px;"
          class="-change-wallet-btn"
          v-on:click="changeWallet"
          >{{ $t('keystoreInput.change_wallet') }}</span
        >
      </el-form-item>
      <div class="clearfix"></div>
    </div>
    <div v-if="!currentAddress || !walletUnlocked">
      <el-form-item
        v-bind:label="$t('keystoreInput.select_wallet')"
        prop="keystoreFile"
      >
        <KeystoreInput
          @select-file="onSelectKeystoreFile"
          :filename="filename"
        ></KeystoreInput>
      </el-form-item>
      <el-form-item
        v-bind:label="$t('keystoreInput.wallet_password')"
        prop="password"
      >
        <el-input
          v-bind:placeholder="$t('keystoreInput.please_input_wallet_password')"
          type="password"
          v-model="unlockWalletForm.password"
          style="width: 100pt;"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          class="-unlock-keystore-file-btn"
          v-on:click="toUnlockKeystoreFile"
          >{{ $t('keystoreInput.unlock_now') }}</el-button
        >
      </el-form-item>
      <el-form-item
        v-if="walletJsonAccounts && unlockWalletForm.walletAccountsToSelect"
        label="Account"
      >
        <el-select
          v-model="unlockWalletForm.selectedWalletAccount"
          placeholder="Select Account"
        >
          <el-option
            v-for="item in walletJsonAccounts"
            :key="item.addr"
            :label="item.address"
            :value="item"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="
          walletJsonAccounts &&
            unlockWalletForm.walletAccountsToSelect &&
            unlockWalletForm.selectedWalletAccount
        "
      >
        <el-button
          type="primary"
          class="-unlock-keystore-file-btn"
          v-on:click="toOpenWalletAfterSelectWalletAccount"
          >Open</el-button
        >
      </el-form-item>
    </div>
  </div>
</template>

<script>
  import appState from '../appState'
  import utils from '../utils'
  import FileInput from './FileInput.vue'
  import KeystoreInput from './KeystoreInput.vue'
  let {
    PrivateKey,
    key,
    TransactionBuilder,
    TransactionHelper,
    WalletAccountUtil,
  } = xps_js

  export default {
    name: 'AddressOrSelectWalletInput',
    components: { FileInput, KeystoreInput },
    data() {
      return {
        walletUnlocked: false,
        filename: null,
        unlockWalletForm: {
          walletAccountsToSelect: false,
        },
        walletJsonAccounts: [],
      }
    },
    created() {
      if (this.currentAddress) {
        this.walletUnlocked = true
      }
    },
    methods: {
      changeWallet() {
        appState.changeCurrentTab('my_wallet')
      },
      onSelectKeystoreFile(keyJson, filename, isWalletJson) {
        this.unlockWalletForm.keystoreFileJson = keyJson
        this.unlockWalletForm.keystoreFile = filename
        this.unlockWalletForm.isWalletJson = isWalletJson
      },
      async toUnlockKeystoreFile() {
        let password = this.unlockWalletForm.password.trim()
        if (password < 8 || password > 30) {
          this.showError(
            this.$t('keystoreInput.wallet_password_length_invalid')
          )
          return
        }
        try {
          const currentAccount = await appState.unLock(password)
          appState.changeCurrentAccount(currentAccount)
          this.changeWallet()
        } catch (error) {
          this.showError(error)
        }
      },
      toOpenWalletAfterSelectWalletAccount() {
        const account = this.unlockWalletForm.selectedWalletAccount
        if (!account) {
          this.showError('please select account')
          return
        }
        try {
          const password = this.unlockWalletForm.password || ''
          const keyInfo = account.toKey(password)
          appState.changeCurrentAccount(account)
          // save to storage
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('keyInfo', JSON.stringify(keyInfo))
              localStorage.setItem('keyPassword', password)
            }
          } catch (e) {
            console.error(e)
          }
          try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
              chrome.storage.local.set({ keyInfo: keyInfo }, function() {})
              messageToBackground('newWallet', 'false')
            }
          } catch (e) {
            console.error(e)
          }
          this.showSuccess(this.$t('dialogs.unlock_successfully'))
          this.walletUnlocked = true
          this.$emit('change-current-account', account)
          this.opened = true
        } catch (e) {
          this.showError(e)
        }
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
      showError(e) {
        e = utils.getShowErrorMessage(e)
        this.$message({
          showClose: true,
          message: e,
          type: 'error',
        })
      },
    },
    props: ['currentAddress'],
  }
</script>

<style lang="less">
  .xps-address-or-select-wallet-input {
    .-unlock-keystore-file-btn {
      width: 150pt;
      height: 30pt;
      color: white;
      font-size: 10pt;
      background: linear-gradient(#8a7ee7, #6555df);
      border: 0;
      border-radius: 0;
      margin-left: -80pt;

      &:hover {
        background: linear-gradient(#8a7ee7, #6555df);
        opacity: 0.8;
      }
    }
    .-address-show-label {
      // padding-left: 50pt;
      float: left;
    }
    .-change-wallet-btn {
      color: #a64eb5;
      float: left;
      padding-left: 10pt;
    }
    .-address-select-panel {
      text-align: center !important;
      .el-form-item__content {
        display: inline-block;
        margin-left: 0 !important;
      }
    }
  }
  @media (max-width: 600px) {
    .xps-address-or-select-wallet-input {
      max-width: 400px;
    }
  }
</style>
