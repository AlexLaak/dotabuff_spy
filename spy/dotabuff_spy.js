var querier = require('./api_query.js');

const MY_ID = 16461605;
const WHITELISTED_IDS = [71373154, 70852572, 84181635, 86710513, 52771263];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

// fetches matches player ids
// @param matchId
function getMatchPlayerIds(matchId)
{
    const JSON_OBJ = querier.queryMatch(matchId);
    assert(JSON_OBJ.players.length == 10);

    var matchIdArr = [];
    for (let index = 0; index < JSON_OBJ.players.length; index++) {
        const player = JSON_OBJ.players[index];
        if (player.account_id != null)
            matchIdArr.push(player.account_id);
    }
    return matchIdArr;
}

// fetches matches played with account_id
// @param account_id
function getMatchesPlayedWithId(account_id)
{
    const JSON_OBJ = querier.queryPlayedMatches(MY_ID, account_id);
    return JSON_OBJ;
}

// generates dotabuff links from json object that contains matches
// @param matches_played (json object)
function generateDotabuffLinks(matches_played)
{
    const DOTABUFF_PREFIX = "https://www.dotabuff.com/matches/";
    var linksArr = [];

    for (let index = 0; index < matches_played.length; index++)
    {
        linksArr.push(DOTABUFF_PREFIX + matches_played[index].match_id);
    }
    return linksArr;
}

// generates dotabuff links for all previously played games with players in @param match_id
// @param match_id
function getMatchPreviouslyPlayedWith(match_id)
{
    const MATCH_PLAYER_IDS = getMatchPlayerIds(match_id);
    var matched_players_match_links = [];
    var baseObj = { "matched_players": matched_players_match_links };

    for (let index = 0; index < MATCH_PLAYER_IDS.length; index++)
    {
        const PLAYER_ID = MATCH_PLAYER_IDS[index];
        if (PLAYER_ID != MY_ID && !WHITELISTED_IDS.includes(PLAYER_ID))
        {
            const PREVIOUS_MATCHES = getMatchesPlayedWithId(PLAYER_ID);
            if (PREVIOUS_MATCHES != null)
            {
                const DOTABUFF_LINKS_ARR = generateDotabuffLinks(PREVIOUS_MATCHES);
                var playerObj = { "player_id": PLAYER_ID, "matches": DOTABUFF_LINKS_ARR};
                matched_players_match_links.push(playerObj);
            }
        }
    }
    return baseObj;
}

console.log(getMatchPreviouslyPlayedWith(5898552202));



//console.log(generateDotabuffLinks(getMatchesPlayedWithId(116768986)));