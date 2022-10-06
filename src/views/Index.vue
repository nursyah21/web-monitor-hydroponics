<script>
import {Modal,Home,Footer, Loading} from '../components'
import utils from "../utils"

export default{
  components:{
    Modal,
    Home,
    Footer,
    Loading
},
  mounted(){
    utils.visited()
    this.getData()
  },
  data(){
    return{
      loading: false,
      navbar:[
        {page:'home', active:true},
        {page:'blog', active:false},
      ],
      blog:[],
      blogIdx:0,
      lengthIdx:1,
    }
  },
  methods:{
    async getData(){
      this.loading = true
      const {blog} = await utils.getDataIndex()
      this.loading = false
      this.blog = blog
    },
    move(e){
      this.navbar.forEach(e=>e.active = false)
      this.navbar[e].active = true
    }
  }
}
</script>

<template>
  <Loading v-if="loading">load data</Loading>
  <div class="text-gray-500 p-3">
    <!-- navbar -->
    <div class="bg-white border-b-2 pb-1 px-2 sm:px-8 pt-1 fixed top-0 w-screen left-0 bg-opacity-80">
      <button @click="move(idx)" :class="{underline: navbar[idx].active}" v-for="i,idx in navbar" class="mx-2 text-xl hover:underline">{{i.page}}</button>
    </div>
    <!-- banner -->
    <div class="flex justify-center" v-if="navbar[0]['active']">
      <img src="../assets/banner.svg" alt="" class="mt-8 w-full">
    </div>

    <div class="sm:px-4">
      <!-- Home -->
      <Home :class="{hidden: !navbar[0]['active']}" />
      
      <!-- Blog -->
      <div class="my-2 mt-10  border-b" :class="{hidden: !navbar[1]['active']}" >  
          <div class="border p-3 rounded-md my-2" v-for="i in blog.slice(blogIdx, blogIdx+lengthIdx+1)">
            <p class="mb-1 sm:text-xl">{{i.title}}</p>
            <p class="text-xs sm:text-sm mb-1">{{i.preview_data}} <a :href="'/blog/'+i.link" class="text-blue-500">readmore</a></p>          
            <p class="text-xs">{{i.release}}</p>
          </div>

        <!-- pagination -->
        <div class="text-center">
          <button  class="border px-2 mx-2 mb-2 hover:underline" :class="{underline: (blogIdx == i-1 )}" @click="blogIdx = i - 1" v-for="i in Number((blog.length / lengthIdx).toFixed())">{{i}}</button>
        </div>

      </div>

    </div>

    <Footer  />
  </div>
</template>