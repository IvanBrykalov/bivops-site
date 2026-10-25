'use strict';
function subnet(value){
 const m=value.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
 if(!m)throw new Error('Enter an IPv4 address with a prefix, for example 10.20.0.10/24.');
 const octets=m.slice(1,5).map(Number),prefix=Number(m[5]);
 if(octets.some(x=>x>255)||prefix>32)throw new Error('Octets must be 0-255; prefix must be 0-32.');
 const ip=octets.reduce((a,n)=>(a*256+n)>>>0,0),mask=prefix===0?0:(0xffffffff<<(32-prefix))>>>0;
 const net=(ip&mask)>>>0,last=(net|~mask)>>>0,count=2**(32-prefix);
 const fmt=n=>[24,16,8,0].map(s=>(n>>>s)&255).join('.');
 return ['Network: '+fmt(net)+'/'+prefix,'Subnet mask: '+fmt(mask),'Last address: '+fmt(last),'Total addresses: '+count,'Usable host addresses: '+(prefix>=31?count:count-2),'Host range: '+fmt(prefix>=31?net:net+1)+' - '+fmt(prefix>=31?last:last-1),'General IPv4 calculation. AWS VPC has separate reservation rules.'].join('\n');
}
function encode64(s){return btoa(Array.from(new TextEncoder().encode(s),b=>String.fromCharCode(b)).join(''));}
function decode64(s){return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
if(typeof module!=='undefined')module.exports={subnet,encode64,decode64};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let current='json',result='';
 const configs={
 json:['Make JSON readable','Validate syntax and format with indentation. Large numbers may lose precision when parsed.','JSON input','{"project":"bivops","tools":["json","base64","cidr"]}','Format JSON'],
 base64:['Text ↔ Base64','Encode or decode UTF-8 text. Base64 is encoding, not encryption.','Text or Base64 input','Hello, BIVOPS!','Convert'],
 cidr:['Understand an IPv4 subnet','General IPv4 addressing. /31 is treated as a point-to-point link; /32 as a single host.','IPv4 address / prefix','10.20.0.10/24','Calculate']};
 const reset=()=>{result='';$('copy').disabled=true;$('output').textContent='Your result will appear here.';$('feedback').textContent='Processed locally. Input limit: 1 million characters.';};
 function selectTool(name){current=Object.hasOwn(configs,name)?name:'json';document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===current)));const c=configs[current];$('title').textContent=c[0];$('desc').textContent=c[1];$('label').textContent=c[2];$('input').value=c[3];$('run').textContent=c[4];$('mode').hidden=current!=='base64';reset();}
 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{if(location.hash==='#'+b.dataset.tool)selectTool(b.dataset.tool);else location.hash=b.dataset.tool;}));
 window.addEventListener('hashchange',()=>selectTool(location.hash.slice(1)));
 $('input').addEventListener('input',reset);$('mode').addEventListener('change',reset);
 $('run').addEventListener('click',()=>{try{const v=$('input').value;if(v.length>1000000)throw new Error('The input limit is 1 million characters.');result=current==='json'?JSON.stringify(JSON.parse(v),null,2):current==='cidr'?subnet(v):$('mode').value==='encode'?encode64(v):decode64(v);$('output').textContent=result||'(empty result)';$('copy').disabled=false;$('feedback').textContent='Done. Processed entirely in your browser.';}catch(e){result='';$('copy').disabled=true;$('output').textContent='Error: '+(current==='base64'?'Check the Base64 input: it must decode to valid UTF-8 text.':e.message);$('feedback').textContent='Check your input and try again.';}});
 $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(result);$('feedback').textContent='Copied.';}catch{$('feedback').textContent='Clipboard unavailable. Select the result and copy it manually.';}});
 selectTool(location.hash.slice(1));
}
