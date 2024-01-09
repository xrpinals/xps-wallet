<template>
  <div class="xps-main-container">
    <div style="font-weight: bold;">
      {{ address }}
      <i
        style="margin-left: 10px;"
        class="el-icon-copy-document"
        @click="copyAddress"
      >
      </i>
    </div>

    <VueQRCodeComponent
      style="margin: 30px auto;display: flex;justify-content: center;"
      :text="address"
    ></VueQRCodeComponent>

    <div style="font-size: 12px;color: red;margin: 20px 0 5px;">
      You must use the legacy format bitcoin address(starting with "1") to
      perform the deposit operation from layer1 to layer2, other formats may not
      be able to be successfully recharged. Direct withdrawals of coins from the
      exchange platform directly to the deposit address are not allowed.
    </div>
    <div style="font-size: 12px;color: red;">
      Please be very careful that the deposit address is a multi-signature
      address starting with "3" and not in any other format, irresponsible and
      random operation may result in loss of assets.
    </div>
  </div>
</template>

<script>
  import VueQRCodeComponent from 'vue-qrcode-component'
  import copy from 'copy-to-clipboard'
  import appState from '../appState.js'
  export default {
    name: 'DepositAddress',
    components: { VueQRCodeComponent },
    props: {},
    data() {
      return {
        address: '',
      }
    },
    computed: {},
    watch: {},
    created() {
      const nodeClient = appState.getNodeClient()
      nodeClient.getCurrentMultisigAccount().then((data) => {
        this.address = data.bind_account_hot
      })
    },
    mounted() {},
    methods: {
      showSuccess(info) {
        this.$message({
          showClose: true,
          message: (info || 'success').toString(),
          type: 'success',
        })
      },
      copyAddress() {
        copy(this.address)
        this.showSuccess('Copied successfully')
      },
    },
  }
</script>
<style lang="less" scoped></style>
