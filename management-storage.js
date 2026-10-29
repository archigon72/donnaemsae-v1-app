(function(root){'use strict';const L=root.ManagementLedger,key='dnmuat194.management.facts.v1';
/* T313 E안: 저장값이 v2 형식(schema_version 2~4)이면 원본은 절대 쓰지·바꾸지·지우지 않고, 국내 종목만 메모리에서 v1 형식으로 바꿔 읽기 전용 표시. 해외·달러·예수금은 저장값에 그대로 두고 개수만 안내. */
const RO='v2 형식 원장이라 이 화면에서는 읽기 전용이에요. 원본 저장값은 그대로 보존돼 있고, 기록·복원·초기화는 막아 두었어요.';
const isKR=c=>typeof c==='string'&&/^[0-9][0-9A-Z]{5}$/.test(c),hasFx=t=>t&&(t.currency!==undefined||t.price_usd!==undefined||t.fx_rate!==undefined);
function compatView(s){const names=(s.instrument_names&&typeof s.instrument_names==='object')?s.instrument_names:{},tx=Array.isArray(s.transactions)?s.transactions:[];
 const hide=new Set();for(const t of tx){const k=names[t&&t.code]&&names[t.code].kind;if(!isKR(t&&t.code)||hasFx(t)||(typeof k==='string'&&k.startsWith('os')))hide.add(t&&t.code)}
 const shown=tx.filter(t=>!hide.has(t&&t.code)),cf=Array.isArray(s.cash_flows)?s.cash_flows:[];
 const info={schema:s.schema_version,shown_tx:shown.length,hidden_codes:hide.size,hidden_tx:tx.length-shown.length,fx_tx:tx.filter(hasFx).length,cash_flows:cf.length,error:''};
 const v={schema_version:1,created_at:s.created_at,accounts:s.accounts,transactions:shown,dividend_uses:s.dividend_uses,metadata:s.metadata};
 for(const f of ['dividend_confirmations','dividend_cash_openings'])if(s[f]!==undefined)v[f]=s[f];
 return {view:JSON.parse(JSON.stringify(v)),info}}
function guard(){const P=root.Storage&&root.Storage.prototype;if(!P||P.__dnmRO)return;const set=P.setItem,rem=P.removeItem,clr=P.clear,hit=k=>{k=String(k);return k===key||k.startsWith(key+'.')};
 Object.defineProperty(P,'__dnmRO',{value:true});P.setItem=function(k,v){if(this===root.localStorage&&hit(k))throw Error(RO);return set.call(this,k,v)};P.removeItem=function(k){if(this===root.localStorage&&hit(k))throw Error(RO);return rem.call(this,k)};P.clear=function(){if(this===root.localStorage)throw Error(RO);return clr.call(this)}}
const api={key,compat:null,readOnlyNotice:RO,load(){const raw=localStorage.getItem(key);if(!raw)return L.empty();const s=JSON.parse(raw);
 if(s&&typeof s==='object'&&[2,3,4].includes(s.schema_version)){guard();const c=compatView(s);api.compat=c.info;try{return L.facts(c.view)}catch(e){c.info.error=e.message;return L.empty()}}
 return L.facts(s)},
 save(s){if(api.compat)throw Error(RO);const f=L.facts(s);localStorage.setItem(key,JSON.stringify(f));return f},restore(text,db){if(api.compat)throw Error(RO);const candidate=L.facts(JSON.parse(text));const result=L.replay(candidate,db);api.save(candidate);return {candidate,result}},backup(s){return JSON.stringify(L.facts(s),null,2)},reset(){if(api.compat)throw Error(RO);localStorage.removeItem(key)}};root.ManagementStorage=api;})(window);
