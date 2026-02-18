var save=document.getElementById('submit');
var note=document.getElementById('note');
chrome.storage.sync.get(['note'],function(result){
	note.value=result.note;
});
save.onclick=function(){
	var note=document.getElementById('note');
	chrome.storage.sync.set({'note':note.value},function(){/*alert('保存成功');*/});
}