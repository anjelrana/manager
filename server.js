const express = require("express");

const app = express();


app.all("/", (req, res)=> {
 res.send("Bot is running");
})

function stayOn() {
  app.listen(3000, () => {
    console.log("The server is running at port 3000")
  })
}

module.exports = stayOn;