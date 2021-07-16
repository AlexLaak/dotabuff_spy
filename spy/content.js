//debugger;

const PLAYERS = 10;
const WAITING_PERIOD = 500; //ms

var waiting = true;
var messageContent = undefined;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function htmlAlter()
{
    var loadTextPlace = document.getElementsByClassName("match-victory-subtitle");
    var loadText = document.createElement("P");
    loadText.innerHTML = "Loading matched players...";
    loadTextPlace[0].appendChild(loadText);

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
            // placeholder for displaying data in content script
            console.log(MATCHED_PLAYERS[playerIndex]);

            curInnerHTML += '<p class="losses">' + MATCHED_PLAYERS[playerIndex].losses +
            '</p><p class="dash"> - </p><p class="wins">' + MATCHED_PLAYERS[playerIndex].wins + '</p>';

            x[i].innerHTML = curInnerHTML;
        }
    }
    loadText.remove();
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

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse)
    {
        if (request.data)
        {
            messageContent = request.data;
            waiting = false;
        }
        sendResponse({ msg: "data was processed from back-end"});
    }
);

htmlAlter();


