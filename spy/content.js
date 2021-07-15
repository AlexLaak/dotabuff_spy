//debugger;

const PLAYERS = 10;

var waiting = true;
const WAITING_PERIOD = 500; //ms
var messageContent = undefined;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function htmlAlter()
{
    var x = document.getElementsByClassName("tf-pl single-lines");

    while (waiting)
    {
        await sleep(WAITING_PERIOD);
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
            curInnerHTML += '<p class="losses">' + MATCHED_PLAYERS[playerIndex].losses +
            '</p><p class="dash"> - </p><p class="losses"><p class="wins">'
            + MATCHED_PLAYERS[playerIndex].wins + '</p>';

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
    if (json != undefined)
    {
        for (let i = 0; i < json.length; i++)
        {
            if (json[i].player_name == name)
            {
                return i;
            }
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


