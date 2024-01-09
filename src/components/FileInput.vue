<template>
  <div class="file-input-wrapper">
    <el-input
      class="-selectFile"
      v-bind:placeholder="placeholder"
      type="text"
      v-model="inputFilename"
      autocomplete="off"
      style="width: 100pt;"
      v-on:click.native="toSelectFile()"
      suffix-icon="el-icon-upload"
    ></el-input>
    <div v-if="false" class="-input-field" v-on:click="toSelectFile()">{{inputFilename}}</div>
    <i v-if="false" class="el-icon-upload -input-field-icon"
      v-on:click="toSelectFile()"></i>
    <div class="clearfix"></div>
    <input
      ref="fileInput"
      type="file"
      v-bind:accept="accept"
      style="display: none;"
      name="form.fileInput"
    >
  </div>
</template>

<script>
import utils from "../utils";

export default {
  name: "FileInput",
  data() {
    return {
      form: {
        fileInput: null,
        inputFilename: null
      }
    };
  },
  created() {
    this.inputFilename = this.filename || this.placeholder;
  },
  methods: {
    toSelectFile() {
      const fileInput = this.$refs["fileInput"];
      fileInput.click();
      const self = this;
      fileInput.onchange = e => {
        if (e.target.files.length < 1) {
          return;
        }
        const file = e.target.files[0];
        const filename = file.name;
        self.inputFilename = filename;
        self.$forceUpdate();
        const fileReader = new FileReader();
        fileReader.onloadend = e => {
          let fileContent = e.target.result;
          this.$emit("select-file", fileContent, filename);
        };
        fileReader.onerror = e => {
          this.showError(e);
        };
        if (self.fileFormat === "text") {
          fileReader.readAsText(file, "UTF-8");
        } else {
          fileReader.readAsArrayBuffer(file);
        }
        fileInput.value = null;
      };
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
  props: ["filename", "fileFormat", "placeholder", "accept"]
};
</script>

<style lang="less">
.file-input-wrapper {
  display: inline;
  .-selectFile {
    input {
      color: #cccccc;
    }
  }
  .-input-field {
    color: #a99eb4;
    width: 220pt;
    border-bottom: solid 1pt #cccccc;
    cursor: default;
    float: left;
    margin-left: 40pt;
    height: 40px;
    text-align: left;
    padding-left: 15px;
  }
  .-input-field-icon {
    float: left;
    height: 40px;
    line-height: 40px;
    color: #ffd200;
  }
}
</style>
