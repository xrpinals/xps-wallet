<template>
  <div class="xps-address-or-select-wallet-input">
    <div v-if="currentAddress">
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
  </div>
</template>

<script>
  import appState from '../appState'

  export default {
    name: 'AddressOrSelectWalletInput',
    data() {
      return {
        currentAddress: '',
      }
    },
    created() {
      this.currentAddress = appState.getCurrentAddress()
      console.log(
        'this.currentAddress',
        this.currentAddress,
        appState.getCurrentAccount()
      )
    },
    mounted() {
      appState.onChangeCurrentAccount(this.onChangeCurrentAccount)
    },
    beforeDestroy() {
      appState.offChangeCurrentAccount(this.onChangeCurrentAccount)
    },
    methods: {
      changeWallet() {
        appState.changeCurrentTab('my_wallet')
      },
      onChangeCurrentAccount(account) {
        console.log('account', account)
        this.currentAddress = account.address
      },
    },
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
</style>
