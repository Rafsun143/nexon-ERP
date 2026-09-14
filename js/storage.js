const KEY="nexora_db_v1";
const seed={
employees:[
{id:1,name:"Aarav Hasan",email:"aarav@nexora.local",phone:"+8801710000001",role:"Administrator",department:"Management",salary:65000,status:"Active"},
{id:2,name:"Nusrat Jahan",email:"nusrat@nexora.local",phone:"+8801710000002",role:"Sales Manager",department:"Sales",salary:52000,status:"Active"},
{id:3,name:"Tanvir Ahmed",email:"tanvir@nexora.local",phone:"+8801710000003",role:"Sales Executive",department:"Sales",salary:32000,status:"Active"},
{id:4,name:"Sadia Rahman",email:"sadia@nexora.local",phone:"+8801710000004",role:"HR Officer",department:"HR",salary:41000,status:"Inactive"},
{id:5,name:"Imran Kabir",email:"imran@nexora.local",phone:"+8801710000005",role:"Inventory Officer",department:"Operations",salary:36000,status:"Active"}],
customers:[
{id:1,name:"Rahim Traders",email:"rahim@example.com",phone:"+8801811000001",company:"Rahim Traders",city:"Dhaka",status:"Active"},
{id:2,name:"Maya Fashion",email:"maya@example.com",phone:"+8801811000002",company:"Maya Fashion",city:"Chattogram",status:"Active"},
{id:3,name:"Nova Electronics",email:"nova@example.com",phone:"+8801811000003",company:"Nova Electronics",city:"Cumilla",status:"Active"},
{id:4,name:"Green Mart",email:"green@example.com",phone:"+8801811000004",company:"Green Mart",city:"Sylhet",status:"Inactive"}],
products:[
{id:1,name:"Premium Headphones",category:"Electronics",price:4500,quantity:24,reorder:8,status:"In Stock"},
{id:2,name:"Wireless Keyboard",category:"Electronics",price:2800,quantity:17,reorder:6,status:"In Stock"},
{id:3,name:"Office Chair",category:"Furniture",price:12500,quantity:5,reorder:6,status:"Low Stock"},
{id:4,name:"LED Monitor 24\"",category:"Electronics",price:18500,quantity:12,reorder:5,status:"In Stock"},
{id:5,name:"Notebook Pack",category:"Stationery",price:650,quantity:2,reorder:5,status:"Low Stock"},
{id:6,name:"USB-C Hub",category:"Accessories",price:2200,quantity:0,reorder:4,status:"Out of Stock"}],
orders:[
{id:1001,customer:"Rahim Traders",items:3,total:19500,status:"Paid",date:"2026-09-11"},
{id:1002,customer:"Maya Fashion",items:2,total:7300,status:"Paid",date:"2026-09-10"},
{id:1003,customer:"Nova Electronics",items:4,total:28400,status:"Pending",date:"2026-09-09"},
{id:1004,customer:"Green Mart",items:1,total:12500,status:"Paid",date:"2026-09-08"},
{id:1005,customer:"Rahim Traders",items:2,total:4500,status:"Pending",date:"2026-09-07"}],
notifications:[
{id:1,title:"Low stock alert",message:"Office Chair has reached its reorder level.",type:"warning",read:false,time:"Today"},
{id:2,title:"New order received",message:"Order #1003 is waiting for payment.",type:"info",read:false,time:"Today"},
{id:3,title:"Customer updated",message:"Nova Electronics profile was updated.",type:"success",read:true,time:"Yesterday"}],
finance:[
{month:"Apr",income:380000,expenses:245000},{month:"May",income:420000,expenses:262000},{month:"Jun",income:465000,expenses:281000},{month:"Jul",income:510000,expenses:305000},{month:"Aug",income:548000,expenses:319000},{month:"Sep",income:585000,expenses:334000}]
};
export function loadDB(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x)return x}catch{};localStorage.setItem(KEY,JSON.stringify(seed));return structuredClone(seed)}
export function saveDB(db){localStorage.setItem(KEY,JSON.stringify(db));return db}
export function resetDB(){localStorage.setItem(KEY,JSON.stringify(seed));return structuredClone(seed)}
export function getCollection(name){return loadDB()[name]||[]}
export function saveCollection(name,data){const db=loadDB();db[name]=data;saveDB(db);return data}
export function nextId(list){return list.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1}