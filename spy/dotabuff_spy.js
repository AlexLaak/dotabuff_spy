const MY_ID = 16461605;
const WHITELISTED_IDS = [71373154, 70852572, 84181635, 86710513, 52771263];

// GET request
// @param url
// @param timeout (in seconds)
function httpGETRequest(url, timeout)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);

    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
    {
        return xmlHttp.responseText;
    }
    return null;
}

// queries openDOTA api
// @param url
function apiQuery(url)
{
    const RES = httpGETRequest(url);
    if (RES)
    {
        return RES;
    }
    console.log("failed to query api");
    return null;
}

// queries match data
// @param matchId
function queryMatch(matchId)
{
    const MATCH_URL = "https://api.opendota.com/api/matches/" + matchId;
    console.log("api call queryMatch");
    return JSON.parse(apiQuery(MATCH_URL));
}

// queries matches that include my_account_id and target_account_id
// @param my_account_id
// @param target_account_id
function queryPlayedMatches(my_account_id, target_account_id)
{
    const PLAYED_WITH_URL = "https://api.opendota.com/api/players/" +
        my_account_id +
        "/matches?included_account_id=" +
        target_account_id;
    console.log("api call queryPlayedMatches");
    return JSON.parse(apiQuery(PLAYED_WITH_URL));

}

function assert(condition, message)
{
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

// fetches match players
// @param matchId
function getMatchPlayers(matchId)
{
    const JSON_OBJ = queryMatch(matchId);
    assert(JSON_OBJ.players.length == 10);

    var matchIdArr = [];
    var matchPlayersArr = [];
    var matchPlayerObj = { "player_names": matchPlayersArr, "ids": matchIdArr};
    for (let index = 0; index < JSON_OBJ.players.length; index++)
    {
        const player = JSON_OBJ.players[index];
        if (player.account_id != null)
        {
            matchIdArr.push(player.account_id);
            matchPlayersArr.push(player.personaname);
        }
    }
    return matchPlayerObj;
}

// fetches matches played with account_id
// @param account_ids
function getMatchesPlayedWithId(account_id)
{
    const JSON_OBJ = queryPlayedMatches(MY_ID, account_id);
    return JSON_OBJ;
}

//?included_account_id=71373154&included_account_id=70852572

// generates dotabuff links from json object that contains matches
// @param matches_played (json object)
// @param match_id (for excluding this match from the list)
function generateDotabuffLinks(matches_played, match_id)
{
    const DOTABUFF_PREFIX = "https://www.dotabuff.com/matches/";
    var linksArr = [];

    for (let index = 0; index < matches_played.length; index++)
    {
    	if (matches_played[index].match_id != match_id)
        	linksArr.push(DOTABUFF_PREFIX + matches_played[index].match_id);
    }
    return linksArr;
}

// generates dotabuff links for all previously played games with players in @param match_id
// @param match_id
function getMatchPreviouslyPlayedWith(match_id)
{
	const MATCH_PLAYERS = getMatchPlayers(match_id);
    const MATCH_PLAYER_IDS = MATCH_PLAYERS.ids;
    var matched_players_match_links = [];
    var baseObj = { "matched_players": matched_players_match_links };

    for (let index = 0; index < MATCH_PLAYER_IDS.length; index++)
    {
        const PLAYER_ID = MATCH_PLAYER_IDS[index];
        const PLAYER_NAME = MATCH_PLAYERS.player_names[index];
        if (PLAYER_ID != MY_ID && !WHITELISTED_IDS.includes(PLAYER_ID))
        {
            const PREVIOUS_MATCHES = getMatchesPlayedWithId(PLAYER_ID);
            if (PREVIOUS_MATCHES != null)
            {
                const DOTABUFF_LINKS_ARR = generateDotabuffLinks(PREVIOUS_MATCHES, match_id);
                var playerObj = { "player_id": PLAYER_ID, "player_name": PLAYER_NAME, "matches": DOTABUFF_LINKS_ARR};
                if (DOTABUFF_LINKS_ARR.length > 0)
                	matched_players_match_links.push(playerObj);
            }
        }
    }
    return baseObj;
}


function getMatchIdFromUrl(url)
{
	const URL_OBJ = new URL(url);
	return URL_OBJ.pathname.split('/')[2];
}

chrome.webNavigation.onCompleted.addListener(tab => 
{
	chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
		let url = tabs[0].url;
		if (/^https:\/\/www\.dotabuff\.com\/matches/.test(url))
		{
			console.log(getMatchPreviouslyPlayedWith(getMatchIdFromUrl(url)));
		}
	});
});


