var moneyList = [0.01,1,5,10,25,50,75,100,200,300,400,500,750,1000,5000,10000,25000,50000,75000,100000,200000,300000,400000,500000,750000,1000000];

var numCasesOpenedPerRound = {
    1: 6,
    2: 5,
    3: 4,
    4: 3,
    5: 2,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
};

var bankersOfferMeanSD = {
    1: [22.485, 8.385],
    2: [33.685, 11.232],
    3: [44.87, 8.74],
    4: [52.46, 13.5],
    5: [63.745, 14.002],
    6: [72.75, 12.719],
    7: [74.98, 17.622],
    8: [80.92, 17.26],
    9: [78.88, 15.321],
};

var moneyValuesRemaining;
var totalCasesOpened;
var totalCases;
var remainingMoney;
var round;
var casesOpenedThisRound;
var hasPlayerSelectedCase;
var hasSelectedFinalCase;
var offer;
var counterOffer;
var winnings;
var gameState;
var myCase;
var selectedCase;

var data = {};

initialize();

function initialize() {
    localStorage.removeItem("winnings");

    createMoneyTable();
    assignVariables();
    assignCaseAmounts();
    createDealButtons();
    selectPlayersCase();
}

function reset() {
    window.location = window.location.href;
}

/* Game setup. Creates the Money Table, Assigns the Case Values, Resets Global Variables and Creates the DEAL and NO DEAL buttons */

function createMoneyTable() {
    for (var i = 0; i < 13; i++) {
        var rowEl = $("<div>").addClass("row");

        var divOne = $("<div>").text("$" + formatNumber(moneyList[i])).addClass("col").attr({ "data-inplay": "yes", "value": moneyList[i] });
        var divTwo = $("<div>").text("$" + formatNumber(moneyList[i + 13])).addClass("col").attr({ "data-inplay": "yes", "value": moneyList[i + 13] });
    
        rowEl.append(divOne, divTwo);
        $("#money-table").append(rowEl);
    }
}

function assignVariables() {
    moneyValuesRemaining = moneyList.slice();
    totalCasesOpened = 0;
    totalCases = moneyList.length;
    remainingMoney = calcTotalMoneyAmount();
    round = 0;
    casesOpenedThisRound = 0;
    hasPlayerSelectedCase = false;
    hasSelectedFinalCase = false;
    offer = undefined;
    counterOffer = undefined;
    winnings = undefined;
    gameState = 0;
    myCase = undefined;
    selectedCase = undefined;
}

function assignCaseAmounts() {
    var values = moneyList.slice();
    for (var i = 26; i >= 1; i--) {
        var randNum = Math.floor(Math.random() * values.length);
        var caseValue = values[randNum];

        $("#case-" + i).val(caseValue);

        values.splice(values.indexOf(caseValue), 1);
    }
}

function createDealButtons() {
    var dealEl = $("<button>")
        .attr({ id: "deal-btn", "data-offer": "no" })
        .text("DEAL");
    var noDealEl = $("<button>")
        .attr({ id: "no-deal-btn", "data-offer": "no" })
        .text("NO DEAL");
    $("#bankerInfo").append(dealEl, noDealEl);
    console.log("buttons created")
}


/* Code for the Actual Game */

function selectPlayersCase() {
    displayInstructions();
    $(".case").click(function () {
        if (!hasPlayerSelectedCase) {
        myCase = $(this);
        displayMyCase(myCase);
        displayInfo();
        hasPlayerSelectedCase = true;
        gameState = 1;
        newRound();
        }
    });
}

function displayMyCase(el) {
    $("#your-case").addClass("chosen-case").text($(el).text()).val($(el).val());
    $(el).removeClass("not-clicked").addClass("players-case");
}

function openCase(thisRound) {
    displayInstructions();
    $(".case").click("not-clicked", function () {
        if (
        casesOpenedThisRound < numCasesOpenedPerRound[round] &&
        thisRound === round
        ) {
            selectedCase = $(this);
            removeSelectedCase(selectedCase);
            displayInfo();
            if (casesOpenedThisRound === numCasesOpenedPerRound[round]) {
                playersOffer();
                //save to data by making a deep copy
                var deepCopy = JSON.parse(JSON.stringify(moneyValuesRemaining));
                data[round] = deepCopy;
            }
            else displayInstructions();
        }
    });
}

function removeSelectedCase(el) {
    totalCasesOpened++;
    casesOpenedThisRound++;
    var amount = parseFloat($(el).val());
    remainingMoney -= amount;
    moneyValuesRemaining.splice(moneyValuesRemaining.indexOf(amount), 1);
    $(el).removeClass("not-clicked").addClass("selected-case");
    strikeOutTable(amount);
    updateStatsTable();
}

function playersOffer() {
    gameState = 2;

    var mean = bankersOfferMeanSD[round][0];
    var sd = bankersOfferMeanSD[round][1];

    var pvalue = Math.random() * 0.95 - 0.475;
    var z = percentile_z(pvalue);
    var ex = calcExpectedValue();
    var pi = z * sd + mean;

    
    var cv = sd / ex;
    var log10ev = Math.log10(ex);
    //log10bo = 0.195 + 0.991*log10ev - 0.057*cv - 0.037*len(prizes_left)
    
    console.log("remaining prizes: " + (totalCases-totalCasesOpened+1));
    var log10bo = 0.195 + 0.991*log10ev - 0.057*cv - 0.037*(totalCases-totalCasesOpened+1)
    bo = Math.pow(10, log10bo);

    offer = Math.round(bo);
    data["bo" + round] = offer;

    offerDeal(round);
}

function offerDeal(thisRound) {
    displayOffer(offer);
    displayInstructions();
    displayInfo();
    $("#bankerInfo").show();
    console.log("bankerinfo displayed")
    $("#deal-btn").attr("data-offer", "yes");
    $("#no-deal-btn").attr("data-offer", "yes");

    $("#deal-btn").click(function () {
        if (thisRound === round) {
            $("#deal-btn").attr("data-offer", "no");
            $("#no-deal-btn").attr("data-offer", "no");

            removeOffer();
            gameState = 11;
            winnings = offer;
            if (localStorage.getItem("first_mode") === "b") { // playing this first
                localStorage.setItem("first_winnings", winnings);
            }
            else {
                localStorage.setItem("")
            }
            localStorage.setItem("winnings", winnings);
            $(".save-winnings").css("display", "block");
            save_game("D");
            
        }
    });

    $("#no-deal-btn").click(function () {
        if (thisRound === round) {
            $("#deal-btn").attr("data-offer", "no");
            $("#no-deal-btn").attr("data-offer", "no");

            removeOffer();
            removeInfo();
            newRound();
            var infoEl = $("#infoDisplayed");
            infoEl.html("You chose No Deal.");
        }
    });

}



function selectFinalCase(thisRound) {
    displayInstructions();
    $(".case").click(function () {
        if (thisRound === round && !(hasSelectedFinalCase)) {
            hasSelectedFinalCase = true;
            selectedCase = $(this);
            winnings = parseFloat(selectedCase.val());
            console.log("executing js line 243")
            save_game("ND");
            $(".save-winnings").css("display", "block");
        }
    });
}

function newRound() {
    round++;
    casesOpenedThisRound = 0;
    if (round <= 9) {
        gameState = 1;
        openCase(round);
    } else {
        gameState = 10;
        selectFinalCase(round);
    }
}

/* Event Listener for the More Stats Button */
$("#stats-btn").click(function () {
    if ($("#stats-table-values").css("display") === "none")
        $("#stats-table-values").css("display", "block");
    else $("#stats-table-values").css("display", "none");
});

/*Updates the Stats Table */
function updateStatsTable() {
    var ex = calcExpectedValue();
    var ex2 = calcEX2();
    $("#expected-value").text("Expected Value: $" + formatNumber(Math.round(ex)));
    $("#standard-deviation").text(
        "Standard Deviation: $" +
        formatNumber(Math.round(calcStandardDeviation(ex, ex2)))
    );
    $("#median").text(
        "Median: $" + formatNumber(calcMedian(moneyValuesRemaining))
    );
    $("#first-quartile").text(
        "First Quartile: $" + formatNumber(calc25thPercentile(moneyValuesRemaining))
    );
    $("#third-quartile").text(
        "Third Quartile: $" + formatNumber(calc75thPercentile(moneyValuesRemaining))
    );
}

/* Formatting Functions and Displaying Instructions and Info for the User */

function displayOffer(offer) {
    var offerEl = $("<div>")
        .attr("id", "bankers-offer")
        .text("$" + formatNumber(offer));
    $("#deal-btn").before(offerEl);
    var ratio = offer / calcExpectedValue();
    percentDiv = $("<div>")
        .attr("data-offer-rank", evaluateOffer(ratio))
        .text(Math.round(ratio * 100) + "%");
    $(".stats").append(percentDiv);
}

function removeOffer() {
    $("#bankers-offer").remove();
    $(".stats").empty().text("Percent of Expected");
}

function displayInstructions() {
    var instructEl = $("#instructionsDisplayed");
    var roundHeader = $("#round-header"); // New line to get the round header element
  
    switch (gameState) {
      case 0:
        instructEl.text("Select your case");
        break;
      case 1:
        if (numCasesOpenedPerRound[round] - casesOpenedThisRound > 1)
          instructEl.text(
            "Open " + (numCasesOpenedPerRound[round] - casesOpenedThisRound) + " cases."
          );
        else
          instructEl.text(
            "Open " + (numCasesOpenedPerRound[round] - casesOpenedThisRound) + " case."
          );
        break;
      case 2:
        instructEl.text("Deal or No Deal?");
        break;
      case 10:
        instructEl.text("Select your Final Case to take Home");
        break;
    }
  
    // Update the round header with the current round number
    roundHeader.text("Round " + round);
}
  
function removeInfo() {
    var infoEl = $("#infoDisplayed");
    infoEl.html("");
}

function displayInfo(game_id) {

    var infoEl = $("#infoDisplayed");
    switch (gameState) {
        case 0:
            infoEl.text("You chose Case " + myCase.text());
            break;
        case 1:
            infoEl.html("You opened Case " + selectedCase.text() + "<br>Value: $" + formatNumber(selectedCase.val()));
            break;
        case 10:
            infoEl.html("Your Final Case is Case " + selectedCase.text() + "<br>Winnings: $" + formatNumber(selectedCase.val())  + "<br>Game ID: " + game_id);
            break;
        case 11:
            infoEl.html("You accepted the banker's offer.<br>Winnings: $" + formatNumber(winnings) + "<br>Game ID: " + game_id);
    }
}

function noDealInfo() {
    var infoEl = $("#infoDisplayed");
    infoEl.html("You declined the offer.");
}

function strikeOutTable(amount) {
    $("div [value='" + amount + "']").attr("data-inplay", "no");
}

function formatNumber(num) {
    if (num > 1) return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return num;
}

/* Calculations used in various functions */

function calcExpectedValue() {
    return remainingMoney / (totalCases - totalCasesOpened);
}

function calcEX2() {
    var x2 = 0;
    for (var i = 0; i < moneyValuesRemaining.length; i++)
        x2 += Math.pow(moneyValuesRemaining[i], 2);
    var ex2 = x2 / moneyValuesRemaining.length;
    return ex2;
}

function calcStandardDeviation(ex, ex2) {
    return Math.sqrt(ex2 - Math.pow(ex, 2));
}

function calcMedian(list) {
    var listLength = list.length;
    if (listLength % 2 == 1) return list[Math.floor(listLength / 2)];
    else return (list[listLength / 2] + list[listLength / 2 - 1]) / 2;
}

function calc25thPercentile(list) {
    var listLength = list.length;
    var index = Math.floor((listLength + 1) / 4) - 1;
    var weight = ((listLength + 1) % 4) / 4;
    return list[index] * (1 - weight) + list[index + 1] * weight;
}

function calc75thPercentile(list) {
    var listLength = list.length;
  var index = Math.floor(((listLength + 1) * 3) / 4) - 1;
  var weight = (((listLength + 1) * 3) % 4) / 4;
  return list[index] * (1 - weight) + list[index + 1] * weight;
}

function percentOfExpected(value) {
  return Math.round((value / calcExpectedValue()) * 100);
}

function evaluateOffer(ratio) {
    if (ratio < 0.3) return "awful";
    if (ratio < 0.5) return "poor";
    if (ratio < 0.6) return "bad";
    if (ratio < 0.7) return "mediocre";
    if (ratio < 0.8) return "fair";
    if (ratio < 0.9) return "good";
    if (ratio < 1) return "great";
    else return "excellent";
}

function calcTotalMoneyAmount() {
    var amount = 0;
    for (var i = 0; i < moneyList.length; i++) amount += moneyList[i];
    return amount;
}

function percentile_z(p) {
    var a0 = 2.5066282,
    a1 = -18.6150006,
    a2 = 41.3911977,
    a3 = -25.4410605,
    b1 = -8.4735109,
    b2 = 23.0833674,
    b3 = -21.062241,
    b4 = 3.1308291,
    c0 = -2.7871893,
    c1 = -2.2979648,
    c2 = 4.8501413,
    c3 = 2.3212128,
    d1 = 3.5438892,
    d2 = 1.6370678,
    r,
    z;

    if (p > 0.42) {
        r = Math.sqrt(-Math.log(0.5 - p));
        z = (((c3 * r + c2) * r + c1) * r + c0) / ((d2 * r + d1) * r + 1);
    } else {
        r = p * p;
        z =
        (p * (((a3 * r + a2) * r + a1) * r + a0)) /
        ((((b4 * r + b3) * r + b2) * r + b1) * r + 1);
    }
    return z;
}

// external request stuff


function save_game(result) {
    data["result"] = result;
    data["end_round"] = round;
    data["winnings"] = winnings;
    var needNewID = true;
    while (needNewID) { 
        var game_id = "G" + Math.floor(Math.random() * 90000 + 10000);
        if (needNewIDCheck(game_id) === 'true') { // need new id
            console.log("neednewid=true")
        }
        else { // neednewidcheck returned false
            console.log("neednewid=false")
            needNewID = false;
        }
    }
    data["game_id"] = game_id;
    displayInfo(game_id);
    if (localStorage.getItem("first_mode")==="b") {
        localStorage.setItem("first_game_id", game_id);
        data["first_game"] = true;
    }
    else {
        localStorage.setItem("second_game_id", game_id);
        data["first_game"] = false;
    }
    showContinueButton();
    save_ext(data);
}


function save_ext(data) {
    console.log("saving data:");
    console.log(data);
    fetch('https://aqueous-rarity-393504.ue.r.appspot.com/save_player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      // Process the response data (if needed)
      console.log(data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function needNewIDCheck(id) {  // TODO
    fetch('https://aqueous-rarity-393504.ue.r.appspot.com/check_ids', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(id),
    })
    .then((response) => response.json())
    .then((data) => {
    console.log(data['result']);
    })
    .catch((error) => {
    console.error('Error:', error);
    });
    return data['result']; // true or false string. TRUE IF USED BEFORE
}

function showContinueButton() {
    var continueBtn = document.getElementById("continue-btn");
    continueBtn.style.display = "block";
    continueBtn.addEventListener("click", function() {
      if (localStorage.getItem("first_mode") === "p") {
        window.location.href = "end.html";
      }
      else {
        window.location.href = "p-intro.html";
      }
    });
  }
