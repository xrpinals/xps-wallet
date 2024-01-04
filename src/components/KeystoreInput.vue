<template>
  <FileInput
    @select-file="toSelectKeystoreFile"
    :filename="filename"
    :fileFormat="'text'"
    :accept="'.json'"
    :placeholder="$t('keystoreInput.please_open_wallet_keystore_file')"
  ></FileInput>
</template>

<script>
import FileInput from "./FileInput.vue";
import utils from "../utils";

export default {
  name: "KeystoreInput",
  components: { FileInput },
  data() {
    return {
      form: {
        keystoreFileInput: null,
        keystoreFileJson: null
      }
    };
  },
  methods: {
    toSelectKeystoreFile(fileContent, filename) {
      try {
        let fileJson = JSON.parse(fileContent);
        if (!fileJson) {
          this.showError("Invalid keystore file");
          return;
        }
        if(!fileJson.address && !(fileJson.chain_id && fileJson.my_accounts)) {
          this.showError("Invalid keystore file");
          return;
        }
        this.form.keystoreFileJson = fileJson;
        const isWalletJson = fileJson.chain_id && fileJson.my_accounts && true;
        this.$emit("select-file", fileJson, filename, isWalletJson);
      } catch (e) {
        this.showError(e);
      }
    },
    showError(e) {
      e = utils.getShowErrorMessage(e);
      this.$message({
        showClose: true,
        message: e,
        type: "error"
      });
    }
  },
  props: ["filename"]
};
</script>

<style lang="less">
</style>
