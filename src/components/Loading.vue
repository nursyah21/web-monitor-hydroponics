<script>
import { Modal } from '.';
export default{
  components:{
    Modal
  }
}
</script>

<template>
  <Modal class="fixed top-0 w-full z-50">
    <div class="text-center">
      <img src="../assets/loading.svg" alt="" class="w-20">
      <p class="text-sm text-gray-400">
        <slot></slot>
      </p>
    </div>
  </Modal>
</template>