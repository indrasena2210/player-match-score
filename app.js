const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertingPlayerDetailsToCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertingMatchDetailsToCamelCase = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertingPlayerMatchScoreToCamelCase = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
     * 
    FROM 
     player_details;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertingPlayerDetailsToCamelCase(eachPlayer)
    )
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
     * 
    FROM 
     player_details 
    WHERE 
     player_id = ${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertingPlayerDetailsToCamelCase(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
     player_details
    SET 
     player_name = '${playerName}'
    WHERE 
     player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
     * 
    FROM 
     match_details 
    WHERE match_id = ${matchId};
    `;
  const match = await db.get(getMatchQuery);
  response.send(convertingMatchDetailsToCamelCase(match));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsQuery = `
    SELECT *
    FROM player_match_score NATURAL JOIN match_details
    WHERE player_id = ${playerId}`;
  const matchesArray = await db.all(getMatchDetailsQuery);
  response.send(
    matchesArray.map((eachMatch) =>
      convertingMatchDetailsToCamelCase(eachMatch)
    )
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetailsQuery = `
    SELECT 
     * 
    FROM 
     player_match_score
     NATURAL JOIN player_details 
    WHERE 
     match_id = ${matchId};
    `;
  const playersArray = await db.all(getPlayerDetailsQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertingPlayerDetailsToCamelCase(eachPlayer)
    )
  );
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT 
     player_id AS playerId,
     player_name AS playerName,
     SUM(score) AS totalScore,
     SUM(sixes) AS totalSixes,
     SUM(fours) AS totalFours
    FROM player_match_score 
      NATURAL JOIN player_details
    WHERE 
      player_id = ${playerId};
    `;
  const playerScores = await db.get(getPlayerScoresQuery);
  response.send(playerScores);
});

module.exports = app;
