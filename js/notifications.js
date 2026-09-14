import {getCollection,saveCollection} from "./storage.js";import {toast} from "./toast.js";
export function getNotifications(){return getCollection("notifications")}
export function unreadCount(){return getNotifications().filter(n=>!n.read).length}
export function markRead(id){const a=getNotifications().map(n=>n.id===id?{...n,read:true}:n);saveCollection("notifications",a)}
export function notify(title,message,type="info"){const a=getNotifications();a.unshift({id:Date.now(),title,message,type,read:false,time:"Just now"});saveCollection("notifications",a);toast(message,type,title)}