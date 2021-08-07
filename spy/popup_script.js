document.getElementById("inputBtn").addEventListener("click", onPlayerIDSubmit);
document.getElementById("whitelistInputBtn").addEventListener("click", onWhitelistPlayerIDSubmit);

function onPlayerIDSubmit()
{
    console.log("submitting " + document.getElementById("player_id").value);
    document.getElementById("player_id").value = "";
}

function onWhitelistPlayerIDSubmit()
{
    console.log("whitelisting " + document.getElementById("whitelisted_id").value);
    document.getElementById("whitelisted_id").value = "";
}