import {initializeApp} from "firebase/app";
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,reauthenticateWithPopup,deleteUser,browserLocalPersistence,setPersistence} from "firebase/auth";
import {getFirestore,collection,collectionGroup,doc,getDocs,addDoc,setDoc,updateDoc,deleteDoc,serverTimestamp,query,orderBy,writeBatch,where,increment,getDoc} from "firebase/firestore";
const app=initializeApp({apiKey:"AIzaSyAQqpG61B23KMk0erWcAWZzNyUaJBckgTc",authDomain:"cuicui-chart.firebaseapp.com",projectId:"cuicui-chart",storageBucket:"cuicui-chart.firebasestorage.app",messagingSenderId:"1095786794782",appId:"1:1095786794782:web:cc57f83c16421fd9d0030f"});
const auth=getAuth(app),db=getFirestore(app);setPersistence(auth,browserLocalPersistence).catch(()=>{});
const prov=()=>{const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});return p};
const col=()=>collection(db,"users",auth.currentUser.uid,"charts");
const ncol=()=>collection(db,"users",auth.currentUser.uid,"notes");
const scol=()=>collection(db,"users",auth.currentUser.uid,"savedPosts");
const ccol=id=>collection(db,"posts",String(id),"comments");
const pickN=n=>({cat:String(n.cat??"").slice(0,30),title:String(n.title??"").slice(0,80),body:String(n.body??"").slice(0,5000)});
const pickP=p=>({title:String(p.title??"").slice(0,120),slug:String(p.slug??"").slice(0,80),cat:String(p.cat??"").slice(0,30),summary:String(p.summary??"").slice(0,300),body:String(p.body??"").slice(0,20000),seoTitle:String(p.seoTitle??"").slice(0,70),seoDesc:String(p.seoDesc??"").slice(0,180),status:p.status==="published"?"published":"draft",publishedAt:typeof p.publishedAt==="number"?p.publishedAt:null});
const postOut=d=>{const x=d.data(),ts=v=>v&&v.toMillis?v.toMillis():(typeof v==="number"?v:0);return {id:d.id,title:x.title||"",slug:x.slug||"",cat:x.cat||"",summary:x.summary||"",body:x.body||"",seoTitle:x.seoTitle||"",seoDesc:x.seoDesc||"",status:x.status||"draft",publishedAt:ts(x.publishedAt),updated:ts(x.updated),created:ts(x.created)}};
const pick=c=>{const o={};["nm","date","time","place","lat","lon","tz","hs","gen"].forEach(k=>o[k]=String(c[k]??"").slice(0,80));return o};
/* 會員資料：登入時存一份 email 與名稱（供站長後台查看） */
const saveProfile=u=>setDoc(doc(db,"users",u.uid),{email:String(u.email||"").slice(0,120),name:String(u.displayName||"").slice(0,80),updated:serverTimestamp()},{merge:true}).catch(()=>{});
window.FB={
  onUser:f=>onAuthStateChanged(auth,u=>{if(u)saveProfile(u);f(u)}),
  user:()=>auth.currentUser,
  login:()=>signInWithPopup(auth,prov()),
  logout:()=>signOut(auth),
  list:async()=>{const s=await getDocs(query(col(),orderBy("created","desc")));return s.docs.map(d=>({id:d.id,...d.data()}))},
  add:c=>addDoc(col(),{...pick(c),created:serverTimestamp(),updated:serverTimestamp()}),
  update:(id,c)=>updateDoc(doc(col(),id),{...pick(c),updated:serverTimestamp()}),
  rename:(id,nm)=>updateDoc(doc(col(),id),{nm:String(nm).slice(0,80),updated:serverTimestamp()}),
  del:id=>deleteDoc(doc(col(),id)),
  nList:async()=>{const s=await getDocs(query(ncol(),orderBy("updated","desc")));return s.docs.map(d=>{const x=d.data();return {id:d.id,...x,created:x.created&&x.created.toMillis?x.created.toMillis():Date.now(),updated:x.updated&&x.updated.toMillis?x.updated.toMillis():Date.now()}})},
  /* 收藏的文章：存在會員自己的帳號底下（users/{uid}/savedPosts） */
  saveList:async()=>{const s=await getDocs(query(scol(),orderBy("created","desc")));return s.docs.map(d=>{const x=d.data();return {id:d.id,title:String(x.title||""),slug:String(x.slug||""),cat:String(x.cat||""),summary:String(x.summary||""),created:x.created&&x.created.toMillis?x.created.toMillis():Date.now()}})},
  savePost:p=>setDoc(doc(scol(),String(p.id)),{postId:String(p.id),title:String(p.title??"").slice(0,120),slug:String(p.slug??"").slice(0,80),cat:String(p.cat??"").slice(0,30),summary:String(p.summary??"").slice(0,300),created:serverTimestamp()}),
  unsavePost:id=>deleteDoc(doc(scol(),String(id))),
  /* 留言：每篇文章底下的 comments；所有人可讀與留言，只有站長可刪除 */
  commentList:async id=>{const s=await getDocs(query(ccol(id),orderBy("created","asc")));return s.docs.map(d=>{const x=d.data();return {id:d.id,uid:String(x.uid||""),name:String(x.name||""),text:String(x.text||""),created:x.created&&x.created.toMillis?x.created.toMillis():0}})},
  commentAdd:(id,name,text)=>addDoc(ccol(id),{name:String(name||"訪客").slice(0,20),text:String(text).slice(0,500),created:serverTimestamp()}),
  commentDel:(id,cid)=>deleteDoc(doc(ccol(id),String(cid))),
  nAdd:async n=>(await addDoc(ncol(),{...pickN(n),created:serverTimestamp(),updated:serverTimestamp()})).id,
  nUpd:(id,n)=>updateDoc(doc(ncol(),id),{...pickN(n),updated:serverTimestamp()}),
  nDel:id=>deleteDoc(doc(ncol(),id)),
  /* 文章（翠誌）：公開讀取已上架文章；寫入與讀取全部文章只限站長 */
  postsPub:async()=>{const s=await getDocs(query(collection(db,"posts"),where("status","==","published")));return s.docs.map(postOut)},
  postsAll:async()=>{const s=await getDocs(collection(db,"posts"));return s.docs.map(postOut)},
  postSave:async(id,p)=>{const data={...pickP(p),updated:serverTimestamp()};
    if(id){await setDoc(doc(db,"posts",id),data,{merge:true});return id}
    const r=await addDoc(collection(db,"posts"),{...data,created:serverTimestamp()});return r.id},
  postDel:id=>deleteDoc(doc(db,"posts",id)),
  /* 網站閱覽人數：每個瀏覽器工作階段累加一次 */
  visit:()=>{const r=doc(db,"stats","site");return updateDoc(r,{views:increment(1)}).catch(()=>setDoc(r,{views:1},{merge:true}))},
  siteViews:async()=>{const s=await getDoc(doc(db,"stats","site"));return s.exists()?(s.data().views||0):0},
  /* 後台（只讀）：權限由 Firestore 安全規則決定，非管理員會被拒絕 */
  adminLoad:async()=>{
    const uidOf=d=>d.ref.parent.parent?d.ref.parent.parent.id:"";
    const [cs,ns,us]=await Promise.all([getDocs(collectionGroup(db,"charts")),getDocs(collectionGroup(db,"notes")),getDocs(collection(db,"users"))]);
    const ts=v=>v&&v.toMillis?v.toMillis():0;
    return {
      charts:cs.docs.map(d=>({uid:uidOf(d),id:d.id,...pick(d.data()),updated:ts(d.data().updated)})),
      noteCounts:ns.docs.reduce((m,d)=>{const u=uidOf(d);m[u]=(m[u]||0)+1;return m},{}),
      users:us.docs.map(d=>({uid:d.id,email:String(d.data().email||""),name:String(d.data().name||"")}))
    };
  },
  deleteAccount:async()=>{const u=auth.currentUser;if(!u)return;
    const b=writeBatch(db);(await getDocs(col())).docs.forEach(d=>b.delete(d.ref));(await getDocs(ncol())).docs.forEach(d=>b.delete(d.ref));(await getDocs(scol())).docs.forEach(d=>b.delete(d.ref));b.delete(doc(db,"users",u.uid));await b.commit();
    try{await deleteUser(u)}catch(e){if(e&&e.code=="auth/requires-recent-login"){await reauthenticateWithPopup(u,prov());await deleteUser(u)}else throw e}}
};
window.dispatchEvent(new Event("fb-ready"));
