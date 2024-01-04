<template>
  <div id="app">
    <PageHeader></PageHeader>
    <Toolbar v-if="isExistWallet && isLocked"></Toolbar>
    <div v-if="isExistWallet">
      <MyWallet v-if="currentTabKey === 'my_wallet'"></MyWallet>
      <CreateWallet v-if="currentTabKey === 'create_wallet'"></CreateWallet>
      <RegisterAccount
        v-if="currentTabKey === 'register_account'"
      ></RegisterAccount>
      <Transfer v-if="currentTabKey === 'transfer'"></Transfer>
      <CheckTx v-if="currentTabKey === 'check_tx'"></CheckTx>
      <SignRaw v-if="currentTabKey === 'sign_raw'"></SignRaw>
      <BroadcastTx v-if="currentTabKey === 'broadcast_tx'"></BroadcastTx>
      <!-- <Contract v-if="currentTabKey === 'contract'"></Contract> -->
      <CustomizeNetwork
        v-if="currentTabKey === 'customize_network'"
      ></CustomizeNetwork>
    </div>
    <div v-if="!isExistWallet"><CreateWallet></CreateWallet></div>
    <!-- <div class="xps-footer-bar"><div>@Copyright Xrpinals</div></div> -->
  </div>
</template>

<script>
  import PageHeader from './components/Header.vue'
  import Toolbar from './components/Toolbar.vue'
  import MyWallet from './pages/MyWallet.vue'
  import RegisterAccount from './pages/RegisterAccount.vue'
  import CreateWallet from './pages/CreateWallet.vue'
  import Transfer from './pages/Transfer.vue'
  import CheckTx from './pages/CheckTx.vue'
  import SignRaw from './pages/SignRaw.vue'
  import BroadcastTx from './pages/BroadcastTx.vue'
  import CustomizeNetwork from './pages/CustomizeNetwork.vue'
  import Contract from './pages/Contract.vue'
  import appState from './appState.js'

  export default {
    name: 'app',
    components: {
      PageHeader,
      Toolbar,
      MyWallet,
      CreateWallet,
      RegisterAccount,
      Transfer,
      CheckTx,
      SignRaw,
      BroadcastTx,
      CustomizeNetwork,
      Contract,
    },
    data() {
      return {
        isLocked: appState.isLocked(),
        isExistWallet: false,
        currentTabKey: appState.getCurrentTab(),
      }
    },
    created() {
      const lastUsedNetwork = appState.getLastUsedNetwork()
      appState.changeCurrentNetwork(
        lastUsedNetwork ? lastUsedNetwork.key : 'mainnet'
      )
      this.currentTabKey = appState.getCurrentTab()
    },
    mounted() {
      appState.onChangeCurrentAccount(() => {
        this.isExistWallet = true
        this.isLocked = appState.isLocked()
      })
      appState.onChangeCurrentTab(this.onChangeCurrentTab)
      appState.onConnectionClose(this.onConnectionClose)
    },
    beforeDestroy() {
      appState.offChangeCurrentTab(this.onChangeCurrentTab)
      appState.offConnectionClose(this.onConnectionClose)
    },

    created() {
      this.validIsExistWallet()
    },
    methods: {
      async validIsExistWallet() {
        this.isExistWallet = await appState.isExistWallet()
      },
      onChangeCurrentTab(tabKey) {
        this.currentTabKey = tabKey
      },
      onConnectionClose() {
        this.$message({
          showClose: true,
          message: 'Connection Closed',
          type: 'error',
        })
      },
    },
  }
</script>

<style lang="less">
  body::-webkit-scrollbar {
    display: none;
  }

  .xps-main-container {
    max-width: 1000px;
    margin: 0 auto;
    margin-top: 8px;
    background: white;
    padding: 20px;
  }

  .xps-panel {
    min-width: 400px;
    max-width: 1000px;
    margin: 0 auto;
    margin-top: 8px;
    background: white;
    padding: 20px;
  }

  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    min-width: 400px;
    min-height: 500px;
    background: #fff;
  }

  .xps-footer-bar {
    position: fixed;
    min-width: 200pt;
    text-align: center;
    color: #999999;
    font-size: 10pt;
    right: 40pt;
    padding-top: 20pt;
    bottom: 12pt;
  }

  h1,
  h2 {
    font-weight: normal;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: inline-block;
    margin: 0 10px;
  }

  a {
    color: #42b983;
  }

  .el-button--primary,
  .el-button--primary:focus,
  .el-button--primary:hover,
  .el-button--primary.is-active,
  .el-button--primary:active {
    min-width: 130pt;
    height: 36px;
    font-size: 12px;
    color: white;
    border: 0;
    background: linear-gradient(#8a7ee7, #6555df);
    transition: opacity 300ms ease-in-out;
  }

  .el-button--primary.is-disabled,
  .el-button--primary.is-disabled:hover {
    background: linear-gradient(#8a7ee7, #6555df);
    opacity: 0.7;
    border: 0;
  }

  .el-button--primary:hover {
    opacity: 0.7;
  }

  .el-button--default:focus,
  .el-button--default:hover {
    color: #8a7ee7;
    border-color: #e4deff;
    background-color: #f4f0ff;
  }

  .el-tag {
    color: #8a7ee7;
    border-color: #e4deff;
    background-color: #f4f0ff;
  }

  .el-dropdown-menu__item {
    display: list-item;
    font-size: 12px;
    padding: 0 10px;
    line-height: 28px;
  }

  .el-dropdown-menu__item:focus,
  .el-dropdown-menu__item:not(.is-disabled):hover {
    color: #8a7ee7;
    background: #f4f0ff;
  }

  .el-switch__core {
    width: 20px !important;
  }
  .el-switch .el-switch__core {
    border-color: #6555df;
  }
  .el-switch.is-checked .el-switch__core {
    background-color: white;
    border-color: #6555df;
  }
  .el-switch.is-checked .el-switch__core:after {
    background-color: #6555df;
  }

  .el-message {
    min-width: 300px;
    padding: 10px 10px 10px 15px;
    .el-message__icon,
    .el-message__closeBtn {
      font-size: 14px;
    }
    .el-message__content {
      font-size: 12px;
    }
  }

  .grid-content {
    word-break: break-all;
  }

  .chrome-ext-app-container {
    .xps-main-container {
      width: 500px;
    }
  }

  ::placeholder {
    font-size: 8pt;
  }
</style>
