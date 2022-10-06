<script>
import { Modal, Loading, Footer } from '../components';
import utils from '../utils';
import router from '../router';
import { supabase } from '../supabase';

export default{
  components:{
    Modal,
    Loading,
    Footer
},
  mounted(){
    this.autologin()
    this.refreshHidroponik()
    this.realtimeHidroponik()    
  },
  data(){
    return{
      login: false,
      loading:false,
      loadingStatus:'',
      refreshStatus:'refresh',
      nav:[
        {page: 'Home', active:true},
        {page: 'Blog', active:false},
        {page: 'Comment', active:false}
      ],
      hidroponik:{
        ultrasonik: [0.1, 0.1, 0.1], //read
        tds: 0.1, //read
        pompa: [false, true, true, true], //write
        mode: true, //write
        ppm: 0, //write 0-1500
        ppmvalid: true
      },
      stats:{
        blog: true,
        comment: false,
      },
      blog:{
        title:'',
        postfail:'',
        deleteblog:'',
        urlblog:'',
        deleteModal:false,
        list: [],
        listIdx: 0,
        lengthlist: 50,
        submit:'submit',
        blog_id:'',
        old_url:''
      },
      comment:{
        list:[],
        listIdx: 0,
        lengthlist: 50,
        deleteModal: false,
        deleteMessage: '',
        deleteMessageID: ''
      }
    }
  },
  methods:{
    async autologin(){
      const savedname = localStorage.getItem('name')
      const savedpass = localStorage.getItem('pass')

      if(savedname != null && savedpass != null){
        this.loading = true
        this.loadingStatus = 'verification'
        const data = await utils.login(savedname, savedpass)
        this.loading = false
        this.loadingStatus = ''

        if(data === ""){
          this.login = true
          this.genCharts()
        }else{
          localStorage.clear()
          window.location.href = "/login"
        }
      }
      else
        router.push('login')
    },
    async genCharts(){
      const data = {labels: [],datasets: [{name: "views", chartType: "line",values: []
      }]}      

      new frappe.Chart("#chart", {
        title: `${new Date().getFullYear()} ${['December', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'][new Date().getMonth()]}`,
        data: data,
        height: 250,
        colors: ['#7cd6fd']
      })

      try{
        const {data,error} = await supabase.from('visited').select().order('visited_id',{ascending:true}).limit(30)
        const labels = [], datasets = []
        if(error)return
        data.forEach(e=>{
          labels.push(e.time)
          datasets.push(e.counts)
        })

        new frappe.Chart("#chart",{
          title: `${new Date().getFullYear()} ${['December', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'][new Date().getMonth()]}`,
          data: {labels: labels, datasets: [{name: "views", chartType: "line",values: datasets}]},
          height: 250,
          colors: ['#7cd6fd']
        })
        
      }catch(e){}


    },
    async move(e){
      this.nav.forEach(e=>e.active = false)
      this.nav[e].active = true
      
      this.loading = true
      this.loadingStatus = 'load data'
      if(this.nav[1].active){ //blog
        new FroalaEditor('textarea');
        this.blog.list = []
        const blog = await supabase.from('blog').select('blog_id, title, views, release, link').order('blog_id', {ascending:false}).then(e=>e.data)
        if(blog != null)blog.forEach(e=>this.blog.list.push(e))
      }
      if(this.nav[2].active){ //comment
        this.comment.list = []
        const comment = await supabase.from('comment').select().order('comment_id',{ascending:false}).then(e=>e.data)
        comment.forEach(e=>this.comment.list.push(e))
      }

      this.loading = false
      this.loadingStatus = ''
    },
    logout(){
      localStorage.clear()
      window.location.reload()
    },
    async submitContent(stats){ //post blog
      if(this.blog.title == '') return this.blog.postfail = "title can't empty"
      if(document.querySelector('.fr-element.fr-view').innerHTML == "<p><br></p>") return this.blog.postfail = "content can't empty"

      this.loading = true
      this.loadingStatus = 'upload blog'
      if(stats == 'update'){
        const status = await utils.updateblog(this.blog.blog_id, this.blog.title, this.blog.old_url)
        if(status != '' && !(this.loading = false))return this.blog.postfail = status
        this.blog.blog_id = ''
        this.blog.old_url = ''
        this.blog.submit = 'submit'
      }else{
        console.log('submit')
        const status = await utils.insertblog(this.blog.title)
        if(status != '' && !(this.loading = false))return this.blog.postfail = status
      }
      
      this.loadingStatus = ''
      this.blog.postfail = ''
      this.blog.title = ''
      document.querySelector('.fr-element.fr-view').innerHTML = ''
      this.loading = false
      this.move(1)
    },
    async refresh(){
      this.hidroponik.ppmvalid = true
      if(this.hidroponik.ppm < 0 || this.hidroponik.ppm > 1500)return this.hidroponik.ppmvalid = false
      
      this.loading = true
      await this.refreshHidroponik()
      await this.genCharts()
      this.refreshStatus = 'refresh'
      this.loading = false
    },
    pompaActivated(idx){
      if(this.hidroponik.mode)return
      this.hidroponik.pompa[idx] = ! this.hidroponik.pompa[idx]
      this.refreshStatus = 'async'
    },
    async removeBlog(idx,url){
      if(idx==null){
        this.blog.deleteModal = false
        
        this.loading = true
        this.loadingStatus = `delete ${this.blog.deleteblog}`

        try{
          await supabase.from('blog').delete().match({title:this.blog.deleteblog})
          await supabase.from('comment').delete().match({'url_blog': this.blog.urlblog})
        }catch(e){}
        
        this.loadingStatus = ''
        this.loading = false

        this.move(1)
      }else{
        this.blog.deleteblog = idx
        this.blog.urlblog = url
        this.blog.deleteModal = true
      }
    },
    async removeComment(idx, id){
      if(idx == null){
        console.log(this.comment.deleteMessageID)
        
        this.comment.deleteModal = false
        this.loading = true
        this.loadingStatus = `delete ${this.comment.deleteMessage}`

        const {error} = await supabase.from('comment').delete().match({'comment_id': this.comment.deleteMessageID})
        if(error) console.log(error)
        this.loadingStatus = ''
        this.loading = false

        this.move(2)
      }else{
        this.comment.deleteMessage = idx
        this.comment.deleteMessageID = id
        this.comment.deleteModal = true
      }
    },
    async refreshHidroponik(){
      if(this.refreshStatus == 'async'){
        const data = {
          tangki1: this.hidroponik.ultrasonik[0],
          tangki2: this.hidroponik.ultrasonik[1],
          tangki3: this.hidroponik.ultrasonik[2],
          tds: this.hidroponik.tds,
          ppm: this.hidroponik.ppm,
          auto: this.hidroponik.mode,
          pompa1: this.hidroponik.pompa[0],
          pompa2: this.hidroponik.pompa[1],
          pompa3: this.hidroponik.pompa[2],
          pompa4: this.hidroponik.pompa[3]
        }

        let error = await supabase.from('hidroponik').update(data).match({'id_hidroponik':1}).then(e=>e.error)
        if(error)console.log(error)
        return 
      }
      const {data} = await supabase.from('hidroponik').select().match({'id_hidroponik':1})

      data.forEach(e=>{
        this.hidroponik.ultrasonik[0] = e.tangki1
        this.hidroponik.ultrasonik[1] = e.tangki2
        this.hidroponik.ultrasonik[2] = e.tangki3
        this.hidroponik.tds = e.tds
        this.hidroponik.ppm = e.ppm
        this.hidroponik.mode = e.auto
        this.hidroponik.pompa[0] = e.pompa1
        this.hidroponik.pompa[1] = e.pompa2
        this.hidroponik.pompa[2] = e.pompa3
        this.hidroponik.pompa[3] = e.pompa4
      })
    },
    realtimeHidroponik (){
      supabase.from('hidroponik').on('UPDATE', async (payload)=>{
        
        const {data} = await supabase.from('hidroponik').select().match({'id_hidroponik':1})

        data.forEach(e=>{
          this.hidroponik.ultrasonik[0] = e.tangki1
          this.hidroponik.ultrasonik[1] = e.tangki2
          this.hidroponik.ultrasonik[2] = e.tangki3
          this.hidroponik.tds = e.tds
          this.hidroponik.ppm = e.ppm
          this.hidroponik.mode = e.auto
          this.hidroponik.pompa[0] = e.pompa1
          this.hidroponik.pompa[1] = e.pompa2
          this.hidroponik.pompa[2] = e.pompa3
          this.hidroponik.pompa[3] = e.pompa4
        })
        // console.log(data)
      }).subscribe()
    },
    async editBlog(blog_id, blog_url){
      const {data} = await supabase.from('blog').select().match({'blog_id':blog_id})
      this.loading = true
      this.loadingStatus = 'fetch data'
      if(data.length != 0){
        document.querySelector('.fr-element.fr-view').innerHTML = data[0].data
        this.blog.title =  data[0].title
        this.blog.oldtitle = data[0].title
        this.blog.submit = 'update'
        this.blog.old_url = blog_url
        this.blog.blog_id = blog_id
      }
      this.loadingStatus = ''
      this.loading = false

    }
  }
}
</script>

<template>
  <Loading :class="{hidden: !loading}">{{loadingStatus}}</Loading>

  <div :class="{hidden: !login}" class="text-gray-500">
    <!-- navbar -->
    <div class="w-full p-2 border-b mb-2 flex items-center ">
      <a href="/">
        <img src="../assets/logo1.svg" alt="" class="w-10 rounded-xl mr-4">
      </a>
      
      <div class="flex overflow-x-scroll pb-2 sm:overflow-hidden">
        <div @click="move(idx)" :class="{underline: nav[idx].active}" class="mx-2 cursor-pointer hover:opacity-30" v-for="i,idx in nav">{{i.page}}</div>  
      </div>
      
    </div>

    <!-- dashboard -->
    <div :class="{hidden: !nav[0].active}" class="p-3">
      <!-- chart --> 
      <div id="chart" class="p-5 py-9 rounded-md shadow-md overflow-hidden"></div>

      <!-- hidroponik -->
      <div class="flex items-center">
        <h1 class="mt-2 mx-2">Hidroponik</h1> 
        <!-- refresh button -->
        <button @click="refresh" class="mt-2 mx-2 border px-3 hover:underline ">{{refreshStatus}}</button>
        
      </div>
      <div class="text-center text-red-600 text-xs" v-if="!hidroponik.ppmvalid">
        ppm must be in range 0-1500
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 select-none">
        <!-- ultrasonik -->
        <div v-for="i,idx in hidroponik.ultrasonik" class="rounded-md p-2 m-2 w-36 sm:w-48 text-center bg-blue-500 text-white cursor-default">
          <span class="underline">tangki air {{idx + 1}}</span><br>
          {{i}}
        </div>
        <!-- tds -->
        <div class="border p-2 m-2 w-36 sm:w-48 text-center bg-blue-600 text-white cursor-default">
          <span class="underline">ppm</span><br>
          {{hidroponik.tds}}
        </div>
        <!-- pompa w -->
        <div @click="pompaActivated(idx)" v-for="i,idx in hidroponik.pompa" class="rounded-md p-2 m-2 w-36 sm:w-48 text-center bg-lime-600 text-white sm:hover:opacity-60 cursor-pointer" :class="{'opacity-60': (hidroponik.mode)}">
          <span class="underline">pompa {{idx + 1}}</span><br>
          {{(i)?'aktif':'non aktif'}}
        </div>
        <!-- mode w -->
        <div @click="(hidroponik.mode = !hidroponik.mode), refreshStatus='async'" class="rounded-md p-2 m-2 w-36 sm:w-48 text-center bg-lime-600 text-white sm:hover:opacity-60 cursor-pointer">
          <span class="underline">mode</span><br>
          {{(hidroponik.mode)?'auto':'manual'}}
        </div>
        <!-- ppm w -->
        <div class="rounded-md p-2 m-2 w-36 sm:w-48 text-center bg-lime-600 text-white cursor-pointer">
          <span class="underline">ppm (0-1500)</span><br>
          <input @click="refreshStatus = 'async'" type="number" v-model="hidroponik.ppm"  class="bg-lime-600 text-center outline-none border w-24" min="0" max="1500">
        </div>

      </div>

      <!-- domain, supabase, github button -->
      <div class="flex text-center mt-5 border-t">
        <a href="https://www.niagahoster.co.id/" class="mt-2 border w-full mx-2 p-1 hover:underline bg-sky-500 text-white">domain</a>
      </div>
      <div class="flex text-center">
        <a href="https://app.supabase.com/" class="mt-2 border text-white w-full mx-2 p-1 hover:underline bg-gray-500">supabase</a>
        <a href="https://github.com/" class="mt-2 border text-white w-full mx-2 p-1 hover:underline bg-gray-500">github</a>
      </div>

      <!-- logout -->
      <div class="mx-2 my-2">
        <button @click="logout" class="bg-red-700 text-white w-full p-1 hover:underline">log out</button>
      </div>
    </div>
    
    <!-- blog -->
    <div class="m-2" :class="{hidden: !nav[1].active}">
      
      <form @submit.prevent="(blog.submit == 'update')? submitContent('update'):submitContent('')" class="rounded-md shadow-md w-full p-3" >
        
        <!-- blog editor -->
        <div >
        <!-- title -->
        <span class="text-sm text-gray-400 mx-1">title:</span>
        <input v-model="blog.title" type="text" placeholder="title" class="border px-2 outline-none py-1 w-full mb-2" ref="titleBlog">
        
        <!-- content -->
        <span class="text-sm text-gray-400 mx-1">content:</span>
        <div ref="blogcontent" class="z-0">
          <textarea></textarea>
        </div>
        
        <div v-if="blog.postfail" class="italic text-center text-xs text-red-700 mt-2">{{blog.postfail}}</div>

        <!-- submit -->
        <input type="submit" class="bg-green-400 text-white w-full p-1 my-2 hover:underline" :value="blog.submit">
        </div>

      </form>
    
      <!-- list blog -->
      <div class="overflow-x-scroll my-4  py-1">
        <!-- blog -->
        <table class="w-full" :class="{hidden: !stats.blog}">
          <tr>
            <th class="sm:w-10">id</th>              
            <th>title</th>
            <th>release</th>
            <th>views</th>
            <th>delete</th>
            <th>edit</th>
          </tr>
          <tbody v-for="(i,idx) in blog.list.slice(blog.listIdx, blog.listIdx+blog.lengthlist+1)">
            <tr class="text-sm text-center hover:bg-slate-200">
              <td>{{idx+1 + blog.listIdx}}</td>
              <td><a v-bind:href="'/blog/'+i.link">{{i.title}}</a></td>
              <td>{{i.release}}</td>
              <td>{{i.views}}</td>
              <td class="p-1 bg-red-600 text-white sm:hover:underline cursor-pointer" @click="removeBlog(i.title, i.link)">delete</td>
              <td class="p-1 bg-amber-500 text-white sm:hover:underline cursor-pointer" @click="editBlog(i.blog_id, i.link)">edit</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- pagination -->
      <div class="text-center">
        <button  class="border px-2 mx-2 mb-2 hover:underline" :class="{underline: (blog.listIdx == i-1 )}" @click="blog.listIdx = i - 1" v-for="i in Number((blog.list.length / blog.lengthlist).toFixed())">{{i}}</button>
      </div>


      <!-- modal delete -->
      <Modal class="top-0 fixed w-full h-full z-10 bg-opacity-90" :class="{hidden: !blog.deleteModal}">
        <div class="text-center text-gray-500 text-sm">
          confirm delete <br>{{blog.deleteblog}}
          <div class="text-white mt-4">
            <button class="mr-5 sm:hover:underline px-6 py-1 bg-red-600" @click="removeBlog(null,'')">yes</button>
            <button class="ml-5 sm:hover:underline px-6 py-1 bg-sky-600" @click="blog.deleteModal = !blog.deleteModal">no</button>
          </div>
        </div>
      </Modal>

    </div>

    <!-- comment -->
    <div v-if="nav[2].active" class="px-3 py-1">
      <h1>Comment:</h1>
      <div class="overflow-x-scroll mt-1 mb-4 py-1">
        <table class="w-full" >
            <tr>
              <th class="sm:w-10">id</th>              
              <th>name</th>
              <th>message</th>
              <th>created_at</th>
              <th>blog</th>
              <th>delete</th>
            </tr>
            <tbody v-for="i,idx in comment.list.slice(comment.listIdx, comment.listIdx+comment.lengthlist+1)">
              <tr class="text-sm hover:bg-slate-200 text-center">
                <td>{{idx+1 + comment.listIdx}}</td>
                <td>{{i.name}}</td>
                <td>{{i.comment}}</td>
                <td>{{i.created_at}}</td>
                <td><a :href="'/blog/'+i.url_blog">{{i.url_blog}}</a></td>
                <td class="p-1 bg-red-600 text-white sm:hover:underline cursor-pointer" @click="removeComment(i.name+': '+i.comment,i.comment_id)">delete</td>
              </tr>
            </tbody>
        </table>
      </div>

      <!-- pagination -->
      <div class="text-center">
        <button  class="border px-2 mx-2 mb-2 hover:underline" :class="{underline: (comment.listIdx == i-1 )}" @click="comment.listIdx = i - 1" v-for="i in Number((comment.list.length / comment.lengthlist).toFixed())">{{i}}</button>
      </div>

      <!-- modal delete -->
      <Modal class="fixed w-full h-full z-10 bg-opacity-90" :class="{hidden: !comment.deleteModal}">
        <div class="text-center text-gray-500 text-sm">
          confirm delete <br>{{comment.deleteMessage}}
          <div class="text-white mt-4">
            <button class="mr-5 sm:hover:underline px-6 py-1 bg-red-600" @click="removeComment(null,'')">yes</button>
            <button class="ml-5 sm:hover:underline px-6 py-1 bg-sky-600" @click="comment.deleteModal = !comment.deleteModal">no</button>
          </div>
        </div>
      </Modal>

    </div>
    
    <!-- footer -->
    <Footer></Footer>
  </div>
</template>