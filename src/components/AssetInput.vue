<template>
  <div class="asset-input-wrapper">
    <div class="-input-amount el-input" :class="{'el-input-group--append': hasAppend, 'el-input-group': hasAppend}">
      <input
        type="text"
        autocomplete="off"
        placeholder
        ref="amountInput"
        :value="form.value"
        @input="onValueChange"
        class="el-input__inner"
      >
      <div class="el-input-group__append" v-if="hasAppend"><slot name="append"></slot></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AssetInput",
  data() {
    return {
      form: {
        value: null
      }
    };
  },
  created() {},
  mounted() {
    this.form.value = this.value;
  },
  watch: {
    value(newVal, oldVal) {
      if(newVal !== oldVal) {
        this.form.value = newVal;
      }
    }
  },
  methods: {
    onValueChange(e) {
      const val = e.target.value || "";
      if (val.trim() === "") {
        this.form.value = "";
        this.$emit("input", this.form.value);
        return;
      }
      let valNu = new BigNumber(val);
      if (valNu.isNaN()) {
        this.$forceUpdate();
        return;
      }
      const precision = this.precision;
      let newVal = new BigNumber(
        valNu.times(Math.pow(10, precision)).toFixed(0)
      )
        .dividedBy(Math.pow(10, precision))
        .toString();
      const maxNu = new BigNumber(this.max);
      const minNu = new BigNumber(this.min);
      if (!maxNu.isNaN()) {
        if (new BigNumber(newVal).gt(maxNu)) {
          newVal = maxNu.toString();
        }
      }
      if (!minNu.isNaN()) {
        if (new BigNumber(newVal).lt(minNu)) {
          newVal = minNu.toString();
        }
      }
      if(new BigNumber(newVal).eq(valNu)) {
          newVal = val;
      }
      
      this.form.value = newVal;
      if (this.form.value !== val) {
        this.$forceUpdate();
      }
      this.$emit("input", this.form.value);
    }
  },
  props: ["precision", "value", "min", "max", "hasAppend"]
};
</script>

<style lang="less">
.asset-input-wrapper {
  position: relative;
  display: inline-block;
  .-input-amount {
    //   width: 170pt !important;
    width: 100% !important;
  }
}
</style>
