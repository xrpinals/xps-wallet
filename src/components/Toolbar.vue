<template>
  <div class="toolbar-wrapper">
    <el-row
      style="width: 100%;display: flex;align-items: center;padding: 0 10px;flex-wrap: wrap;"
    >
      <div v-for="tab in tabs" :key="tab.key">
        <div
          class="xps-toolbar-item"
          v-on:click="changeToolbarTab(tab)"
          v-bind:class="{ selected: selectedTab === tab.key }"
        >
          {{ $t(tab.label) }}
          <div
            class="xps-toolbar-item-border"
            :style="{ background: 'images/toolbar-border.png' }"
          ></div>
        </div>
      </div>
    </el-row>
  </div>
</template>

<script>
  import appState from '../appState.js'

  export default {
    name: 'Toolbar',
    data() {
      return {
        selectedTab: appState.getCurrentTab(),
        tabs: [
          { label: 'toolbar.my_wallet', key: 'my_wallet', span: 4 },
          // { label: 'toolbar.create_wallet', key: 'create_wallet', span: 4 },
          { label: 'toolbar.transfer', key: 'transfer', span: 4 },
          { label: 'toolbar.withdraw', key: 'withdraw', span: 5 },
          {
            label: 'toolbar.withdraw_history',
            key: 'withdraw_history',
            span: 4,
          },
          { label: 'toolbar.deposit_address', key: 'deposit_address', span: 6 },
          // {
          //   label: 'toolbar.runes',
          //   key: 'runes',
          //   span: 4,
          //   url: 'https://www.xrpinals.com/index',
          // },
          // { label: 'toolbar.contract', key: 'contract', span: 4 },
          // { label: 'toolbar.check_tx', key: 'check_tx', span: 4 },
          // { label: 'toolbar.sign_raw', key: 'sign_raw', span: 4 },
        ],
      }
    },
    methods: {
      onTabClick(tab) {},
      changeToolbarTab(tab) {
        if (tab.url) {
          window.open(tab.url)
        } else {
          this.selectedTab = tab.key
          appState.changeCurrentTab(this.selectedTab)
        }
      },
    },
  }
</script>

<style lang="less" scoped>
  .toolbar-wrapper {
    height: 100%;
    line-height: 27pt;
    font-size: 8pt;
    background: white;
    .xps-toolbar-item {
      padding: 0 12px;
      margin: 0 auto;
    }
    .xps-toolbar-item:hover {
      cursor: pointer;
      background: #ecf6ff;
    }
    .xps-toolbar-item.selected {
      .xps-toolbar-item-border {
        width: 20pt;
        height: 2pt;
        background-repeat: no-repeat;
        margin: 0 auto;
      }
    }
  }
</style>
