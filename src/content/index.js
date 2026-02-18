console.log(window,'Topscoding Ultra插件成功运行');
//window.alert('Topscoding Ultra插件成功运行');
var check_run=function(id,callback){
	/*chrome.storage.sync.get(id,function(result){
		if(result[id]!='false'){
			callback();
		}
	});*/
	callback();
}
check_run('1',function(){
	var imgs=document.getElementsByTagName('img');
	for(var it of imgs)
	{
		if(it.height>1000)
		{
			//it.style.display='none';
			it.outerHTML='超大图片已被屏蔽';
		}
	}
});
check_run('2',function(){
	var footer=document.getElementsByClassName('footer__extra-link');
	footer[0].style.display='none';
	var cato=document.getElementsByClassName('footer__category');
	cato[0].style.display='none';
	cato[1].style.display='none';
	cato[2].style.display='none';
	cato[3].style.display='none';
	cato[4].style.display='none';
	cato[5].style.display='none';
	if(location.pathname=='/' && location.host.endsWith('topscoding.com'))
	{
		var d=document.getElementsByClassName('discussion__list');
		if(d.length>0) d[0].style.display='none';
	}
});
/*check_run('3',function(){
	// alert(location.href);
	// if(location.href.endsWith('discuss'))
	{
		let times=document.getElementsByClassName('time');
		alert(times.length);
		for(let i of times)
		{
			if(i.tagName!='SPAN') continue;
			if(Data().now()-i.dataset.timestamp > 31536000)
			{
				console.log(i);
				console.log(i.dataset.timestamp);
				i.parentElement.parentElement.parentElement.parentElement.parentElement.style.display='none';
			}
		}
	}
});*/
check_run('3',function(){
	if(location.href.endsWith('discuss'))
	{
		let times=document.getElementsByClassName('time');
		for(let i of times)
		{
			if(i.tagName!='SPAN') continue;
			let str=i.outerHTML;
			let idxb=str.indexOf('datetime');
			idxb+=10;
			let idxe=(str.indexOf('"',idxb));
			let datetime=str.substring(idxb,idxe);
			if(new Date().getTime()-datetime > 31536000000)
			{
				i.parentNode.parentNode.parentNode.parentNode.parentNode.style.display='none';
			}
		}
	}
	
});
const make_dicuess_raw_url = () => {
	let ih='';
	ih+=window.location.protocol + '//' + window.location.host;
	ih+=location.pathname;
	ih+='/raw';
	return ih;
};
check_run('4',function(){
	// if(window.location.href.indexOf('discuss')==-1) return;
	setTimeout(()=>{
		let menunavmore=document.getElementById('menu-nav-more');
		let newnode=document.createElement('li');
		newnode.classList.add('menu__item');
		let ih='';
		ih+='<a href="';
		ih+=window.location.protocol + '//' + window.location.host;
		ih+=location.pathname;
		ih+='/raw" class="menu__link">下载讨论内容</a>';
		newnode.innerHTML=ih;
		menunavmore.appendChild(newnode);
	},1000);
});
function checkFileExists(url)
{
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	{
	  if (xhr.readyState === 4) {
		if (xhr.status === 200) {
		  return (true);
		} else {
		  return (false); 
		}
	  }
	};
	xhr.send();
}
function fetchData(url,callback)
{
	let xhr=new XMLHttpRequest();
	xhr.open('GET',url);
	xhr.send();
	xhr.onreadystatechange = ()=>{
		if(xhr.readyState == 4)
		{
			if(xhr.status==200)
			{
				callback(xhr.responseText);
			}
			else console.error(xhr.status);
		}
	}
	return xhr.responseText;
}
check_run('5',function(){
	// if(window.location.href.indexOf('discuss')==-1) return;
	setTimeout(()=>{
		let discuessbody=document.getElementsByClassName('topic__content');
		discuessbody[0].oncontextmenu=()=>{true};
		discuessbody[0].oncopy=()=>{true};
		discuessbody[0].oncut=()=>{true};
		console.log(discuessbody[0].innerHTML);
		console.log(make_dicuess_raw_url());
		setTimeout(()=>{
			fetchData(make_dicuess_raw_url(),(str)=>{
				let render=new marked.Renderer();
				discuessbody[0].innerHTML=marked(str,{renderer:render,sanitize:false}); 
			});
		},500);
	},1000);
});
