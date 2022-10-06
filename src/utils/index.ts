import { supabase } from "../supabase";
import bcrypt from "bcryptjs"

const visited = async function(){
  const {data, error} = await supabase.from('visited').select().match({time: new Date().toDateString()})
    
  if (error) return console.log(error)
  const prevcount = (data[0] === undefined) ? 0 : data[0].counts

  var datas = {
    time: new Date().toDateString(),
    counts: 1+prevcount,
  }

  if(prevcount != 0){
    const {error} = await supabase.from('visited').update({counts: datas.counts}).match({time: datas.time})
    if(error) console.log(error)
  }else{
    const {error} = await supabase.from('visited').insert(datas)
    if(error)console.log(error)
  }
}

const getDataIndex = async function(){
  /** blog
   * {title:'mengenal desa songo',
  data:'Kampung ini dulunya agak kumuh dan kurang hijau, hingga tahun 2013 Bu Yaning terpilih sebagai ketua KT. Mengapa Bu Yaning mau menjadi RT karena Bu Yaning mempunyai misi yaitu bagaimana cara mengubah kampung ini menjadi bersih dan hijau...',
  link:'/blog/tentang-desa-songo',
  release:'20 december 2022'}
   */
     
  const blog:Array<any> = []
  

  let blog_data = await supabase.from('blog').select('blog_id, release, title, link, preview_data').order('blog_id', {ascending: false}).then(e=>e.data)
  blog_data?.forEach(e=>blog.push(e))


  return {blog}
}

const login = async function(name:string, pass:string){
  const {data, error} = await supabase.from('users').select().match({name:name});
  
  if (error) return console.log(error)

  if(data[0] != undefined) return (comparePass(data[0].pass, pass)) ? "":"wrong password"
  return "wrong username"
}

const encryptPass = function(pass:string): string{
  return bcrypt.hashSync(pass, bcrypt.genSaltSync(10))
}

const comparePass = function(pass:string, hash:string): boolean{
  return bcrypt.compareSync(pass, hash)
}

const insertblog = async function(title:string){
  try{
    var content = document.querySelector('.fr-element.fr-view') as HTMLElement | null
    var submitcontent = content!!.innerHTML

    var img = content!!.querySelectorAll('img')
    for(var i=0; i < img.length; i++){
      var s = img[i].src.split('/').pop()

      // upload image
      var up = await fetch(img[i].src).then(r=>r.blob())
      try{
        await supabase.storage.from('public').upload(`${s}.jpg`, up)
      }catch(e){}
      

      // change blob to img in innerhtml      
      s = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/public/${s}.jpg`
      submitcontent = submitcontent.replace(img[i].src, s)
    }
    
    const titleCheck = await supabase.from('blog').select().match({title:title}).then(e=>e.data)
    
    if(titleCheck?.length != 0)return 'title already exists'

    const datas = {
      title: title,
      link: title.replaceAll(' ','-').toLowerCase(),
      data: submitcontent,
      preview_data: content!!.innerText.replaceAll('\n\n',' ').replace('\n','').slice(0,150)+'...',
      release: new Date().toDateString(),
      views: 0
    }

    const {error} = await supabase.from('blog').insert(datas)
    if(error) throw 'fail to upload content'

    return ''
  }catch(e){
    return e
  } 
}

const updateblog = async function(id:string, title:string, oldurl: string){
  try{
    var content = document.querySelector('.fr-element.fr-view') as HTMLElement | null
    var submitcontent = content!!.innerHTML

    var img = content!!.querySelectorAll('img')
    for(var i=0; i < img.length; i++){
      var s = img[i].src.split('/').pop()

      // upload image
      var up = await fetch(img[i].src).then(r=>r.blob())
      try{
        await supabase.storage.from('public').upload(`${s}.jpg`, up)
      }catch(e){}
      

      // change blob to img in innerhtml      
      s = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/public/${s}.jpg`
      submitcontent = submitcontent.replace(img[i].src, s)
    }
    
    
    
    const datas = {
      title: title,
      link: title.replaceAll(' ','-').toLowerCase(),
      data: submitcontent,
      preview_data: content!!.innerText.replaceAll('\n\n',' ').replace('\n','').slice(0,150)+'...',
      release: new Date().toDateString(),
      views: 0
    }

    let message_err = await supabase.from('comment').update({url_blog:datas.link}).match({url_blog:oldurl}).then(e=>e.error)
    
    if(message_err)console.log(message_err)

    const {error} = await supabase.from('blog').update(datas).match({blog_id:id})
    console.log(datas, id)
    if(error) throw 'fail to upload content'

    return ''
  }catch(e){
    return e
  } 
}


export default{visited, login, encryptPass, comparePass, insertblog, getDataIndex, updateblog}