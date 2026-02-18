var btn=document.getElementsByClassName('btn');
var text=document.getElementById('text');
var val=text.value;
for(var i in btn)
{
	i.onclick=function(){
		val+=('<'+i.dataset.val+'>');
		if(i.dataset.have)
		{
			val+=window.prompt('包含的内容','text');
			val+=('</'+i.dataset.val+'>');
		}
		text.value=val;
	}
}