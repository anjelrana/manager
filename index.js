//requiring the modules or libraries
const discord = require("discord.js");
const fetch = require("node-fetch");
const Database = require("@replit/database");


//creating 
const db = new Database()

const client = new discord.Client();
let APIKey = process.env.API;

const listOfPosition = [];

//league data
const LEAGUE = ["epl", "laliga", "serie A", "ligue 1", "bungesliga"];
const codeLeague = ["1204", "1399", "1269", "1221", "1229"];

function getStanding(league) {

  return getfetch(codeLeague[LEAGUE.indexOf(league)]).then(d => {
    return d;
  })
}
//databases
db.get("leagueSt").then(leagueSt => {
  if (!leagueSt) {
    db.set("leagueSt", false);
  }
})
db.get("createTeam").then(createTeam => {
  if (!createTeam) {
    db.set("createTeam", false);
  }
})

function getMatchToday(leagueName) {

  var dateOb = new Date();
  var date = dateOb.getDate();
  var month = dateOb.getMonth();
  month++;
  var year = dateOb.getFullYear();
  var lengthDate = date + "";;
  var lengthMonth = month + "";

  if (lengthDate.length === 1) {
    date = "0" + date
  }
  if (lengthMonth.length === 1) {
    month = "0" + month
  }

  dateString = `${date}.${month}.${year}`;
  leagueCode = codeLeague[LEAGUE.indexOf(leagueName)];

  return getfetch(leagueCode, dateString).then(d => d);

}


function getfetch(...data) {

  if (data.length === 1) {

    var leagueCode = data[0];
    var url = "https://data.football-api.com/v3/standings/" + leagueCode + "?Authorization=" + APIKey;


    return fetch(url).then(res => res.json()).then(data => {

      return data;
    }).catch(error => console.log(error.statusCode));
  }

  if (data.length === 2) {
    let codeLegue = data[0];//
    let dateLeague = data[1];


    let urlMatch = "https://data.football-api.com/v3/matches?comp_id=" + codeLeague + "&match_date=" + dateLeague + "&Authorization=" + APIKey;
    return fetch(urlMatch).then(res => res.json()).then(data => {
      return data;
    }).catch(error => {
      console.log(error.message, "error");
    })

  }


}




//events and listening
client.on("ready", () => {
  console.log(`Log in as ${client.user.tag}`)
})

client.on("message", msg => {
  if (msg.author.bot) {
    return;
  }

  if (msg.content == "ready") {
    msg.reply("you know what you are hard worker");
  }
  if (msg.content.startsWith("$league")) {
    msg.reply(LEAGUE);
    db.get("leagueSt").then(leagueSt => {
      if (leagueSt === false) {
        db.set("leagueSt", true);
        msg.reply("Now you can check standing");
      }
    })
  }
  // standing - api
  db.get("leagueSt").then(leagueSt => {
    if (leagueSt && LEAGUE.some(league => msg.content.includes(league)) && leagueSt) {

      getStanding(msg.content).then(standing => {
        let season = standing[0].season;
        msg.channel.send("Rank  Team       Points      Recent-form   ,season:" + season);
        let ranking = 0;
        standing.forEach(item => {
          msg.channel.send(` ${++ranking}    ${item.team_name}       ${item.points}      ${item.recent_form} `)
        })

        db.get("leagueSt").then(() => {
          db.set("leagueSt", false);
          msg.channel.send("Now league-standing command is off")
        })

      });

    }
  })

  //match day - api
  if (msg.content.startsWith("$match-day")) {

    var leagueName = msg.content.split("$match-day ")[1];
    getMatchToday(leagueName).then(data => {
      if (Array.isArray(data)) {
        data.forEach(item => {
          msg.channel.send(` ${item.localteam_name} ${item.ft_score} ${item.visitorteam_name} `)
        });
      } else {
        msg.channel.send(data.message);
      }
    });
    msg.reply("wait a second ..");

  }
  if (msg.content == "$command") {
    msg.reply(` command list :
  $league - to get the league names.

  league-name - to get standing in league - eg: EPL **must use $league to on it.

  $match-day league-name - to get the matches of  today and result.

  $create-team to initiate team creation. make sure to use the format.

  $finish-team to get the team.
  `)
  }

  // team making decision 
  if (msg.content == "$create-team") {
    msg.reply(`Please make sure you follow the rule 
     1- use abbreviation(to represent position) and assignment operator with no space to assign player, and use comma to separate.
     Eg :  def= Dhaka, Ashu, Vishal, Shivam, Kunal 

     2- In next line - to add more position - in next line add it after giving the first position 
     Eg ;  mid= Anjel, Amit, Harsh, Manav 
     in next line after giving out above
     for= Chirag, alhawat, ankit , others    
     
     3- Once done use command $finish-team`);

    db.set("createTeam", true);
    msg.reply("You can start");

  }
  db.get("createTeam").then(createTeam => {
    if (createTeam && msg.content.includes("=")) {
      var listArr = msg.content.split("=");
      var position = listArr[0];
      var member = listArr[1].split(",");

      member = member.map(item => item.trim());
      createObject(position, member);

    }
  })
  if (msg.content == "$finish-team") {
    var dataDistri = finishObject();

    msg.channel.send(`
    here is the TeamA vs TeamB :
    
    TeamA : ${dataDistri[2]}
    members : ${dataDistri[0]}
    
    TeamB : ${dataDistri[1]}
    members : ${dataDistri[3]}`);

    db.set("createTeam", false);
    msg.channel.send("no longer you can create teams");
  }

})
//function for creating the object ;
function createObject(position, member) {

  function newObj(position, member) {
    this.position = position;
    this.member = member;
  }

  var newOB = new newObj(position, member);

  listOfPosition.push(newOB);


}

function finishObject() {

  let teamA = [];
  let teamB = [];
  let metaA = [];
  let metaB = [];

  listOfPosition.forEach(item => {
    let n = item.member.length;
    var countA = 0;
    var countB = 0;
    for (var i = 0; i < n; i++) {
      var number = Math.floor(Math.random() * (n - i));
      if (teamA.length < teamB.length) {
        if (i % 2) {
          teamB.push(item.member[number]);
          item.member.splice(number, 1);
          countB++;

        } else {
          teamA.push(item.member[number]);
          item.member.splice(number, 1);
          countA++;
        }
      } else {
        if (i % 2) {
          teamA.push(item.member[number]);
          item.member.splice(number, 1);
          countA++;
        } else {
          teamB.push(item.member[number]);
          item.member.splice(number, 1);
          countB++;
        }
      }

    }
    metaA.push(item.position + " " + countA);
    metaB.push(item.position + " " + countB);
  })

  return [teamA, teamB, metaA, metaB];

}



client.login(process.env.TOKEN);