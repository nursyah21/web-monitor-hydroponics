<script>
import { Modal, Loading } from '../components';
import utils from '../utils';

export default{
  components:{
    Modal, Loading
  },
  data(){
    return{
      loading: false,
      status:"",
      form:{
        name:"",
        pass:""
      }
    }
  },
  mounted(){
    this.autologin()
  },
  methods:{
    async autologin(){
      const name = localStorage.getItem('name')
      const pass = localStorage.getItem('pass')
      

      if(name && pass){
        this.loading = true
        
        const data = await utils.login(name, pass)
        
        
        if(data === "") window.location.href = "/dashboard"
      }

    },
    async loginFunc(name, pass){
      this.status = ""
      if(name === "" || pass === "") return this.status = "username / password can't empty"
      
      this.loading = true
      pass = utils.encryptPass(pass)

      const data = await utils.login(name, pass)

      if(data != "") this.status = data
      else {
        localStorage.setItem('name', name)
        localStorage.setItem('pass', pass)
        window.location.href= "/dashboard"
      }

      this.loading = false
    }
  }
}
</script>

<template>
<Loading :class="{hidden: !loading}">verification</Loading>
<Modal  class="sm:bg-pale-gray">
    <div class="w-full sm:max-w-sm max-w-none  bg-white rounded-lg sm:border sm:shadow-md sm:h-fit p-3 text-gray-500">
      <div class="text-center">
        <h1 class="text-2xl">Desa Songo</h1>
        <p class="text-lg">login</p>
      </div>

      <form @submit.prevent="loginFunc(form.name, form.pass)">
        <input v-model="form.name" type="text" class="w-full border-2 p-1 my-1 outline-none" placeholder="username">
        <input v-model="form.pass" type="password" class="w-full border-2 p-1 my-1 outline-none" placeholder="password">
        <input type="submit" value="submit" class="border-2 w-full p-1 hover:underline">
      </form>
      <p class="text-center text-sm mt-2 text-amber">{{status}}</p>
    </div>
</Modal>
</template>