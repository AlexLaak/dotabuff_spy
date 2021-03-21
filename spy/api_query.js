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
    return JSON.parse(apiQuery(MATCH_URL));
}

// exposed functions
module.exports = {
    queryMatch: queryMatch
};