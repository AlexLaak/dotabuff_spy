document.getElementById("inputBtn").addEventListener("click", onPlayerIDSubmit);
document.getElementById("whitelistInputBtn").addEventListener("click", onWhitelistPlayerIDSubmit);

var player_id = 0;
var whitelisted_ids = [];

function onPlayerIDSubmit()
{
    let id = document.getElementById("player_id").value;
    document.getElementById("player_id").value = "";
    player_id = id;
    let playerid_obj = {"player_id": id};
    document.getElementById("player_id_display").innerHTML = player_id;
    port.postMessage(playerid_obj);
}

function onWhitelistPlayerIDSubmit()
{
    let whitelisted_id = document.getElementById("whitelisted_id").value;
    document.getElementById("whitelisted_id").value = "";
    whitelisted_ids.push(parseInt(whitelisted_id));

    let whitelistedids_obj = {"whitelisted_ids": whitelisted_ids};
    port.postMessage(whitelistedids_obj);

    var list = document.getElementById('whitelisted_ids_list');
    var entry = document.createElement('li');
    entry.innerHTML = whitelisted_id;
    list.appendChild(entry);
}

// This function gets called when the popup menu is opened
function updateCurrentIDsViaBackend(data)
{
    player_id = data.player_id;
    whitelisted_ids = data.whitelisted_ids;
    document.getElementById("player_id_display").innerHTML = player_id;
    var list = document.getElementById('whitelisted_ids_list');

    for (let index = 0; index < whitelisted_ids.length; index++)
    {
        const id = whitelisted_ids[index];
        var entry = document.createElement('li');
        entry.innerHTML = id
        list.appendChild(entry);
    }
}

var port = chrome.extension.connect({
    name: "Popup to backend connection"
});
port.onMessage.addListener(function(data) {
    updateCurrentIDsViaBackend(data);
});