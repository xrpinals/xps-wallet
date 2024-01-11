<template>
  <div>
    <div v-if="!opened">
      <div class="xps-main-container xps-my-wallet-container">
        <el-form
          :model="unlockWalletForm"
          ref="unlockWalletForm"
          class="xps-my-wallet-inner-container"
          @submit.native.prevent
        >
          <el-form-item prop="password">
            <el-input
              v-bind:placeholder="
                $t('myWalletPage.please_input_wallet_password')
              "
              type="password"
              v-model="unlockWalletForm.password"
              style="width: 100pt;"
              @keyup.enter.native="onUnlock"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              class="-unlock-keystore-file-btn"
              @click="onUnlock"
              :disabled="!validPwd"
              >{{ $t('myWalletPage.unlock_right_now') }}</el-button
            >
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div v-if="opened">
      <div class="xps-main-container xps-my-opened-wallet-container1">
        <el-row
          class="-address-row"
          style="display: flex;align-items: center;flex-wrap: wrap;gap: 6pt 0;"
        >
          <el-col :span="4">
            <div class="grid-content label-font">
              Account
            </div>
          </el-col>
          <el-col
            :span="10"
            style="display: flex;align-items: center;gap: 6pt;"
            class="-current-address-panel"
          >
            <el-select
              style="width: 300px;"
              v-model="currentAddress"
              size="mini"
              placeholder="Select address"
              @change="changeAddress"
            >
              <el-option
                v-for="item in addresses"
                :key="item.address"
                :label="item.address"
                :value="item.address"
              >
                <div
                  style="display: flex;align-items: center;font-size: 12px;gap: 15px;"
                >
                  <span
                    style="font-family:SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace; "
                    >{{ item.address }}</span
                  >
                  <el-tag
                    v-if="item.imported"
                    style="font-size: 8px;font-weight: normal !important;height: 16px;line-height: 13px;"
                    type="primary"
                    size="mini"
                    >imported</el-tag
                  >
                </div>
              </el-option>
            </el-select>

            <i
              style="cursor: pointer;"
              class="el-icon-copy-document"
              @click="copyAddress"
            ></i>

            <div style="padding-top: 2px;">
              <el-dropdown size="mini" @command="handleAccountSetting">
                <i
                  style="cursor: pointer;font-size: 17px;"
                  class="el-icon-setting"
                ></i>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="add"
                    >Add a new account</el-dropdown-item
                  >
                  <el-dropdown-item command="import"
                    >Import account</el-dropdown-item
                  >
                  <el-dropdown-item command="copy"
                    >Copy private key</el-dropdown-item
                  >
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </el-col>
        </el-row>
        <AccountBalancesSidebar
          style="margin-top: 20px;"
          :accountBalances="currentAccountBalances"
          :accountTokenBalances="currentAccountTokenBalances"
          :defaultLimit="showAccountBalancesLimit"
          :isMyWallet="true"
        ></AccountBalancesSidebar>
      </div>
      <AccountLockBalancesPanel
        v-if="currentAccountInfo && currentAccountInfo.name"
        :currentAccount="currentAccount"
        :accountName="currentAccountInfo.name"
        :myself="true"
        @balance-update="toUpdateAccountBalances"
      ></AccountLockBalancesPanel>
    </div>

    <el-dialog
      title="Import Account"
      :visible.sync="showImportAddressDialog"
      width="350px"
      center
    >
      <div>
        <el-input
          type="textarea"
          placeholder="Input private key"
          :autosize="{ minRows: 4, maxRows: 6 }"
          v-model="importAddressPrivateKey"
        ></el-input>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button
          type="primary"
          :disabled="!importAddressPrivateKey"
          @click="importNewAccount"
          >Import</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import _ from 'lodash'
  import appState from '../appState'
  import KeystoreInput from '../components/KeystoreInput.vue'
  import AccountBalancesSidebar from '../components/AccountBalancesSidebar.vue'
  import AccountLockBalancesPanel from '../components/AccountLockBalancesPanel.vue'
  import utils from '../utils'
  import copy from 'copy-to-clipboard'

  export default {
    name: 'MyWallet',
    components: {
      KeystoreInput,
      AccountBalancesSidebar,
      AccountLockBalancesPanel,
    },
    data() {
      return {
        opened: false,
        addresses: [],
        currentAddress: '',
        currentAccount: '',
        hideZeroAssets: false,
        showAccountBalancesLimit: 5,
        currentAccountBalances: [
          {
            assetId: '1.3.0',
            assetSymbol: 'BTC',
            amountNu: new BigNumber(0),
            amount: 0,
          },
        ],
        currentAccountTokenBalances: [],
        currentAccountInfo: {},

        unlockWalletForm: {
          keystoreFile: null,
          keystoreFileInput: null,
          keystoreFileJson: null,
          password: '',
          walletAccountsToSelect: false,
        },
        walletJsonAccounts: [],

        importAddressPrivateKey: '',
        showImportAddressDialog: false,
      }
    },
    created() {
      let account = appState.getCurrentAccount()
      const walletInfo = appState.getWalletInfo()
      this.addresses = !!walletInfo ? walletInfo.addresses : []
      this.currentAccount = account
      if (account) {
        this.opened = true
        this.currentAddress = account.address
        this.loadCurrentAccountInfo()
      } else {
        this.opened = false
      }

      this.onUnlock('withSessionStorage')
    },
    computed: {
      validPwd: function() {
        let password = (this.unlockWalletForm.password || '').trim()
        if (password.length < 8 || password.length > 30) {
          return false
        }

        return true
      },
    },
    mounted() {
      appState.onChangeCurrentAccount(this.onChangeCurrentAccount)
    },
    beforeDestroy() {
      appState.offChangeCurrentAccount(this.onChangeCurrentAccount)
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
      showWarning(info) {
        this.$message({
          showClose: true,
          message: (info || 'warning').toString(),
          type: 'warning',
        })
      },
      copyAddress() {
        copy(this.currentAddress)
        this.showSuccess('Copied successfully')
      },
      copyPrivateKey() {
        copy(
          this.addresses.find(({ address }) => address === this.currentAddress)
            .privateKey
        )
        this.showSuccess('Copied successfully')
      },
      handleAccountSetting(command) {
        switch (command) {
          case 'add':
            this.addNewAccount()
            return

          case 'import':
            this.showImportAddressDialog = true
            this.importAddressPrivateKey = ''
            return

          case 'copy':
            this.copyPrivateKey()
            return

          default:
            return
        }
      },
      changeAddress(address) {
        appState.changeAddress(address)
      },
      showAllBalances() {
        this.showAccountBalancesLimit = null
      },
      toUpdateAccountBalances() {
        this.loadCurrentAccountInfo()
      },
      loadCurrentAccountInfo() {
        if (!this.currentAccount) {
          return
        }

        this.$store
          .dispatch('account/getAccountInfo', this.currentAccount.address)
          .then((accountInfo) => {
            this.$nextTick(() => {
              if (accountInfo) {
                this.currentAccountInfo = accountInfo
              } else {
                this.currentAccountInfo = {}
              }
            })
          })
          .catch(this.showError)

        this.$store
          .dispatch('account/getAddressBalances', this.currentAccount.address)
          .then((accountBalances) => {
            this.$nextTick(() => {
              this.currentAccountBalances = accountBalances
            })
          })
          .catch(this.showError)
      },
      addNewAccount() {
        appState.accountAddNewAddress()
        this.showSuccess('Added successfully')
      },
      importNewAccount() {
        if (
          this.addresses.some(
            ({ privateKey }) => privateKey === this.importAddressPrivateKey
          )
        ) {
          this.showError('Address already exists')
          return
        }

        appState.accountImportNewAddress(this.importAddressPrivateKey)
        this.showImportAddressDialog = false
        this.showSuccess('Imported successfully')
      },
      onChangeCurrentAccount(account, addresses) {
        this.currentAccount = account
        this.currentAddress = account.address
        this.addresses = addresses
        this.loadCurrentAccountInfo()
      },
      updateCurrentAccountBalances(balances) {
        this.currentAccountBalances = balances
      },
      filterBalances(balances, skipZero = false, limit = null) {
        let filtered = balances
        if (skipZero) {
          filtered = balances.filter((item) => item.amount > 0)
        }
        if (limit) {
          filtered = filtered.slice(0, limit)
        }
        return filtered
      },
      async onUnlock(tpye = 'withPwd') {
        const isExistWallet = await appState.isExistWallet()
        if (!isExistWallet) return

        if (tpye !== 'withSessionStorage') {
          this.unlockWalletForm.password = this.unlockWalletForm.password.trim()
          if (
            this.unlockWalletForm.password.length < 8 ||
            this.unlockWalletForm.password.length > 30
          ) {
            this.showError(
              this.$t('keystoreInput.wallet_password_length_invalid')
            )
            return
          }
        }

        try {
          let password = this.unlockWalletForm.password
          const currentAccount =
            tpye === 'withSessionStorage'
              ? await appState.unLockWithSessionStorage()
              : await appState.unLock(password)

          if (!!currentAccount) {
            appState.changeCurrentAccount(currentAccount)
            this.currentAccount = currentAccount
            this.loadCurrentAccountInfo()
            this.opened = true
          }
        } catch (error) {
          this.showError(error)
        }
      },
    },
  }
</script>

<style lang="less">
  .xps-my-opened-wallet-container1 {
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
    .-address-row {
      display: flex;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: solid 1px #f3f3f3;
    }
    .-balance-label-row {
      padding-top: 10px;
      padding-bottom: 20px;
    }
    .-account-balance {
      width: 20% !important;
    }
    .-not-registered-account-btn {
      color: #6555df;
      font-size: 8pt;
      cursor: pointer;
    }
    .xps-account-balances-side-bar {
      .-balance-title-panel {
        text-align: center;
        // padding-left: 50pt;
      }
      .-switch-panel {
        text-align: right;
        padding-right: 50pt;
      }
    }
  }
  .xps-my-opened-wallet-container2 {
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .xps-my-wallet-container {
    min-height: 310pt;
  }
  .xps-my-wallet-inner-container {
    width: 400pt;
    max-width: 100%;
    margin: 0 auto;
    label {
      font-size: 10pt;
      color: #261932;
    }
    .el-form-item {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .el-form-item__content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .el-input {
      width: 220pt !important;
      margin: 0 auto;
    }
    .el-input__inner {
      text-align: center;
      border: 0 !important;
      border-bottom: solid 1px #cccccc !important;
      border-radius: 0 !important;
    }
    .-selectKeyStoreFile {
      cursor: pointer;
    }
  }
  @media (max-width: 600px) {
    .xps-my-opened-wallet-container1 {
      .-current-address-panel {
        width: 80%;
      }
      .-current-account-name-label-panel {
        width: 30%;
        text-align: left;
        padding-left: 10pt;
        padding-top: 10pt;
      }
      .-account-name-and-change-wallet-panel {
        width: 55%;
        padding-top: 10pt;
      }
    }
  }

  .chrome-ext-app-container {
    .xps-my-wallet-inner-container {
      width: auto;
    }
  }
</style>
