<template>
  <div class="header-wrapper">
    <el-row style="max-width: 1000px; margin: 0 auto">
      <el-col :span="8">
        <div class="grid-content">
          <img
            :src="'images/header-logo.png'"
            class="header-logo"
            style="margin-left: 10px"
            alt
          />
        </div>
      </el-col>
      <el-col :span="16" style="text-align: right">
        <div
          style="display: flex;align-items: center;justify-content: flex-end;gap: 15px;padding-right: 12px;"
        >
          <div
            class="el-select network-select xps-select"
            style="font-size: 14px"
          >
            <span style="color: white">Status &nbsp;</span>
            <span
              v-if="connected"
              class="el-icon-check"
              style="color: #67c23a"
            ></span>
            <span
              v-if="!connected"
              class="el-icon-close"
              style="color: #f56c6c"
            ></span>
          </div>

          <span
            style="font-size: 14px;color: white; text-transform: capitalize"
            >{{ network }}</span
          >
          <span
            style="font-size: 14px;color: white; text-transform: capitalize;"
            >{{ language }}</span
          >

          <div v-if="isExistWallet" style="padding-top: 3px;">
            <el-dropdown size="mini" @command="handleSetting">
              <i
                style="cursor: pointer;font-size: 17px;color: white;"
                class="el-icon-key"
              ></i>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="reveal"
                  >Reveal secret recovery</el-dropdown-item
                >
              </el-dropdown-menu>
            </el-dropdown>
          </div>

          <!-- <el-select
            v-model="network"
            @change="onChangeNetwork"
            placeholder="Network"
            class="network-select xps-select"
          >
            <el-option
              v-for="item in getNetworkList()"
              :key="item.key"
              :label="item.name"
              :value="item.key"
            ></el-option>
            <el-option label="Customize" value="customize"></el-option>
          </el-select>
          <el-select
            v-model="language"
            @change="onChangeLang"
            placeholder="Language"
            class="language-select xps-select"
          >
            <el-option label="English" value="english"></el-option>
            <el-option label="中文" value="chinese"></el-option>
          </el-select> -->
        </div>
      </el-col>
    </el-row>

    <el-dialog
      title="Reveal Secret Recovery"
      :visible.sync="showRevealDialog"
      width="350px"
      center
    >
      <div>
        <div
          v-if="secretRecovery"
          style="display: flex;flex-wrap: wrap;gap: 10px;"
        >
          <el-tag
            v-for="item in secretRecovery.split(' ')"
            :key="item"
            type="info"
            size="small"
            >{{ item }}</el-tag
          >
        </div>
        <el-input
          v-else
          type="password"
          placeholder="Input password"
          v-model="revealPassword"
        ></el-input>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button
          type="primary"
          :disabled="!validPwd"
          @click="revealOrCopySecretRecovery"
          >{{ !!secretRecovery ? 'Copy' : 'Reveal' }}</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import appState from '../appState.js'
  import copy from 'copy-to-clipboard'

  export default {
    name: 'PageHeader',
    data() {
      return {
        isExistWallet: false,
        network: appState.getCurrentNetwork(),
        language: appState.getCurrentLanguage(),
        connected: false,
        connectCheckInterval: null,
        showRevealDialog: false,
        revealPassword: '',
        secretRecovery: '',
      }
    },
    computed: {
      validPwd: function() {
        let password = (this.revealPassword || '').trim()
        if (password.length < 8 || password.length > 30) {
          return false
        }

        return true
      },
    },
    mounted() {
      this.validIsExistWallet()
      appState.onChangeCurrentAccount(this.onChangeCurrentAccount)
      this.connectCheckInterval = setInterval(() => {
        const nodeClient = appState.getNodeClient()
        nodeClient.execDbApi('get_sync_mode_network_info').then(
          (data) => {
            this.connected = true
          },
          (err) => {
            console.error(err)
            this.connected = false
          }
        )
      }, 3000)
    },
    beforeDestroy() {
      appState.offChangeCurrentAccount(this.onChangeCurrentAccount)
      if (this.connectCheckInterval) {
        clearInterval(this.connectCheckInterval)
        this.connectCheckInterval = null
      }
    },
    methods: {
      onChangeCurrentAccount() {
        this.isExistWallet = true
      },
      async validIsExistWallet() {
        this.isExistWallet = await appState.isExistWallet()
      },
      handleSetting(command) {
        switch (command) {
          case 'reveal':
            this.revealPassword = ''
            this.secretRecovery = ''
            this.showRevealDialog = true
            return

          default:
            return
        }
      },
      async revealOrCopySecretRecovery() {
        if (!!this.secretRecovery) {
          copy(this.secretRecovery)
          this.$message({
            showClose: true,
            message: 'Copied successfully',
            type: 'success',
          })
          return
        }

        if (!this.validPwd) return

        try {
          this.secretRecovery = await appState.getMnemonicByPwd(
            this.revealPassword
          )
        } catch (error) {
          this.$message({
            showClose: true,
            message: error,
            type: 'error',
          })
        }
      },
      onChangeNetwork(network) {
        if (network === 'customize') {
          appState.changeCurrentTab('customize_network')
          return
        }
        this.network = network
        appState.changeCurrentNetwork(this.network)
      },
      onChangeLang(lang) {
        this.language = lang
        appState.changeCurrentLanguage(this.language)
        if (this.$i18n) {
          this.$i18n.locale = lang
        }
      },
      getNetworkList() {
        return appState.getNetworkList()
      },
    },
  }
</script>

<style lang="less">
  .header-wrapper {
    height: 34pt;
    line-height: 34pt;
    background: linear-gradient(#8a7ee7, #6555df);
    .header-logo {
      width: 103pt;
      height: 20pt;
      margin-top: 7pt;
      margin-right: 5px;
      display: inline-block;
      float: left;
    }
  }
  li.el-select-dropdown__item {
    display: block;
    height: 19pt;
    line-height: 19pt;
    margin: 0;
  }
  li.el-select-dropdown__item.selected {
    background: #7c51b3;
    color: white;
  }
  .xps-select {
    font-size: 14px;
    .el-input__inner {
      padding: 0 10px;
      background: rgba(0, 0, 0, 0);
      border: 0;
      color: white;
    }
  }
  .network-select {
    width: 65pt;
  }
  .language-select {
    width: 65pt;
  }
  .el-select-dropdown {
    top: 32px;
  }

  .chrome-ext-app-container {
    .header-wrapper .header-logo {
      margin-left: 20px;
    }
  }
</style>
