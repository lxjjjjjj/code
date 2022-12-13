<template>
  <error-comp />
</template>

<script>
import ErrorComp from "./ErrorComp.vue";
export default {
  name: "ErrorHandler",
  components: {
    ErrorComp
  },
  errorCaptured(err) {
    this.$store.commit("addError", err);
  }
};
</script>
