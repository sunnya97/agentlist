import {writeFile} from 'node:fs/promises';
const [id,name,website]=process.argv.slice(2);
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id||'')||!name||!website){console.error('Usage: npm run add:agent -- agent-id "Agent Name" https://official.example');process.exit(1)}
const parsed=new URL(website);if(!['https:','http:'].includes(parsed.protocol))throw new Error('Use an HTTP(S) official website.');
const today=new Date().toISOString().slice(0,10),sourceId=`${id}-home`;
const record={id,name,organization:name,summary:'',website:parsed.href,repository:null,category:'managed',aliases:[],logo:{path:`./logos/${id}.png`,sourceUrl:'',sourcePage:parsed.href,kind:'product'},claims:[],sources:[{id:sourceId,title:`${name} official website`,url:parsed.href,checkedAt:today}],platforms:[],plans:[],hardware:{status:'unknown',name:'',detail:'',sourceIds:[]},discussions:[],company:null,launches:[]};
const path=new URL(`../data/agents/${id}.json`,import.meta.url);
await writeFile(path,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(`Created data/agents/${id}.json. Add a summary, source-backed facts, and an official logo at src/logos/${id}.png. Record the logo source URL. Update data/catalog.json checkedAt when adding newer research. Then run npm run verify.`);
