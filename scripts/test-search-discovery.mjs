import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const script=readFileSync(resolve(root,"assets/search-discovery.js"),"utf8");
function visit({referrer="https://www.google.com/search?q=private&email=person@example.com",pathname="/",hostname="www.chatgenius.pro",status=204,stored=new Map()}={}) {
 const calls=[];
 const window={location:{protocol:"https:",hostname,pathname},sessionStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)}};
 vm.runInNewContext(script,{window,document:{referrer},URL,JSON,fetch:(url,options)=>{
  calls.push({url,options});return Promise.resolve({status});
 }});
 return {calls,stored};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test("ChatGenius strips private Google/AI search and conversation URLs",async()=>{
 const {calls,stored}=visit();
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,"https://realtyflow.chatgenius.pro/api/public/search-discovery");
 assert.deepEqual(JSON.parse(calls[0].options.body),{path:"/",referrer:"https://www.google.com/"});
 assert.ok(!calls[0].options.body.includes("private"));
 await tick();
 assert.equal(stored.size,1);
 assert.equal(visit({stored}).calls.length,0);
 assert.equal(visit({stored,pathname:"/es/"}).calls.length,1);
 assert.deepEqual(JSON.parse(visit({referrer:"https://gemini.google.com/app/private"}).calls[0].options.body),{path:"/",referrer:"https://gemini.google.com/"});
});
test("failed database acknowledgement never marks ChatGenius traffic measured",async()=>{
 const stored=new Map();
 visit({status:503,stored});await tick();
 assert.equal(stored.size,0);
 assert.equal(visit({stored}).calls.length,1);
});
test("spoof hosts, private paths and non-ChatGenius origin cannot trigger event",()=>{
 for(const referrer of ["https://google.com.evil.invalid/","https://notgoogle.com/","https://fakechatgpt.com/","http://www.google.com/search?q=private","https://google.com:8080/"])
  assert.equal(visit({referrer}).calls.length,0);
 for(const pathname of ["/api/secret","/app/private","/checkout","/account","/nedlasting.html","/book/person@example.com"])
  assert.equal(visit({pathname}).calls.length,0);
 assert.equal(visit({hostname:"chatgenius.pro.evil.invalid"}).calls.length,0);
});
test("all public ChatGenius homepage locales plus public articles load a single tracker",()=>{
 for(const file of ["index.html","es/index.html","fr/index.html","de/index.html","ru/index.html","api/article.js","api/articles.js"]){
 const body=readFileSync(resolve(root,file),"utf8");
 assert.equal(body.split("search-discovery.js").length-1,1,file);
 }
});
