// GLOBALS
var lastQueriedMatch;
var heroesObj;
loadHeroesJson();
var totalApiCallTime=0;
var lastQueriedData;
const DOTABUFF_MATCH_LINK = "https://www.dotabuff.com/matches/";

// Configuration
var MY_ID;
var WHITELISTED_IDS = [];
var whitelisted_ids_length;
getCookie("player_id", function(id) {
    MY_ID = id;
});
getCookie("whitelisted_ids_length", function(length) {
    whitelisted_ids_length = parseInt(length);
    console.log(whitelisted_ids_length)
    for (let index = 0; index < whitelisted_ids_length; index++) {
        getCookie("whitelisted_id"+index.toString(), function(id) {
            WHITELISTED_IDS.push(parseInt(id));
        });
    }
});

// assertion helper
// @param condition
// @param (optional) message
function assert(condition, message)
{
    if (!condition)
    {
        throw new Error(message || "Assertion failed");
    }
}

// GET request
// @param url
function httpGETRequest(url)
{
    var startTime = Date.now();
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);

    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
    {
        var timeTaken = Date.now() - startTime;
        console.log("Elapsed time on API call: " + timeTaken + "ms");
        totalApiCallTime += timeTaken;
        return xmlHttp.responseText;
    }
    return null;
}

// loads json file and loads it into obj
function loadHeroesJson()
{
    var xhr = new XMLHttpRequest;
    xhr.open("GET", chrome.runtime.getURL("heroes.json"));
    xhr.onreadystatechange = function () {
        if (this.readyState == 4)
        {
            heroesObj = JSON.parse(xhr.responseText);
        }
    };
    xhr.send();
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

// generates dotabuff link from given match json object
// @param matchObj
function generateDotabuffLink(matchObj)
{
    const DOTABUFF_PREFIX = DOTABUFF_MATCH_LINK;
    return DOTABUFF_PREFIX + matchObj.match_id;
}

// checks if player won the match
// @param matchObj
function isVictorious(matchObj)
{
    const PLAYER_SLOT = matchObj.player_slot;
    const RADIANT_WIN = matchObj.radiant_win;

    if (PLAYER_SLOT < 10 && RADIANT_WIN)
        return true;
    if (PLAYER_SLOT > 100 && !RADIANT_WIN)
        return true;
    return false;
}

// generates json object containing players score from that specific match
// @param matchObj
function generatePlayerScoreFromMatch(matchObj)
{
    var scoreObj = {"kills": matchObj.kills, "deaths": matchObj.deaths, "assists": matchObj.assists};
    return scoreObj;
}

// generates string from given hero id that maps to the hero localized name
// @param matchObj
function fetchPlayedHeroName(matchObj)
{
    const HERO_ID = matchObj.hero_id;

    for (let id = 0; id < heroesObj.heroes.length; ++id)
    {
        const JSON_HERO_ID = heroesObj.heroes[id].id;
        if (JSON_HERO_ID == HERO_ID)
        {
            return heroesObj.heroes[id].localized_name + " hero_id: " + HERO_ID;
        }
    }
    return "unmapped hero" + " hero_id: " + HERO_ID;
}

// generates an date object of the match date
// @param matchObj
function fetchMatchDate(matchObj)
{
    const TIME_EPOCH = matchObj.start_time;
    var date = new Date(0);
    date.setUTCSeconds(TIME_EPOCH);
    return date;
}

// calculates days since given match
// @param match Date obj
function calculateDaysSinceMatch(matchDate)
{
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    return Math.round(Math.abs((today - matchDate) / oneDay));
}

// generates the matches array which contains the dotabuff links to matches and match results
// @param matches_played all matches played with
// @param match_id current match ID to exclude it from the list
function generateGames(matches_played, match_id)
{
    var matchesArr = [];

    for (let index = 0; index < matches_played.length; index++)
    {
    	if (matches_played[index].match_id != match_id)
        {
            var matchDate = fetchMatchDate(matches_played[index]);
            var matchObj = {"match_link": generateDotabuffLink(matches_played[index]),
                            "win": isVictorious(matches_played[index]),
                            "kills": generatePlayerScoreFromMatch(matches_played[index]).kills,
                            "deaths": generatePlayerScoreFromMatch(matches_played[index]).deaths,
                            "assists": generatePlayerScoreFromMatch(matches_played[index]).assists,
                            "hero": fetchPlayedHeroName(matches_played[index]),
                            "date": matchDate,
                            "days_since_match": calculateDaysSinceMatch(matchDate) + " days"};
            matchesArr.push(matchObj);
        }
    }
    return matchesArr;
}

// generates score (win/loss) from given matches
// @param matches json object
function generateScoreFromMatches(matches)
{
    var wins = 0, losses = 0;
    for (let i = 0; i < matches.length; i++)
    {
        const match = matches[i];
        if (match.win == true)
        {
            wins++;
        }
        else
        {
            losses++;
        }
    }

    var scoreObj = {"wins": wins, "losses": losses};
    return scoreObj;
}

// generates dotabuff links for all previously played games with players in @param match_id
// @param match_id
function getMatchPreviouslyPlayedWith(match_id)
{
    if (!MY_ID)
    {
        return "ID not set";
    }
    if (lastQueriedMatch == match_id)
    {
        assert(lastQueriedMatch != undefined);
        // skip query to prevent fetching same page again
        console.log("Skipping requerying of same match " + match_id);
        
        return lastQueriedData;
    }

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
                const MATCHES_ARR = generateGames(PREVIOUS_MATCHES, match_id);
                var SCORE = {"wins": 0, "losses": 0};
                if (MATCHES_ARR != undefined)
                {
                    SCORE = generateScoreFromMatches(MATCHES_ARR);
                }
                var playerObj = { "player_id": PLAYER_ID, "player_name": PLAYER_NAME, "matches": MATCHES_ARR, "wins": SCORE.wins, "losses": SCORE.losses};
                if (MATCHES_ARR.length > 0)
                	matched_players_match_links.push(playerObj);
            }
        }
    }
    lastQueriedMatch = match_id;
    lastQueriedData = baseObj;
    return baseObj;
}

// parses the match id from given url
// @param url
function getMatchIdFromUrl(url)
{
    const URL_OBJ = new URL(url);
    return URL_OBJ.pathname.split('/')[2];
}

// updates dotabuff spy configuration as is received from popup
// @param msg which contains either player_id or whitelisted_ids array
function updateConfiguration(data)
{
    if (data.player_id)
    {
        MY_ID = data.player_id;
    }
    else if (data.whitelisted_ids)
    {
        WHITELISTED_IDS = data.whitelisted_ids;
    }
    saveToCookies();
}

// syncs popup view data with current backend data
function syncPopupWithBackend()
{
    var currentConfig = {"player_id": MY_ID, "whitelisted_ids": WHITELISTED_IDS};
    return currentConfig;
}

// saves current values to chrome cookies with three year expiration
function saveToCookies()
{
    const THREE_YEARS_IN_SEC = 94670777;
    chrome.cookies.set({
        "url": DOTABUFF_MATCH_LINK+'*',
        "name": "player_id",
        "value": MY_ID,
        "expirationDate": ((new Date().getTime() / 1000) + THREE_YEARS_IN_SEC) });
    chrome.cookies.set({
        "url": DOTABUFF_MATCH_LINK+'*',
        "name": "whitelisted_ids_length",
        "value": WHITELISTED_IDS.length.toString(),
        "expirationDate": ((new Date().getTime() / 1000) + THREE_YEARS_IN_SEC)});
    for (let index = 0; index < WHITELISTED_IDS.length; index++) {
        const WHITELISTED_ID = WHITELISTED_IDS[index];
        chrome.cookies.set({
            "url": DOTABUFF_MATCH_LINK+'*',
            "name": "whitelisted_id"+index.toString(),
            "value": WHITELISTED_ID.toString(),
            "expirationDate": ((new Date().getTime() / 1000) + THREE_YEARS_IN_SEC) });
    }
}

// fetches given cookie from chrome cookies
// @param name cookie name
// @param callback function
function getCookie(name, callback)
{
    chrome.cookies.get({"url": DOTABUFF_MATCH_LINK+'*', "name": name}, function(cookie) {
        if (callback && cookie)
        {
            callback(cookie.value);
        }
    });
}

// Listener for popup view
chrome.extension.onConnect.addListener(function(port) {
    port.postMessage(syncPopupWithBackend());
    port.onMessage.addListener(function(msg) {
        updateConfiguration(msg);
    });
})

// Listener for content (front-end) view
chrome.webNavigation.onCompleted.addListener(tab => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true, currentWindow: true }, tabs => {
        let url = tabs[0].url;
        if (/^https:\/\/www\.dotabuff\.com\/matches/.test(url))
        {
            chrome.tabs.sendMessage(tabs[0].id, {data: getMatchPreviouslyPlayedWith(getMatchIdFromUrl(url))}, function(response) {
                console.log(response.msg);
            });
            console.log("Total time taken for API calls " + totalApiCallTime + "ms");
            totalApiCallTime = 0;
        }
    });
});