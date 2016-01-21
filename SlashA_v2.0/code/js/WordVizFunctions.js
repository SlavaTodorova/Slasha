/*
 Copyright (c) [2014] [Chinkina M]
 */


/**
 * Add smooth-level information for a given word object.
 * @param {type} object
 * @returns {Object} The word object
 */
function addSmoothes(object) {
    var name = object.name.substring(0, object.name.indexOf("_smooth"));
    var nameSmooth = name + "_smooth";

    // add a smooth level for each smooth there is in data variable
    var allKeys = Object.keys(data[0]);
    for (var j = 0; j < allKeys.length; j++) {
        if (allKeys[j].indexOf(nameSmooth) === 0) {
            var level = allKeys[j].substring(allKeys[j].indexOf("_smooth") + 1);
            object[level] = data.map(function (d) {
                return {date: d.date, count_percent: +d[allKeys[j]]};
            });
        }
    }

    return object;
}
;



/**
 * Add statistical information for a given word object.
 * @param {type} object
 * @returns {Object} The word object
 */
function addStatistics(object) {
    if (selectVal === "no_thanks") {
        return object;
    }

    var name = object.name.substring(0, object.name.indexOf("_smooth"));
    var nameHigh = name + "_high";
    var nameLow = name + "_low";
    var nameDiffHigh = name + "_diff_high";
    var nameDiffLow = name + "_diff_low";

    // add a smooth level for each smooth there is in data variable
    var allKeys = Object.keys(data[0]);
    for (var j = 0; j < allKeys.length; j++) {
        if (allKeys[j].indexOf(nameHigh) === 0) {
            var level = allKeys[j].substring(allKeys[j].indexOf("_high") + 1);
            object[level] = data.map(function (d) {
                return {date: d.date, count_percent: +d[allKeys[j]]};
            });
        }
        if (allKeys[j].indexOf(nameLow) === 0) {
            var level = allKeys[j].substring(allKeys[j].indexOf("_low") + 1);
            object[level] = data.map(function (d) {
                return {date: d.date, count_percent: +d[allKeys[j]]};
            });
        }
        if (allKeys[j].indexOf(nameDiffHigh) === 0) {
            var level = allKeys[j].substring(allKeys[j].indexOf("_diff_high") + 1);
            object[level] = data.map(function (d) {
                return {date: d.date, count_percent: +d[allKeys[j]]};
            });
        }
        if (allKeys[j].indexOf(nameDiffLow) === 0) {
            var level = allKeys[j].substring(allKeys[j].indexOf("_diff_low") + 1);
            object[level] = data.map(function (d) {
                return {date: d.date, count_percent: +d[allKeys[j]]};
            });
        }
    }

    return object;
}
;



/**
 * A function to get all methods of an object
 * @param {Object} object
 * @returns {Array}
 */
function getAllMethods(object) {
    return Object.getOwnPropertyNames(object);
}

/**
 * Return the date of the type "20 Mar 1845, Thursday"
 * @param {String} date
 * @returns {String}
 */
function printDate(date) {
    var units = date.toString().split(" ");
    switch (units[0]) {
        case 'Mon':
            units[0] = 'Monday';
            break;
        case 'Tue':
            units[0] = 'Tuesday';
            break;
        case 'Wed':
            units[0] = 'Wednesday';
            break;
        case 'Thu':
            units[0] = 'Thursday';
            break;
        case 'Fri':
            units[0] = 'Friday';
            break;
        case 'Sat':
            units[0] = 'Saturday';
            break;
        case 'Sun':
            units[0] = 'Sunday';
            break;
    }
    var output = " " + units[2] + " " + units[1] + " " + units[3] + ", " + units[0];
    return output;
}
;

/**
 * Takes the word of the form: you_smooth0, you_E_smooth15, you/NP_E_smooth45, you/_smooth182, etc.
 * Returns the word without its specified level of smoothing: you, you_E, you/NP_E, you/, etc.
 * @param {String} word
 * @returns {String}
 */
function formatName(word) {

    var outputName = "";
    if (word.indexOf("_") > -1) {
        outputName = word.substring(0, word.lastIndexOf("_"));
    } else {
        outputName = word;
    }

    //alert(outputName);

    return outputName;
}
;

/**
 * Takes a word (from formatName()) of the form: you, you_E, you/NP_E, you/lemma/NP_E, etc.
 * Returns the formatted word: you, you (by E), you / (by E), you /PP/, etc.
 * @param {String} word
 * @returns {String}
 */
function formatAgain(word) {

    // smoothObject.js - Query - QueryItem

    var outputWord = "";
    var current_author = "";

    // if the author is specified
    for (var k = 0; k < AUTHORS.length; k++) {
        if (word.indexOf("_" + AUTHORS[k]) > -1) {
            current_author = AUTHORS[k];
        }
    }
    if (current_author.length > 0) {
        outputWord = (word.substring(0, word.indexOf("_" + current_author)) + " (" + current_author + ")"); // you/lemma/np (E)
    } else {
        outputWord = word; // you/lemma/np
    }

    return outputWord;
}
;


function showAlert(alertName, msg) {
    var d = document.createElement("div");
    var alert = document.getElementById(alertName);
    if (alert.childElementCount !== 0) { // if alert is already displayed
        alert.innerHTML = "";
    }
    d = alert.appendChild(d);
    d.innerHTML = "<button type='button' class='close' data-dismiss='alert' onclick=hideAlert('" + alertName + "')>&times;</button>" + msg;
    alert.hidden = false;
}

/**
 * Hide the specified alert.
 * @param {type} alertName
 */
function hideAlert(alertName) {
    var alerts = document.getElementById(alertName);
    alerts.innerHTML = "";
    alerts.hidden = true;
}
;


function deleteAllAlerts() {
    document.getElementById("alertNoCorpus").hidden = true;
    document.getElementById("alertNoWords").hidden = true;
    document.getElementById("alertLessWords").hidden = true;
    document.getElementById("alertNotFound").hidden = true;
    document.getElementById("alertFiles").hidden = true;
    document.getElementById("alertOneDay").hidden = true;
    document.getElementById("alertProcessing").hidden = true;
    document.getElementById("alertOneLetter").hidden = true;
    document.getElementById("alertMissingData").hidden = true;
    document.getElementById("alertStatistics").hidden = true;

    document.getElementById("alertNoCorpus").innerHTML = "";
    document.getElementById("alertNoWords").innerHTML = "";
    document.getElementById("alertLessWords").innerHTML = "";
    document.getElementById("alertNotFound").innerHTML = "";
    document.getElementById("alertFiles").innerHTML = "";
    document.getElementById("alertOneDay").innerHTML = "";
    document.getElementById("alertProcessing").innerHTML = "";
    document.getElementById("alertOneLetter").innerHTML = "";
    document.getElementById("alertMissingData").innerHTML = "";
    document.getElementById("alertStatistics").innerHTML = "";
}


function hideTooltip() {
    toolTip.transition()
            .delay(50)
            .duration(500)
            .style("opacity", 0);

    tmpLine.transition()
            .duration(500)
            .style("opacity", 0);

    clicked = false;

}
;

/**
 * Method for returning the line of a removed word back to the graph area.
 * @param {type} word
 */
function showLine(word) {
    var el = document.getElementById(word);
    el.style.visibility = "visible"; // change the visibility of class="line"!
    var hideOrShow = document.getElementsByClassName("hideDots");
    // if the current state is 'dots shown'
    if ((hideOrShow[0].textContent).indexOf("hide") > 0) {
        var dots = (el.getElementsByClassName("dots"))[0].childNodes;
        for (var j = 0; j < dots.length; j++) {
            dots[j].style.visibility = "visible";
        }
    }

    var theWord = formatAgain(word);

    var toRemove = null;
    // delete the line from the removedLines list
    for (var i = 0; i < removedLines.children.length; i++) {
        if (removedLines.children[i].text === theWord) {
            toRemove = removedLines.children[i];
        }
    }
    if (toRemove !== null) {
        removedLines.removeChild(toRemove);
        if (_.contains(removedLinesArray, word)) {
            removedLinesArray = _.without(removedLinesArray, word);
        }
    }

    $('html, body').animate({
        scrollTop: $("#heading").offset().top
    }, 300);
}
;

/**
 * Returns the currently displayed words
 * @returns {Array}
 */
function findCurrentWords() {
    var currentWords = svg.selectAll(".word")[0]; // an array of all the words
    currentWords = _.filter(currentWords, function (d) {
        return d.style.visibility === 'visible';
    });
    return currentWords;
}
;

/**
 * Returns an array of selected words for the specified author/recepient 
 * @param {String} name : the name of the author/recepient
 * @returns {Array}
 */
function getTheWordsByName(name) {

    var selectedWords = [];
    var selectedWordsTotal = [];

    selectedWords[0] = document.getElementById("word1_" + name).value.trim();
    selectedWords[1] = document.getElementById("word2_" + name).value.trim();
    selectedWords[2] = document.getElementById("word3_" + name).value.trim();

    for (var i = 0; i < 3; i++) {
        if (selectedWords[i].trim() !== "") {

            if (selectedWords[i].indexOf("_") >= 0) {
                alert("Sorry, but it is not a valid query. Try again without the '_'(underscore) symbol.");
            }

            selectedWordsTotal.push(selectedWords[i].toLowerCase());
        }
    }

    if (selectedWordsTotal.length === 0) {
        return null;
    } else {
        return selectedWordsTotal;
    }
}
;

/**
 * Returns an array of all selected words consisting of arrays of words by individual authors
 * @returns {Array}
 */
function getTheWords() {
    var selectedWords = [];

    // store the selected words
    // and copy all arrays with input words into the array 'selectedWords'
    var selectedWordsAll = getTheWordsByName("all");
    selectedWords.push(selectedWordsAll);

    for (var i = 0; i < AUTHORS.length; i++) {
        var selectedWordsByName = getTheWordsByName(AUTHORS[i]);
        selectedWords.push(selectedWordsByName);
    }
    return selectedWords;
}
;

/**
 * Returns a one-dimensional array of all selected words with the author's tags
 * @returns {Array}
 */
function getAllWordsWithTags() {

    var selectedWords = [];

    // store the selected words
    // for the whole corpus:
    var selectedWordsAll = [];
    selectedWordsAll[0] = document.getElementById("word1_all").value.trim();
    selectedWordsAll[1] = document.getElementById("word2_all").value.trim();
    selectedWordsAll[2] = document.getElementById("word3_all").value.trim();
    for (var i = 0; i < 3; i++) {
        if (selectedWordsAll[i].trim() !== "") {
            selectedWords.push(selectedWordsAll[i].toLowerCase());
        }
    }
    // for each author:
    for (var k = 0; k < AUTHORS.length; k++) {
        var selectedWordsByName = [];

        selectedWordsByName[0] = document.getElementById("word1_" + AUTHORS[k]).value.trim();
        selectedWordsByName[1] = document.getElementById("word2_" + AUTHORS[k]).value.trim();
        selectedWordsByName[2] = document.getElementById("word3_" + AUTHORS[k]).value.trim();

        for (var i = 0; i < 3; i++) {
            if (selectedWordsByName[i].trim() !== "") {
                selectedWords.push(selectedWordsByName[i].toLowerCase() + "_" + AUTHORS[k]);
            }
        }
    }
    return selectedWords;
}
;

/**
 * Removes the 3 words typed into the input fields for a specified author 
 * @param {String} name : "e", "r" or "all"
 */
function clearSelectedWords(name) {
    var w1 = document.getElementById("word1_" + name);
    var w2 = document.getElementById("word2_" + name);
    var w3 = document.getElementById("word3_" + name);
    w1.value = "";
    w2.value = "";
    w3.value = "";

}
;

/**
 * Divides the letter into paragpraphs
 * @param {String} aLetter, ngram, col
 * @returns {String}
 */
function formatLetter(aLetter, ngram, col) {

    var textOfLetter = aLetter.text;
    var allHighlights = aLetter.highlights;
    var tokensToHighlight = null;

    if (textOfLetter === null) {
        return "Sorry, no access the original data. <br/><br/> Make sure you the text (not only separate tokens) is provided in the corpus.";
    }

    // if there are no occurrences
    if (allHighlights.length == 0) {
        return textOfLetter;
    }


    for (var k = 0; k < allHighlights.length; k++) {
        var hit = formatAgain(formatName(allHighlights[k].hit));
        var toMatch = ngram;
        if (toMatch.indexOf(" (") > 0) {
            toMatch = toMatch.substring(0, toMatch.indexOf(" ("));
        }

        if (hit.toString().trim() === toMatch.toString().trim()) {
            tokensToHighlight = allHighlights[k]["indices"];
        }
    }

    var toHighlight = [];

    if (tokensToHighlight === null) {
        return "Cannot access the original data.";
    }
    else {
        // manage the highlights - merge when they overlap ("/jj /jj" query for 4 adj in a row)

        var curSt = -1;
        var curEnd = -1;
        var prevSt = -1;
        var prevEnd = -1;

        for (var y = 0; y < tokensToHighlight.length; y++) {
            curSt = tokensToHighlight[y][0];
            curEnd = tokensToHighlight[y][1];

            var st = -1;
            var end = -1;

            if ((curSt <= prevEnd) && (curEnd >= prevEnd)) {
                st = prevSt;
                end = curEnd;
                // update the last highlight
                var lastHighlight = toHighlight.pop();
                lastHighlight[1] = curEnd;
                toHighlight.push(lastHighlight);
            } else if ((curSt <= prevEnd) && (curEnd <= prevEnd)) {
                st = prevSt;
                end = prevEnd;
                // update the last highlight
                var lastHighlight = toHighlight.pop();
                lastHighlight[1] = prevEnd;
                toHighlight.push(lastHighlight);
            } else {
                st = curSt;
                end = curEnd;
                // add a new highlight
                toHighlight.push([st, end]);
            }

            prevSt = st;
            prevEnd = end;
        }
    }

    var outputText = "";

    var insertLength = 0;
    var startSpan = "<span style='color:";
    var endSpan = "; text-decoration: underline'><strong>";
    var closeTags = "</strong></span>";

    var start;
    var end;

    for (var j = 0; j < toHighlight.length; j++) {
        // calculate the start index of the ngram
        start = insertLength + aLetter.indices[toHighlight[j][0]][0];
        // calculate the end index of the ngram
        end = insertLength + aLetter.indices[toHighlight[j][1]][1] + 1;

        outputText = textOfLetter.substring(0, start);
        // change color notation (rgb or #)
        outputText += startSpan + col + endSpan;
        outputText += textOfLetter.substring(start, end);
        outputText += closeTags;
        outputText += textOfLetter.substring(end, textOfLetter.length);

        insertLength += startSpan.length + col.length + endSpan.length + closeTags.length;

        textOfLetter = outputText;
    }

    return textOfLetter;
}
;

function showContext(ngram, date, color) {

    var wholeCorpus = false;
    var nameOfAuthor = "";

    // if we look for authors
    if (ngram.indexOf("(") > 0) {
        nameOfAuthor = ngram.split("(")[1];
        nameOfAuthor = nameOfAuthor.substring(0, nameOfAuthor.length - 1); // E or R - ")"
    }
    //if we look in the whole corpus
    else {
        wholeCorpus = true;
    }


    var dayObject = null;

    var dateTokens = date.toString().split(" ");

    // modify the date string 
    var dateToString = "";
    for (var i = 0; i < 4; i++) {
        dateToString += dateTokens[i] + " ";
    }

    // compare the dates
    for (var i = 0; i < DATA_BY_DATE.length; i++) {

        var dataByDateTokens = DATA_BY_DATE[i].date.toString().split(" ");
        var dataByDateToString = "";
        for (var j = 0; j < 4; j++) {
            dataByDateToString += dataByDateTokens[j] + " ";
        }

        if (dateToString === dataByDateToString) {
            dayObject = DATA_BY_DATE[i];
            break;
        }
    }


    if (dayObject !== null) {

        var allLetters;
        var aName = dayObject["authors"][0];

        if ((!wholeCorpus) && _.contains(AUTHORS, nameOfAuthor)) {

            var authorIndex = AUTHORS.indexOf(nameOfAuthor);

            var authors = dayObject["authors"];

            if (authors !== null) {
                aName = authors[authorIndex];
                allLetters = aName.letters;
            }
        }
        // for the whole corpus
        else if (wholeCorpus) {

            allLetters = dayObject["letters"];

        } else {
            alert("Unknown author.");
        }

        if (allLetters !== null) {

            var withOcc = _.filter(allLetters, function (d, i) {
                for (var j = 0; j < d.highlights.length; j++) {
                    var hit = formatAgain(formatName(d.highlights[j].hit));
                    var toMatch = ngram;
                    if (toMatch.indexOf(" (") > 0) {
                        toMatch = toMatch.substring(0, toMatch.indexOf(" ("));
                    }

                    if (hit.toString().trim() === toMatch.toString().trim()) {
                        occ = d.highlights[j].indices.length;
                        return occ > 0;
                    }
                }
            });

            var withoutOcc = _.filter(allLetters, function (d, i) {
                for (var j = 0; j < d.highlights.length; j++) {
                    var hit = formatAgain(formatName(d.highlights[j].hit));
                    var toMatch = ngram;
                    if (toMatch.indexOf(" (") > 0) {
                        toMatch = toMatch.substring(0, toMatch.indexOf(" ("));
                    }

                    if (hit.toString().trim() === toMatch.toString().trim()) {
                        occ = d.highlights[j].indices.length;
                        return occ === 0;
                    }
                }
            });

            var boxId = ngram + "_" + printDate(date) + "_other_box";
            boxId = boxId.split(" ").join("_");


            var output = '';
            var withOccOutput = '';
            var withoutOccOutput = '';
            // scroll window of other letters
            withoutOccOutput += '<div class="panel-heading" style="text-align: center; width:100%;" id="' + boxId + '">';
            withoutOccOutput += '<table class="table-bordered" style="font-variant: small-caps; font-size: smaller; background-color: white" width="100%">';
            withoutOccOutput += '<thead style="cursor:default;"> \n';
            withoutOccOutput += '<tr> <td colspan="2" style="text-align: center; background-color: #f5f5f5"> \n';
            withoutOccOutput += 'other (no occurrences): <span style="text-decoration: underline; font-size:18;"><strong>' + ngram + '</strong></span> on ' + printDate(date) + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" onclick="deleteContextBox(boxCoordinates, \'' + boxId + '\', withoutOccNames)">&times</button> \n  </td> </tr> </thead> \n';
            withoutOccOutput += '<tr><td><div style="max-height: 150px; overflow: auto;"> \n';

            var withoutOccCount = 0;

            output += '<div class="panel-heading" style="text-align: center;">';

            for (var j = 0; j < allLetters.length; j++) {

                var aLetter = allLetters[j];

                var letterID = ngram + "_" + aLetter.name;
                letterID = letterID.split(" ").join("_"); // to connect the words in the ngram with "_"


                // to do!
                // query ???/jj /jj??? - in case of a phrase ???nice fresh sunny morning??? there are 2 hits - ???nice fresh??? and ???fresh sunny??? -> merge!

                var occ = 0;
                for (var l = 0; l < aLetter.highlights.length; l++) {
                    var hit = formatAgain(formatName(aLetter.highlights[l].hit));
                    var toMatch = ngram;
                    if (toMatch.indexOf(" (") > 0) {
                        toMatch = toMatch.substring(0, toMatch.indexOf(" ("));
                    }

                    if (hit.toString().trim() === toMatch.toString().trim()) {
                        occ = aLetter.highlights[l].indices.length;
                    }
                }

                var letterToDisplay = '';

                letterToDisplay += '<div class="panel-heading" style="text-align: center" id="' + letterID + '">';
                letterToDisplay += '<table class="table-bordered" style="font-variant: small-caps; font-size: smaller; background-color: white" width="100%">'

                letterToDisplay += '<thead  style="cursor:default;"> \n';
                letterToDisplay += '<tr> <td colspan="2" style="text-align: center; background-color: #f5f5f5"> \n';
                letterToDisplay += '<span style="';

                // highlight the word only in case there are more than 0 occurrences in this letter
                if (occ > 0) {
                    letterToDisplay += 'color:' + color + '; ';
                }

                letterToDisplay += 'text-decoration: underline; font-size:18;"><strong>' + ngram + '</strong></span> on ' + printDate(date) + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" onclick="deleteContextBox(letterCoordinates, \'' + letterID + '\')">&times</button> \n  </td> </tr> </thead> \n';
                letterToDisplay += '<tr> \n';
                letterToDisplay += '<td style="width:20%;cursor:default;"> \n';

                if (!wholeCorpus) {
                    letterToDisplay += aName.name + '<br><br> \n';
                } else {
                    letterToDisplay += aLetter.author_name + '<br><br> \n';
                }


                letterToDisplay += aLetter.name + '<br><br> \n <hr> \n';
                letterToDisplay += 'Words (total): <br> \n';
                letterToDisplay += aLetter.tokens.length + '<br><br> \n';
                letterToDisplay += 'Occurrences: <br> \n';
                letterToDisplay += occ + '</td> \n';
                letterToDisplay += '<td> <div style="width:100%; max-height: 200px; overflow: auto;"> \n';

                letterToDisplay += formatLetter(aLetter, ngram, color);

                letterToDisplay += '</div> </td> </tr> \n \n';
                letterToDisplay += '</table>';
                letterToDisplay += '</div>';

                // if there are occurrences of ngram in letter
                if (_.contains(withOcc, aLetter)) {
                    withOccOutput += letterToDisplay;
                } else {
                    withoutOccOutput += letterToDisplay;
                    withoutOccCount++;
                    withoutOccNames.push(ngram + "_" + aLetter.name);
                }

                if (_.contains(letterCoordinates, letterID)) {
                    letterCoordinates = deleteContextBox(letterCoordinates, letterID);
                }

                letterCoordinates.push(letterID);

            }
            if (_.contains(boxCoordinates, boxId)) {
                boxCoordinates = deleteContextBox(boxCoordinates, boxId, withoutOccNames);
            }
            boxCoordinates.push(boxId);

            withoutOccOutput += '</div></td></tr></table></div>';

            // add a GoToTop link
            var goToTop = '<div style="text-align:center; font-size:12px; color:grey; cursor:pointer;" onclick="goToTop()">Go To Top</div>';

            var showNoOcc = document.getElementById("showNoOcc");
            if (showNoOcc.checked) {
                if (withoutOccCount > 0) {
                    output += withOccOutput + withoutOccOutput + goToTop + '</div><hr>';
                } else {
                    output += withOccOutput + goToTop + '</div><hr>';
                }
            } else {
                output += withOccOutput + goToTop + '</div><hr>';
            }

            var contexts = document.getElementById("context_table").innerHTML;
            // delete extra component
            if (contexts.indexOf('<div class="panel-heading" style="text-align: center;">' + goToTop + '</div><hr>') > -1) {
                contexts = contexts.split('<div class="panel-heading" style="text-align: center;">' + goToTop + '</div><hr>').join(" ");
            }

            document.getElementById("context_table").innerHTML = output + contexts;
        } else {
            alert("No letters on this day?");
        }

    } else {
        // a nicer alert! - should never appear though
        alert("Sorry, we cannot show the letters written on this day!");
    }

}
;

function deleteContextBox(coordList, whichBox, listNames) {

    if (arguments.length === 3) {
        for (var t = 0; t < listNames.length; t++) {
            var elem2 = document.getElementById(listNames[t]);
            if (elem2 !== null) {
                elem2.parentNode.removeChild(elem2);
            }
            withoutOccNames = _.without(withoutOccNames, listNames[t]);
            letterCoordinates = _.without(letterCoordinates, listNames[t]);
        }
    }

    coordList = _.without(coordList, whichBox);
    var elem = document.getElementById(whichBox);
    var par = elem.parentNode;
    // if it is in the 'no occurrence' box
    withoutOccNames = _.without(withoutOccNames, whichBox);
    letterCoordinates = _.without(letterCoordinates, whichBox);
    boxCoordinates = _.without(boxCoordinates, whichBox);
    if (elem !== null) {
        var len = par.childNodes.length;
        for (var i = 0; i < len; i++) {
            var el = par.lastChild;
            par.removeChild(el);
        }
//        elem.parentNode.removeChild(elem);
    }

    return coordList;
}
;

function deleteAllContextBoxes() {
    document.getElementById("context_table").innerHTML = "";
    letterCoordinates = [];
    boxCoordinates = [];
    withoutOccNames = [];

    // clear all filled in dots on the graph
    svg.selectAll(".dot").style("stroke-width", "2px");
    svg.selectAll(".dot").style("fill", "white");
}
;

function getParameter() {
    var par = document.getElementById("smooth_parameter").value;

    // par would be "" if a letter or empty space is entered
    if (par.length === 0) {
        return null;
    }

    return par;
}
;

function getSmoothLevel() {
    var level;

    for (var i = 1; i < 8; i++) {
        level = document.getElementById("option" + i);
        if (level.parentNode.className.indexOf("active") >= 0) {
            if (level.name.indexOf("_custom") > 0) {
                return ('smooth' + getParameter());
            } else {
                return level.name;
            }
        }
    }

    return "smooth0";
}
;

/**
 * Not used currently.
 * @returns {undefined}
 */
function customize() {
    var classNameSmooth = document.getElementById("custom_smooth").className;
    if (classNameSmooth.indexOf("active") < 0) {

        for (var i = 1; i < 7; i++) {
            var level = document.getElementById("option" + i);
            var classNameLevel = level.parentNode.className;
            if (classNameLevel.indexOf("active") >= 0) {
                level.parentNode.className = classNameLevel.substring(0, classNameLevel.indexOf("active"));
            }
        }

        document.getElementById("custom_smooth").className += " active";
    }

    showData('smooth' + getParameter());
}
;

function showHelpTooltip(message) {
    document.getElementById("help-tooltip").innerHTML = '&nbsp;<span class="glyphicon glyphicon-question-sign"></span> &nbsp;' + message + '&nbsp;';
    document.getElementById("help-tooltip").hidden = false;

}
;

function hideHelpTooltip() {
    document.getElementById("help-tooltip").hidden = true;
}
;



function handleFiles(corpus) {
///// clean the screen
// hide the tooltip and the line if visible
    hideTooltip();
// clear the graph area 
    var graphArea = document.getElementById("graphArea");
    if (graphArea.childElementCount > 0) {
        while (graphArea.hasChildNodes()) {
            graphArea.removeChild(graphArea.lastChild);
        }
    }


    // reset the Smooth-buttons on reload
    var smoothButtons = document.getElementById("smooth_buttons").getElementsByTagName("label");
    for (var i = 1; i < smoothButtons.length; i++) {
        smoothButtons[i].className = "btn btn-default";
    }

    // reset the statistics selector
    $('#stats-select option').each(function () {
        if (this.defaultSelected) {
            this.selected = true;
//            $('#slider').slider("disable");
            return false;
        }
    });



    // delete all contexts
    document.getElementById("context_table").innerHTML = "";
    letterCoordinates = [];
    boxCoordinates = [];
    withoutOccNames = [];
    // clear the list of last queries
    removedLinesArray = [];
    removedLines.innerHTML = "";
    successfulQueriesArray = [];
    successfulQueries.innerHTML = "";
    notInCorpusQueriesArray = [];
    notInCorpusQueries.innerHTML = "";

    // delete and hide all alerts
    deleteAllAlerts();

    // show the Processing alert
    var div_processing = document.createElement("div");
    div_processing.setAttribute("id", "div_processing");
    var alertProcessing = document.getElementById("alertProcessing");
    for (var i = 0; i < alertProcessing.childElementCount; i++) {
        alertProcessing.removeChild(alertProcessing.lastChild);
    }
    if (alertProcessing.childElementCount === 0) {
        div_processing = alertProcessing.appendChild(div_processing);
        div_processing.innerHTML = "<button type='button' class='close' data-dismiss='alert' onclick=hideAlert('alertProcessing')>&times;</button><h4>PROCESSING...</h4>";
    }
    alertProcessing.hidden = false;


    // remove the query boxes
    var p = document.getElementById("author_panels");
    p.innerHTML = '<span class="popover-element searchWords" id="search_popover" data-html=true data-container="body" data-toggle="popover" data-placement="left" data-trigger="hover" data-content="<br/>Enter the ngrams to compare their usage across specified subsets.">search words in... <span class="glyphicon glyphicon-question-sign"></span></span> <br><br> \
<div class="panel panel-info"> \
                    <div class="panel-heading"> \
                        <h4 class="panel-title"> \
                            <button type="button" class="close" style="font-size: 12px" onclick="clearSelectedWords(\'all\')">/clear</button> \
                            <a data-toggle="collapse" data-parent="#accordion" \
                               href="#collapse_all"> \
                                whole corpus \
                            </a> \
                        </h4> \
                    </div> \
                    <div id="collapse_all" class="panel-collapse collapse"> \
                        <div class="panel-body"> \
                            <input type="text" id= "word1_all" placeholder="ngram 1..."> \
                            <input type="text" id= "word2_all" placeholder="ngram 2..."> \
                            <input type="text" id= "word3_all" placeholder="ngram 3..."> \
                        </div> \
                    </div> \
                </div> \
                ';
    var a = document.getElementById("display_authors");
    a.innerHTML = '';


    setTimeout(function () {

        if (corpus.length > 0) {
            // set the control global variables
            DATE_TAG = setControlGlobals("getDateElement");
            DATE_PROP = setControlGlobals("getDateAttribute");

            SUBSET_TAG = setControlGlobals("getSubsetElement");
            SUBSET_PROP = setControlGlobals("getSubsetAttribute");

            TEXT_TAG = setControlGlobals("getTextElement");
            TEXT_PROP = setControlGlobals("getTextAttribute");

            TOKEN_TAG = setControlGlobals("getTokenElement");
            TOKEN_PROP = setControlGlobals("getTokenAttribute");

            LEMMA_TAG = setControlGlobals("getLemmaElement");
            LEMMA_PROP = setControlGlobals("getLemmaAttribute");

            TAG_TAG = setControlGlobals("getPosElement");
            TAG_PROP = setControlGlobals("getPosAttribute");

            // load the corpus
            loadCorpus(corpus);
            // change the "PROCESSING..." state into "DONE" and list the possible queries (tokens, lemmas and/or pos tags)
            document.getElementById("div_processing").innerHTML = "<button type='button' class='close' data-dismiss='alert' onclick=hideAlert('alertProcessing')>&times;</button><h4>DONE!</h4>";

            // one day alert (not enough data)
            if (DATA_BY_DATE.length <= 1) {
                var msg = '<h4>TOO LITTLE DATA</h4>Please, select at least two letters written on different days.';
                showAlert('alertOneDay', msg);
            }

            // display the authors in the heading
            if (AUTHORS.length > 0) {
                var a = document.getElementById("display_authors");
                var display_authors = '';
                for (var t = 0; t < AUTHORS.length; t++) {
                    if (t < AUTHORS.length - 1) {
                        display_authors += AUTHORS[t] + '&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-send"></span>&nbsp;&nbsp;&nbsp;';
                    } else if (t === AUTHORS.length - 1) {
                        display_authors += AUTHORS[t];
                    }
                }
                a.innerHTML = display_authors;


                // add as many query boxes as there are authors

                var panel_contents = '';
                for (var r = 0; r < AUTHORS.length; r++) {
                    panel_contents += '<div class="panel panel-info"> \
                    <div class="panel-heading"> \
                        <h4 class="panel-title"> \
                            <button type="button" class="close" style="font-size: 12px" onclick="clearSelectedWords(\'' + AUTHORS[r] + '\')">/clear</button> \
                            <a data-toggle="collapse" data-parent="#accordion" \
                               href="#collapse_' + AUTHORS[r] + '"> \
                                <span class="glyphicon glyphicon-user"></span>&nbsp; ' + AUTHORS[r] + ' \
                            </a> \
                        </h4> \
                    </div> \
                    <div id="collapse_' + AUTHORS[r] + '" class="panel-collapse collapse"> \
                        <div class="panel-body"> \
                            <input type="text" id= "word1_' + AUTHORS[r] + '" placeholder="ngram 1..."> \
                            <input type="text" id= "word2_' + AUTHORS[r] + '" placeholder="ngram 2..."> \
                            <input type="text" id= "word3_' + AUTHORS[r] + '" placeholder="ngram 3..."> \
                        </div> \
                    </div> \
                </div> \
                ';
                }
                p.innerHTML += panel_contents;
            }

            //// show alerts for missing data

            // collect the info about missing data
            var missingItems = "";
            var missingKeys = Object.keys(BAD_DOCS);
            var missingTextAndTokens = 0;
            var missingTokens = false;

            for (var m = 0; m < missingKeys.length; m++) {
                // if more than half letters do not have this annotation
                if (BAD_DOCS[missingKeys[m]].length === corpus.length) {
                    var item = missingKeys[m]; // e.g. "missing_tokens"
                    item = item.substring(item.indexOf("_") + 1);
                    // if the annotation is specified in the settings
                    var missing = false;

                    if (item === "subset") {
                        // if the annotation _is_ provided
                        if (SUBSET_TAG !== null || SUBSET_PROP !== null) {
                            missing = true;
                        }
                    } else if (item === "tokens") {
                        if (TOKEN_TAG !== null || TOKEN_PROP !== null) {
                            missing = true;
                        }
                        missingTextAndTokens++;
                        missingTokens = true;
                    } else if (item === "lemmas") {
                        if (LEMMA_TAG !== null || LEMMA_PROP !== null) {
                            missing = true;
                        }
                    } else if (item === "pos") {
                        if (TAG_TAG !== null || TAG_PROP !== null) {
                            missing = true;
                        }
                    } else if (item === "text") {
                        if (TEXT_TAG !== null || TEXT_PROP !== null) {
                            missing = true;
                        }
                        missingTextAndTokens++;
                    }
                    if (missing) {
                        missingItems += item + "<br>";
                    }
                }
            }

            if (missingItems.length > 0) {
                // show the alert
                var msg = "<h4>MISSING DATA</h4>We could not find the following annotations in the corpus:<br> <div style='overflow: scroll; height: 55px; border:1px solid; border-radius:2px; border-color:#faebcc; background-color:white; font-size:12px;'>" + missingItems + "</div><br>Please check your configuration by clicking <span class='glyphicon glyphicon-cog'></span> at the top of the window and then reload the corpus.";
                if (missingTextAndTokens === 2) {
                    msg += "<br/><br/> Please notice that either TOKENS or TEXT should be annotated.";
                }
                showAlert('alertMissingData', msg);
            }
            if (missingTextAndTokens === 2) {
                // show the alert
                var msg = "<h4>MISSING DATA</h4>Please notice that either TOKENS or TEXT should be annotated.<br><br>Please check your configuration by clicking <span class='glyphicon glyphicon-cog'></span> at the top of the window and then reload the corpus.";
                showAlert('alertMissingData', msg);
                NO_DATA_TO_SHOW = true;
            } else if (missingTokens) {
                var msg = "<h4>BEWARE!</h4> Due to missing TOKENS your corpus will be tokenized automatically and sloppily. <br><br> You can check your configuration by clicking <span class='glyphicon glyphicon-cog'></span> at the top of the window. Do not forget to reload the corpus afterwards.";
                showAlert('alertNoCorpus', msg);
            }


        } else {
            // delete all alerts
            deleteAllAlerts();

            // show noCorpus alert
            var msg = "<h4>NO INPUT CORPUS</h4>Load the corpus that you want to search. Type in one or several words and click 'Show Graph'.";
            showAlert('alertNoCorpus', msg);
            return;
        }
    }, 100);
}

function setControlGlobals(id) {
    var tmp = "";

    tmp = document.getElementById(id).value.trim();
    if (tmp.length > 0) {
        return tmp;
    } else {
        return null;
    }

}

function formatIssuesAllert(removedFiles, removedAsString) {
    if (removedFiles.length > 0) {
        var msg = "";
        if (removedFiles.length > 1) {
            msg = removedFiles.length + " files were excluded from the visual representation due to missing date in the metadata: <div style='overflow: scroll; height: 55px; border:1px solid; border-radius:2px; border-color:#faebcc; '>" + removedAsString + "</div>";
        } else {
            msg = "1 file was excluded from the visual representation due to missing date in the metadata: <div style='overflow: scroll; height: 55px; border:1px solid; border-radius:2px; border-color:#faebcc;  '>" + removedAsString + "</div>";
        }
        showAlert('alertFiles', msg);
    }
}
;


function tooFewLettersAlert(author_name) {
    document.getElementById("alertOneLetter").innerHTML = "<button type='button' class='close' data-dismiss='alert' onclick=hideAlert('alertOneLetter')>&times;</button><h4>TOO LITTLE DATA</h4>Please, select at least two letters (" + author_name + ") written on different days.";
    document.getElementById("alertOneLetter").hidden = false;
}
;


function goToTop() {
    $('html, body').animate({
        scrollTop: $("#heading").offset().top
    }, 300);
}
;

//
//function hideSidebar() {
//    document.getElementById('the_sidebar').style.width = "10px";
//}