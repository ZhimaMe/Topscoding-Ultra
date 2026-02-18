var detect=document.getElementById('detect');
detect.onclick=function()
{
	var zt=document.getElementById('zt');
	chrome.storage.sync.set({'key':123},function(){
		console.log('检测开始');
		zt.innerHTML='检测中';
	});
	chrome.storage.sync.get(['key'],function(result){
		if(result.key==123)
			zt.innerHTML='可用';
		else
			zt.innerHTML='不可用';
	});
}