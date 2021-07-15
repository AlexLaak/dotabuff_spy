// GLOBALS
var lastQueriedMatch;
var heroesObj;
loadHeroesJson();

// TODO: make dynamically editable
const MY_ID = 16461605;
const WHITELISTED_IDS = [71373154, 70852572, 84181635, 86710513, 52771263];

// GET request
// @param url
function httpGETRequest(url)
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

// loads json file and loads it into obj
function loadHeroesJson()
{
    var xhr = new XMLHttpRequest;
    xhr.open("GET", chrome.runtime.getURL("heroes.json"));
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
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
    const DOTABUFF_PREFIX = "https://www.dotabuff.com/matches/";
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
            var matchObj = {"match_link": generateDotabuffLink(matches_played[index]),
                            "win": isVictorious(matches_played[index]),
                            "kills": generatePlayerScoreFromMatch(matches_played[index]).kills,
                            "deaths": generatePlayerScoreFromMatch(matches_played[index]).deaths,
                            "assists": generatePlayerScoreFromMatch(matches_played[index]).assists,
                            "hero": fetchPlayedHeroName(matches_played[index]),
                            "date": fetchMatchDate(matches_played[index])};
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
    if (lastQueriedMatch == match_id)
    {
        assert(lastQueriedMatch != undefined);
        // skip query to prevent fetching same page again
        return "Already queried match: " + match_id;
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
    return baseObj;
}

// parses the match id from given url
// @param url
function getMatchIdFromUrl(url)
{
	const URL_OBJ = new URL(url);
	return URL_OBJ.pathname.split('/')[2];
}

// chrome extension magic
chrome.extension.onConnect.addListener(function (port) {
    console.log("Connected to front-end.....");
    chrome.webNavigation.onCompleted.addListener(tab => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            if (/^https:\/\/www\.dotabuff\.com\/matches/.test(url)) {
                port.postMessage(getMatchPreviouslyPlayedWith(getMatchIdFromUrl(url)));
            }
        });
    });
})