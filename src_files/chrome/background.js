var browser = chrome;
var policies = [];
var blocked = new Object();
var user;
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if(tab.url.includes("productivityio.azurewebsites.net/dashboard")){
    	browser.tabs.executeScript(tab.id, {code: 'localStorage.getItem("user")'}, function(result){
    		user = result[0]
    	});
    }
    else if(tab.url === "https://productivityio.azurewebsites.net" || tab.url === "http://productivityio.azurewebsites.net"){
    	user = undefined;
    }
    if(user !== undefined){
    	fetch("https://productivityio.azurewebsites.net/policy?user="+user, {
        		method: 'GET'
        	})
        	.then(r => r.json())
        	.then(data => {
        		policies = data
        		for(var i = 0; i < data.length; i++){
        			blocked[data[i]] = 0
        		}
	        })
	    fetch("https://productivityio.azurewebsites.net/timer?user="+user, {
	    	method: 'GET'
	    }).then(r => r.json())
	    .then(data => {
	    	if(data == 1){
	    		updateBlockers();
	    	}
	    	else{
	    		browser.webRequest.onBeforeRequest.removeListener(blockRequest);
	    	}
	    })
    }
});

//block outgoing http requets from the urls specified on productivityIO
function blockRequest(details){
	for(var i = 0; i < policies.length; i++){
		if(details.url.includes(policies[i])){
			//only alert user once
			if(blocked[policies[i]] == 0){
				if(confirm("Are you sure you want to go to " + policies[i] + "? This would cause your hero to lose health!!")){
					blocked[policies[i]] += 1;
					browser.webRequest.onBeforeRequest.removeListener(blockRequest);
					const searchParams = new URLSearchParams();
					searchParams.set('user', user);
					searchParams.set('play', 0);
					searchParams.set('healthIncrease', -1);
					searchParams.set('timer', 0);
					fetch("https://productivityio.azurewebsites.net/play", {
						method: 'POST',
						body: searchParams
					})
					fetch('https://productivityio.azurewebsites.net/timer', {
						method: 'POST',
						body: searchParams
					})
					return {cancel: false}
				}
				else{
					blocked[policies[i]] += 1;
					return {cancel: true};
				}
			}
		}
	}
	return {cancel: false};
}

function updateBlockers(){
	chrome.webRequest.onBeforeRequest.addListener(blockRequest, {urls: ["<all_urls>"]}, ["blocking"])
}

//updateBlockers();