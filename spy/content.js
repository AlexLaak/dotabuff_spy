//debugger;

const PLAYERS = 10;

var waiting = true;
var messageContent = undefined;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function htmlAlter()
{
    var x = document.getElementsByClassName("tf-pl single-lines");

    while (waiting)
    {
        await sleep(500);
    }

    const MATCHED_PLAYERS = parseMsg(messageContent);

    for (let i = 0; i < PLAYERS; i++)
    {
        var curInnerHTML = x[i].innerHTML;

        if (curInnerHTML.includes(" Anonymous"))
        {
            continue;
        }

        var playerName = x[i].getElementsByTagName("A")[0].outerText;
        var playerIndex = findPlayerIndex(MATCHED_PLAYERS, playerName);

        if (playerIndex != undefined)
        {
            console.log(playerIndex);
            curInnerHTML += '<p style="text-align:right;">Matches found!</p>';
            x[i].innerHTML = curInnerHTML;
        }
    }
}

function parseMsg(msg)
{
    return msg.matched_players;
}

function findPlayerIndex(json, name)
{
    for (let i = 0; i < json.length; i++)
    {
        if (json[i].player_name == name)
        {
            return i;
        }
    }
    return undefined;
}

var port = chrome.extension.connect({
    name: "F2BConnection"
});
port.postMessage("Connected to back-end");
port.onMessage.addListener(function(msg) {
    messageContent = msg;
    waiting = false;
});

htmlAlter();


