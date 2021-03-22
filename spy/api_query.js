var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

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

// exposed functions
module.exports = {
    queryMatch: queryMatch,
    queryPlayedMatches: queryPlayedMatches
};