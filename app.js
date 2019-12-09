var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    flash           = require("connect-flash")  

app.use(express.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}))
app.use(flash())
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
app.set("view engine", "ejs")
var analyst=""
var approver=""
var strikeAnalyst       = ""
var italicsApprover     = ""
var sentencesAnalyst = []
var sentencesApprover = []
// var senAnLen = 0;
// var senAnLen = []

//Passport Configuration
app.use(require("express-session")({
   secret: "hello think",
   resave: false,
   saveUninitialized: false
}));

app.use(function(req, res, next){
    res.locals.error=req.flash("error")
    next();
})

app.get("/", function(req, res){
    res.render("landing")
})

app.get("/preprocess", function(req, res){
    res.render("preprocess")
})

app.post("/preprocess", function(req, res){
    analyst = req.body.analyst 
    approver = req.body.approver
    var preprocessedAnalyst = analyst.trim()
    preprocessedAnalyst = preprocessedAnalyst.replace(/ +/g, " ")
    var preprocessedApprover = approver.trim();
    preprocessedApprover = preprocessedApprover.replace(/ +/g, " ")
    sentencesAnalyst = preprocessedAnalyst.split(".");
    analyst=""
    approver=""
    //Adding sentence rank to both abstracts
    for (var i=0; i<sentencesAnalyst.length-1;i++){
        if (i==0){
            sentencesAnalyst[i] = "["+i+"]  " + sentencesAnalyst[i] + ". "
            analyst += sentencesAnalyst[i]
        } else if (i == sentencesAnalyst.length-2) {
            sentencesAnalyst[i] = "["+i+"]" + sentencesAnalyst[i] + "."
            analyst += sentencesAnalyst[i]
        } else {
            sentencesAnalyst[i] = "["+i+"]" + sentencesAnalyst[i] + ". "
            analyst += sentencesAnalyst[i]
        }
    }
    sentencesApprover = preprocessedApprover.split(".");
    for (var i=0; i<sentencesApprover.length-1;i++){
        if (i==0){
            sentencesApprover[i] = "["+i+"] " + sentencesApprover[i] + ". "
            approver += sentencesApprover[i]
        } else if (i == sentencesApprover.length-2) {
            sentencesApprover[i] = "["+i+"]" + sentencesApprover[i] + "."
            approver += sentencesApprover[i]
        } else {
            sentencesApprover[i] = "["+i+"]" + sentencesApprover[i] + ". "
            approver += sentencesApprover[i]
        }
    }
    res.redirect("/compare") 
});


app.get("/compare", function(req, res){
    var rankedSentences = {analyst: analyst, approver: approver}
    res.render("compare", {rankedSentences: rankedSentences}) 
});

const rankingFailure = ({location, msg, param, value, nestedErrors}) => {
    return {
        type: "Error",
        name: "Ranking Failure",
        location: location,
        message: msg,
        param: param,
        value: value,
        nestedErrors: nestedErrors
    }
};

app.post('/compare', [
  // username must be an emai
    check('deletedSentenceRank').custom(deletedSentenceRank => {
        //The following if statement is for case 4
        if (deletedSentenceRank === "") {
            return true
        }
        var senAnLength = sentencesAnalyst.length-1
        var senAnLen = Array.from(Array(senAnLength).keys()).map(String)
        deletedSentenceRank = deletedSentenceRank.split(",")
        deletedSentenceRank.sort(function(a, b){return b-a});
        for (var i=0; i < deletedSentenceRank.length ; i++){
            if (!senAnLen.includes(deletedSentenceRank[i])) {
                return false
            } else {
                return true
            }
        } 
    }),
    check('addedSentenceRank').custom(addedSentenceRank => {
        //The following if statement is for case 4
        if (addedSentenceRank === "") {
            return true
        }
        var senAppLength = sentencesApprover.length-1
        var senAppLength = Array.from(Array(senAppLength).keys()).map(String)
        addedSentenceRank = addedSentenceRank.split(",")
        addedSentenceRank.sort(function(a, b){return b-a});
        for (var i=0; i < addedSentenceRank.length ; i++){
            if (!senAppLength.includes(addedSentenceRank[i])) {
                return false
            } else {
                return true
            }
        } 
    }),
], (req, res) => {
    const errors = validationResult(req).formatWith(rankingFailure);
    // // // console.log(errors.array.length)
    if (!errors.isEmpty()) {
        // return res.status(422).json({ errors: errors.array() });
        req.flash("error", "Pleas check if: i- number exists in rank ii- numbers separated by comma")
        res.redirect("/compare")
    } else {
        //Getting input data
        var rankedAnalyst       = req.body.rankedAnalyst
        rankedAnalyst           = rankedAnalyst.split(".")
        var rankedApprover      = req.body.rankedApprover
        rankedApprover          = rankedApprover.split(".")
        //Rank of added or deleted sentence
        var deletedSentenceRank = req.body.deletedSentenceRank 
        deletedSentenceRank     = deletedSentenceRank.split(",")
        // console.log("I am here ", deletedSentenceRank)
        // console.log("I am here ", deletedSentenceRank.length)
        var addedSentenceRank   = req.body.addedSentenceRank
        addedSentenceRank       = addedSentenceRank.split(",")
        console.log(deletedSentenceRank)
        console.log(addedSentenceRank)
        strikeAnalyst       = ""
        italicsApprover     = ""
        //Case #1: sentences were completely ommitted from analyst's abstract
        if (deletedSentenceRank[0]!=="" && addedSentenceRank[0]==="") {
            console.log("I am in Case 1")
            //Generating new analyst abstract
            for (var i=0; i<rankedAnalyst.length-1; i++) {
                //check if i exists in deleted sentences array
                if (deletedSentenceRank.includes(i.toString())) {
                    var s       = rankedAnalyst[i]
                    s           = s.slice(4)+"."
                    //enter sentence but with strikethrough to reflect the deletion
                    strikeAnalyst += s.strike()
                }   else {
                    strikeAnalyst += rankedAnalyst[i].slice(4)+"."
                }
            }
            // Initating counter for approver -- assumption here is analyst has fewer abstracts
            var fewCounter=0;
            //Compare rest of sentences
            for (var i=0; i < rankedAnalyst.length; i++) {
                if (deletedSentenceRank.includes(i.toString())){
                    //nothing here
                } else {
                    rankedApprover[fewCounter] = rankedApprover[fewCounter].slice(4)
                    //Consdering case where first companrison happens when analyst 1st sentenced is deleted -- white space occurs in output
                    if ((fewCounter==0 && i !==0) || (fewCounter===0 && i ===0)) {
                        rankedAnalyst[i] = rankedAnalyst[i].slice(5)
                    } else{
                        rankedAnalyst[i] = rankedAnalyst[i].slice(4)
                    } 
                    //Comparing character  for character 
                    for (var k=0; k< rankedApprover[fewCounter].length; k++) {
                        if (rankedApprover[fewCounter][k] ===  rankedAnalyst[i][k]) {
                            italicsApprover += rankedApprover[fewCounter][k];
                        } else  {
                            italicsApprover += rankedApprover[fewCounter][k].italics();
                        }
                        if (k==rankedApprover[fewCounter].length-1) {
                            italicsApprover += "."
                        }
                    }
                    fewCounter ++
                }
            }
        //Case #2: Sentences deleted from analyst. Sentences added to approver
        }   else if (deletedSentenceRank[0]==="" && addedSentenceRank[0]!=="") {
                console.log("I am in Case 2")
                for (var i=0; i<rankedAnalyst.length-1; i++) {
                //check if i exists in deleted sentences array
                    if (i===0) {
                        var s       = rankedAnalyst[i]
                        s           = s.slice(5)+"."
                        //enter sentence but with strikethrough to reflect the deletion
                        strikeAnalyst += s
                    }   else {
                        strikeAnalyst += rankedAnalyst[i].slice(4)+"."
                    }
                }
                //Generating new approver abstract that shows differences
                var counter = 0;
                for (var i=0; i < rankedApprover.length; i++) {
                    if (addedSentenceRank.includes(i.toString())){
                        var s= rankedApprover[i]
                        s = s.slice(4)+"."
                        s=s.italics()
                        italicsApprover += s;
                    } else {
                        rankedApprover[i] = rankedApprover[i].slice(4)
                        if (counter===0) {
                            rankedAnalyst[counter] = rankedAnalyst[counter].slice(5)
                        } else {
                            rankedAnalyst[counter] = rankedAnalyst[counter].slice(4)
                        }
                        for (var k=0; k< rankedApprover[i].length; k++) {
                            if (rankedApprover[i][k] ===  rankedAnalyst[counter][k]) {
                                italicsApprover += rankedApprover[i][k];
                            } else  {
                                italicsApprover += rankedApprover[i][k].italics();
                            }
                            if (k==rankedApprover[i].length-1) {
                               italicsApprover += "."
                            }
                        }
                    counter ++
                    }
                }
        //Case 3 Sentences deleted from analyst. Sentences added to approver
        }   else if (deletedSentenceRank[0]!=="" && addedSentenceRank[0]!=="") {
                console.log("I am in Case 3")
                for (var i=0; i<rankedAnalyst.length-1; i++) {
                    //check if i exists in delSenArray
                    if (deletedSentenceRank.includes(i.toString())) {
                        // console.log(sentencesAnalyst[i])
                        var s =rankedAnalyst[i]
                        s=s.slice(4)+"."
                        //enter sentence but with strikethrough to reflect the deletion
                        strikeAnalyst += s.strike()
                    }   else {
                        // console.log(sentencesAnalyst[i])
                        strikeAnalyst += rankedAnalyst[i].slice(4)+"."
                    }
                }
                //comparing the sentences
                var approverCounter = 0
                var analystCounter  = 0
                var len = Math.max(rankedApprover.length, rankedAnalyst.length)
                for (var i=0; i < len; i++) {    
                    console.log("i is: ", i)
                    if (deletedSentenceRank.includes(analystCounter.toString()) && !addedSentenceRank.includes(approverCounter.toString())){
                        // console.log("i is: ", i)
                        console.log("here in loop 1: analystCounter: ", analystCounter)
                        console.log("here in loop 1: approverCounter: ", approverCounter)
                        analystCounter++
                    } else if (addedSentenceRank.includes(approverCounter.toString()) && !deletedSentenceRank.includes(analystCounter.toString())) { 
                        var s= rankedApprover[approverCounter]
                        s = s.slice(4)+"."
                        s=s.italics()
                        italicsApprover += s;
                        // console.log("i is: ", i)
                        console.log("here in loop 2: analystCounter: ", analystCounter)
                        console.log("here in loop 2: approverCounter: ", approverCounter)
                        approverCounter++
                    } else if (deletedSentenceRank.includes(analystCounter.toString()) && addedSentenceRank.includes(approverCounter.toString())) {
                        var s= rankedApprover[approverCounter]
                        s = s.slice(4)+"."
                        s=s.italics()
                        italicsApprover += s;
                        // console.log("i is: ", i)
                        console.log("here in loop 3: analystCounter: ", analystCounter)
                        console.log("here in loop 3:approverCounter: ", approverCounter)
                        approverCounter++
                        analystCounter++
                    } else {
                        //Consdering case where first companrison happens when analyst 1st sentenced is deleted -- white space occurs in output
                        if (analystCounter!=0 && approverCounter==0) {
                            console.log("I am here")
                            rankedAnalyst[analystCounter] = rankedAnalyst[analystCounter].slice(5)
                        } else{
                            console.log("NOT here")
                            rankedAnalyst[analystCounter] = rankedAnalyst[analystCounter].slice(4)
                        } 
        
                        rankedApprover[approverCounter] = rankedApprover[approverCounter].slice(4)
        
                        console.log("Comparing analystCounter ", analystCounter)
                        console.log("Comparing approverCounter: ", approverCounter)
                        for (var k=0; k< rankedApprover[approverCounter].length; k++) {
                            if (rankedApprover[approverCounter][k] ===  rankedAnalyst[analystCounter][k]) {
                                italicsApprover += rankedApprover[approverCounter][k];
                            } else  {
                                italicsApprover += rankedApprover[approverCounter][k].italics();
                            }
                            if (k==rankedApprover[approverCounter].length-1) {
                                italicsApprover += "."
                            }
                        }
                        // console.log("i is: ", i)
                        analystCounter++
                        approverCounter++
                    }
                }
        //Case 4 - nothing is added or deleted
        }   else if (deletedSentenceRank[0]==="" && addedSentenceRank[0]==="") {
                console.log("I am in case 4")
                for (var i=0; i<rankedApprover.length; i++) {
                    rankedApprover[i]=rankedApprover[i].slice(4)
                    if (i==0) {
                        rankedAnalyst[i] = rankedAnalyst[i].slice(5)
                    } else{
                        rankedAnalyst[i] = rankedAnalyst[i].slice(4)
                    } 
                    strikeAnalyst += rankedAnalyst[i]
                    for (var k=0; k< rankedApprover[i].length; k++) {
                        if (rankedApprover[i][k] ===  rankedAnalyst[i][k]) {
                            italicsApprover += rankedApprover[i][k];
                        } else  {
                            italicsApprover += rankedApprover[i][k].italics();
                        }
                        if (k==rankedApprover[i].length-1) {
                            italicsApprover += "."
                            strikeAnalyst += "."
                        }
                    }
                }
            }  
            res.redirect("/paint")
        }
    });

app.get("/paint", function(req, res) {
    var editedSentences = {strikeAnalyst: strikeAnalyst, italicsApprover: italicsApprover}
    res.render("paint", {editedSentences: editedSentences})
})

app.listen(3000, function() { 
    console.log('Server listening on port 3000'); 
  });
