var save=document.getElementById('save');
var checks=document.getElementsByTagName('input');
for(let i=0;i<checks.length;i++)
{
	// chrome.storage.sync.get([checks[i].innerHTML],function(result){
	// 	checks[i].checked=result[checks[i].innerHTML];
	// });
	(function(index) {
        chrome.storage.sync.get(checks[index].value, function(result) {
            checks[index].checked = result[checks[index].value];
        });
    })(i);
}
save.onclick=function()
{
	for(let i=0;i<checks.length;i++)
	{
		if(checks[i].type=='checkbox')
		{
			chrome.storage.sync.set({[checks[i].value]: checks[i].checked},function(){/* alert('保存成功'); */});
		}
	}
}