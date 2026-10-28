/* T313 v1 비공개 데이터 연결 (화면 전용 공개 저장소용).
   - 데이터(data/ inputs/ references/ *.json *.py runtime_source.zip)는 비공개 저장소에서
     GitHub Contents API(raw)로 인증 읽기. 계산식·화면 코드는 바꾸지 않고 fetch 경로만 바꿈.
   - 토큰은 sessionStorage(이 탭 한정, 탭 닫으면 삭제)에만 둠. localStorage·URL·로그에 남기지 않음. */
(function(g){'use strict';
if(g.__dnmPrivateData)return;g.__dnmPrivateData=1;
var OWNER='archigon72',REPO='donnaemsae-194-test',REF='main',TK='dnmv1app.session.token';
var API='https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/';
var isWorker=typeof document==='undefined';
var BASE=isWorker?new URL('./',g.location.href):new URL('./',(document.currentScript&&document.currentScript.src)||g.location.href);
var nativeFetch=g.fetch.bind(g);
function isPrivate(rest){
 if(rest.indexOf('assets/')===0)return false;
 return /^(data|inputs|references|account-uat|auto-test|downloads|pipeline)\//.test(rest)||/\.(json|py)$/i.test(rest)||/(^|\/)runtime_source\.zip$/.test(rest);
}
function repoPath(u){
 var x;try{x=new URL(u,g.location.href)}catch(e){return null}
 if(x.origin!==g.location.origin||x.pathname.indexOf(BASE.pathname)!==0)return null;
 var rest=decodeURIComponent(x.pathname.slice(BASE.pathname.length));
 return rest&&isPrivate(rest)?rest:null;
}
var memTok=null,waiters=[];
function readTok(){if(isWorker)return memTok;try{return sessionStorage.getItem(TK)}catch(e){return memTok}}
function writeTok(t){memTok=t||null;if(!isWorker){try{t?sessionStorage.setItem(TK,t):sessionStorage.removeItem(TK)}catch(e){}}
 if(t){var w=waiters;waiters=[];w.forEach(function(f){f(t)})}}
function needTok(msg){var t=readTok();if(t)return Promise.resolve(t);return new Promise(function(res){waiters.push(res);if(!isWorker)showBox(msg)})}
var box=null;
function showBox(msg){
 if(isWorker)return;
 if(!document.body){document.addEventListener('DOMContentLoaded',function(){showBox(msg)},{once:true});return}
 if(!box){
  box=document.createElement('div');box.id='dnm-token-box';
  box.setAttribute('style','position:fixed;inset:0;z-index:2147483647;background:rgba(20,30,25,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif;color-scheme:light');
  box.innerHTML='<form style="background:#fff;border-radius:14px;max-width:360px;width:100%;padding:20px;box-sizing:border-box;color:#1d2b22">'
  +'<h2 style="margin:0 0 8px;font-size:18px">데이터 열쇠 입력</h2>'
  +'<p style="margin:0 0 12px;font-size:14px;line-height:1.5">비공개 데이터를 읽으려면 GitHub 토큰이 필요해요. 이 탭에서만 쓰고, 탭을 닫으면 지워져요.</p>'
  +'<p data-msg style="margin:0 0 8px;font-size:13px;color:#b3261e"></p>'
  +'<input data-tok type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…" style="width:100%;box-sizing:border-box;font-size:16px;padding:10px;border:1px solid #9aa;border-radius:8px;background:#fff;color:#1d2b22">'
  +'<div style="display:flex;gap:8px;margin-top:12px"><button type="submit" style="flex:1;padding:10px;font-size:15px;border:0;border-radius:8px;background:#2f6b45;color:#fff">확인</button>'
  +'<button type="button" data-del style="padding:10px;font-size:15px;border:1px solid #9aa;border-radius:8px;background:#fff;color:#1d2b22">토큰 삭제</button></div></form>';
  box.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var i=box.querySelector('[data-tok]'),v=i.value.trim();if(!v)return;i.value='';box.remove();box=null;writeTok(v)});
  box.querySelector('[data-del]').addEventListener('click',function(){box.querySelector('[data-tok]').value='';api.clear();box.querySelector('[data-msg]').textContent='토큰을 지웠어요.'});
 }
 box.querySelector('[data-msg]').textContent=msg||'';
 if(!box.isConnected)document.body.appendChild(box);
 box.querySelector('[data-tok]').focus();
}
function apiFetch(path,init,tok){
 var url=API+path.split('/').map(encodeURIComponent).join('/')+'?ref='+REF;
 var o={method:'GET',headers:{'Accept':'application/vnd.github.raw+json','Authorization':'Bearer '+tok,'X-GitHub-Api-Version':'2022-11-28'},mode:'cors',credentials:'omit',referrerPolicy:'no-referrer'};
 if(init&&init.signal)o.signal=init.signal;if(init&&init.cache)o.cache=init.cache;
 return nativeFetch(url,o);
}
function privateFetch(path,init){
 return needTok().then(function(tok){return apiFetch(path,init,tok)}).then(function(r){
  if(r.status===401){if(readTok())writeTok(null);
   if(isWorker)return r;
   return needTok('토큰이 맞지 않거나 만료됐어요. 다시 넣어 주세요.').then(function(t){return apiFetch(path,init,t)});}
  return r;});
}
g.fetch=function(input,init){
 var isReq=typeof Request!=='undefined'&&input instanceof Request;
 var s=isReq?input.url:String(input);
 var method=(init&&init.method)||(isReq&&input.method)||'GET';
 var p=String(method).toUpperCase()==='GET'?repoPath(s):null;
 return p?privateFetch(p,init):nativeFetch(input,init);
};
if(isWorker){
 g.addEventListener('message',function(e){if(e.data&&e.data.__dnmTok!==undefined){e.stopImmediatePropagation();writeTok(e.data.__dnmTok||null)}});
}else if(g.Worker){
 var W=g.Worker;
 var Wrapped=function(url,opts){var w=new W(url,opts);needTok().then(function(t){w.postMessage({__dnmTok:t})});return w};
 Wrapped.prototype=W.prototype;g.Worker=Wrapped;
}
var api={clear:function(){writeTok(null);memTok=null},has:function(){return !!readTok()},set:function(t){writeTok(String(t||'').trim()||null)},ask:function(){showBox('')},repo:OWNER+'/'+REPO};
g.DnmPrivateData=api;
})(self);
