/*
 Copyright (c) [2014] [Chinkina M]
 */


var width_full = $(window).width() - 290;
// set the area and margins
var margin = {top: 40, right: 170, bottom: 70, left: 50},
height = 500 - margin.top - margin.bottom;

width = width_full - margin.left - margin.right;

document.getElementById("heading").setAttribute("style", "padding-right: 270px; padding-top: 30px");
document.getElementById("smoothing").setAttribute("style", "padding-left: " + ((width - 400) / 2) + ";");
document.getElementById("lastQueries").setAttribute("style", "margin-left: 20px");

// append svg-canvas to body
// variable svg === graphArea from now on
var svg = d3.select("body").select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

// 'g' is referenced to the top_left_corner of the actual graph area on the canvas
// used for grouping together several related elements
// functions as a reference point
        .selectAll(".graphArea")
        .attr("transform", "translate(" + (margin.left) + "," + (margin.top + 5) + ")"); // translate = move the point to top left corner of graph space proper




// add a component to list the last searched words
var removedLines = document.getElementById("removedLines");
var successfulQueries = document.getElementById("successfulQueries");
var notInCorpusQueries = document.getElementById("notInCorpusQueries");

// store the words that were searched for in this session, and the deleted words (with the option to display them again)
var numOfQueries = 10;
var removedLinesArray = [];
var successfulQueriesArray = [];
var notInCorpusQueriesArray = [];


// important step to have a nicely formatted time ticks on X axis
// parses the dates in format YYYYMMDD
var parseDate = d3.time.format("%Y%m%d").parse;

// another formating of date - the other way around
var ddmmyyyyFormat = d3.time.format("%d.%m.%Y");

// tell D3 where to draw something on the x axis
var x = d3.time.scale()
        .range([0, width]);


// "scales, domains and colors": http://www.jeromecukier.net/blog/2011/08/11/d3-scales-and-color/
var y = d3.scale.linear()
        .range([height, 0]);

var xValue = function (d) { // date
    return d.date;
};
var xMap = function (d) { // actual point on X axis corresponding to this date
    return x(xValue(d));
};
var yValue = function (d) { // percentage for this word
    return d.count_percent;
};
var yMap = function (d) { // actual point on Y axis corresponding to this percentage
    return y(yValue(d));
};

// Constructs a new ordinal scale with a range of ten categorical colors:
// #1f77b4 #ff7f0e #2ca02c #d62728 #9467bd #8c564b #e377c2 #7f7f7f #bcbd22 #17becf
var color = d3.scale.category10();

var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom").ticks(10);

var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left").ticks(15);

// set of coordinates to plot
var line = d3.svg.line()
        // x & y accessors (set up earlier)
        .x(function (d) {
            return x(d.date);
        }) // d.date doesn't have to be the name of the column in .tsv file?
        .y(function (d) {
            return y(d.count_percent);
        });


var tmpLine = d3.select("svg").selectAll(".tmpLine")
        .attr("x1", 15)
        .attr("x2", width + 50)
        .style("opacity", 0);

var toolTip = d3.select("body").append("div")
        .attr("class", "toolTip")
        .attr("id", "toolTip")
        .style("opacity", 0);

// global variables
var data;
var words;
var coordinates;
var letterCoordinates;
var boxCoordinates;
var withoutOccNames;
var selectVal;
var clicked; // for word tooltip
var NO_DATA_TO_SHOW; // in case the corpus is not annotated properly or the settings are not configured


var SPACE_BETWEEN_WORDS = 17;


/**
 * Calls path with appropriate parameters.
 * @param {String} smoothLevel "unknown" if passed from ShowGraph
 */
function showData(smoothLevel) {
    
    if (NO_DATA_TO_SHOW) {
        return;
    }
    
    if (smoothLevel === "unknown") {
        path(getSmoothLevel(), true);
    } else {
        path(smoothLevel, false);
    }
}

/**
 * Draws a graph for all words at the specified smoothLevel.
 * @param {String} smoothLevel : "smooth0", "smooth15", etc.
 * @param {boolean} passedFromShowGraph to reset or not to reset
 * @return -
 */
function path(smoothLevel, passedFromShowGraph) {

    //coordinates = [];
    var param = getParameter();
    var totalTime = []; // read from user's input files
    var graphAreaCount = document.getElementById("graphArea").childElementCount;
    selectVal = document.getElementById("stats-select").value; // value for statistics selector


    if ((smoothLevel !== null) && (param >= 0)) {
        // store the info about hide/show element
        var hideOrShow = document.getElementsByClassName("hideDots");
        var hideOrShowLength = hideOrShow.length;
        if (hideOrShowLength > 0) {
            var hideOrShowText = (hideOrShow[0].textContent);
        }

        // hide tooltip and line
        hideTooltip();

        // indicate the processing
        document.getElementById("alertProcessing").innerHTML = "";
        document.getElementById("alertProcessing").hidden = true;

        // clear the graph area on reload
        var graphArea = document.getElementById("graphArea");
        if (graphArea.childElementCount > 0) {
            while (graphArea.hasChildNodes()) {
                graphArea.removeChild(graphArea.lastChild);
            }
        }

        if (passedFromShowGraph) {
            // store only the current session removed lines
            removedLinesArray = [];
            removedLines.innerHTML = "";
        }

        // when the corpus is not loaded
        // show alert
        if (DATA_BY_DATE.length === 0) {
            var msg = "<h4>NO INPUT CORPUS</h4>Load the corpus that you want to search. Type in one or several words and click 'Show Graph'.";
            showAlert("alertNoCorpus", msg);
            return;
        }


        coordinates = [];

        // when the corpus is not loaded
        if (DATA_BY_DATE.length === 0) {
            var msg = "<h4>NO INPUT CORPUS</h4>Load the corpus that you want to search. Type in one or several words and click 'Show Graph'.";
            showAlert("alertNoCorpus", msg);
            return;
        }

        // store the selected words and set time period
        var selectedWords = getAllWordsWithTags();

        // when no word is typed in
        // show alert
        if (selectedWords.length === 0) {
            var msg = "<h4>NO WORDS FOUND</h4>Navigate through the menu above. Type in one or several words and click 'Show Graph'.";
            showAlert("alertNoWords", msg);
        } else {

            // show an optional info message
            if (selectedWords.length > 6) {
                var msg = "Limit your search to 6 words if you do not want the graph to look messy.";
                showAlert("alertLessWords", msg);
            }

//// get and parse the tsv string

            var tsvString = "";

            var smoothParam = parseInt(smoothLevel.substring(6));

            if (passedFromShowGraph) {
                tsvString = makeTSV(getTheWords());
                if (smoothLevel !== "smooth0") {
                    tsvString = smooth(smoothParam);
                }
                // check if statistics is in use
                if (selectVal === "sign_fluct") { // add: and if there is no info in the tsvString yet???
                    tsvString = significantFluctuations(smoothParam);
                } else if (selectVal === "sign_diff") { // add: and if there is no info in the tsvString yet???
                    tsvString = significantDifferences(smoothParam);
                }
            } else {
                if (graphAreaCount > 0) {
                    tsvString = smooth(smoothParam);
                    // check if statistics is in use
                    if (selectVal === "sign_fluct") { // add: and if there is no info in the tsvString yet???
                        tsvString = significantFluctuations(smoothParam);
                    } else if (selectVal === "sign_diff") { // add: and if there is no info in the tsvString yet???
                        tsvString = significantDifferences(smoothParam);
                    }
                } else {
                    return;
                }
            }

            data = d3.tsv.parse(tsvString);
////


            // check the statistics selector
            if (selectVal === "no_thanks") {
                hideAlert("alertStatistics");
                $('html, body').animate({
                    scrollTop: $("#heading").offset().top
                }, 300);
            }



            // "color" is a scale of 10 colors
            // scale.domain sets the scale's input domain to the specified array in the parameter
            // "key" is the name of the current column ("date", "love_smooth0", etc.) in the array of keys
            //color.domain(d3.keys(data[0]).filter(function(key, i) { return key !== "date" ;})); // display all words
            //color.domain(d3.keys(data[0]).filter(function(key, i) { return key === "happy_smooth0" ;})); // display one word-line
            //color.domain(d3.keys(data[0]).filter(function(key, i) { return ((key === "happy_smooth0") || (key === "love_smooth0")) ;}));
            color.domain(d3.keys(data[0]).filter(function (key, i) {
                key = new String(key);
                var theWord = new String(key);
                if (key.indexOf("_smooth0") > -1) {
                    theWord = formatName(key);
                }
                return (selectedWords.indexOf(theWord) > -1);
            }));

            data.forEach(function (d) {
                d.date = parseDate(d.date_All);
                d["all_PerCent"] = +d["all_PerCent"];
                d["all_Num"] = +d["all_Num"];
                for (var j = 0; j < AUTHORS.length; j++) {
                    d[AUTHORS[j] + "_PerCent"] = +d[AUTHORS[j] + "_PerCent"];
                    d[AUTHORS[j] + "_Num"] = +d[AUTHORS[j] + "_Num"];
                }
//                // Commented out earlier: in case of an empty string "", turned it into 0 (not good for smoothing)
//                for (var i = 0; i < selectedWords.length; i++) {
//                    var selWord = selectedWords[i];
//                    d[selWord + "_smooth_custom"] = d[selWord + "_smooth" + getParameter()];
//                }
            });


            // set the first and last dates
            totalTime.push(printDate(data[0].date));
            totalTime.push("???");
            totalTime.push(printDate(data[data.length - 1].date));



            // extract only the info about the words
            // organizing the info in a more convenient object
            // scale.domain() (no parameter)
            words = color.domain().map(function (name) {

                var wordObj = {name: name};
                wordObj = addSmoothes(wordObj);
                wordObj = addStatistics(wordObj);

                return wordObj;

            });


///////// start: if passed from ShowGraph
            if (passedFromShowGraph) {
                // classify the words into successful/not-found arrays
                for (var i = 0; i < words.length; i++) {
                    var foundWord = formatAgain(formatName(words[i].name));
                    // if all smooth0 values of this word are 0
                    // add to notInCorpusArray
                    if ((_.every(words[i].smooth0, function (j) {
                        return j.count_percent === 0;
                    }))) {
                        if (!_.contains(notInCorpusQueriesArray, foundWord)) {
                            notInCorpusQueriesArray.push(foundWord);
                        }
                    } else {
                        // add all found words to successfulQueriesArray
                        if (!_.contains(successfulQueriesArray, foundWord)) {
                            successfulQueriesArray.push(foundWord);
                        }
                    }
                }

                // add the successful/not-found queries to the list
                successfulQueries.innerHTML = "";
                for (var i = 0; i < successfulQueriesArray.length; i++) {
                    var thisWord = successfulQueriesArray[i];
                    var successfulContent = successfulQueries.innerHTML;
                    successfulQueries.innerHTML = '<a class="list-group-item"><span class="badge"></span>' + thisWord + '</a>' + successfulContent;
                }
                notInCorpusQueries.innerHTML = "";
                for (var i = 0; i < notInCorpusQueriesArray.length; i++) {
                    var thisWord = notInCorpusQueriesArray[i];
                    var notInCorpusContent = notInCorpusQueries.innerHTML;
                    notInCorpusQueries.innerHTML = '<a class="list-group-item"><span class="badge"></span>' + thisWord + '</a>' + notInCorpusContent;
                }
            }
///////// end: if passed from ShowGraph



            // setting the domain of x and y
            // domain: let D3 know what the scope of the data will be
            // take the values of data that we have and to fit them into the space we have available(pass to .range)
            // the inner function looks through all the ???date??? values that occur in the ???data??? array
            // .extent finds the maximum and minimum values in the array and adjusts the ticks & axis accordingly
            // .domain returns those maximum and minimum values to D3 as the range for the x axis
            x.domain(d3.extent(data, function (d) {
                return d.date;
            }));

            //
            y.domain([
                // set the minimum != 0 to show the lines spread around the area rather than just on top
                // CHANGE to 0?
                d3.min(words, function (c) {
                    return d3.min(c.smooth0, function (v) {
                        return v.count_percent;
                    });
                }),
                d3.max(words, function (c) {
                    return d3.max(c.smooth0, function (v) {
                        return v.count_percent;
                    });
                })
            ]);



////////// begin: actually drawing the graph

// draw the background gradient
            var backgroung = svg.append("g")
                    .attr("class", "background")
                    .selectAll(".lines")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "lines")
                    .append("line") // better than a rectangle
                    .attr("x1", xMap)
                    .attr("y1", 0)
                    .attr("x2", xMap)
                    .attr("y2", height)
                    .style("stroke-width", width / NUM_DAYS)
                    .style("stroke", "lightgray")
                    .style("opacity", function (d) {
                        // set the background for whole corpus or the specified author
                        var current_authors = [];
                        var who = "all"; // show the vertical lines for the whole corpus by default
                        var all = false;
                        for (var j = 0; j < selectedWords.length; j++) {
                            for (var k = 0; k < AUTHORS.length; k++) {
                                if ((_.contains(selectedWords[j], AUTHORS[k])) && (!_.contains(current_authors, AUTHORS[k]))) {
                                    current_authors.push(AUTHORS[k]);
                                } else if ((!_.contains(selectedWords[j], AUTHORS[k])) && (!_.contains(selectedWords[j], "_"))) {
                                    all = true;
                                }
                            }
                        }
                        // if there is only one current author, and the whole corpus is not being searched in
                        if ((current_authors.length === 1) && (!all)) {
                            who = current_authors[0];
                        }
                        return (d[who + "_PerCent"] / 100);
                    })
                    .on("click", function () {
                        hideTooltip();
                    });

// set the significant-area rectangle
            var rectStats = svg.append("rect")
                    .attr("class", "rectStats")
                    .attr("y", 0)
                    .attr("rx", 5)
                    .attr("ry", 5)
                    .attr("height", height);

            // draw X axis
            svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")") // 0 - beginning of 'g', not of svg in general
                    .style("font-size", 12)
                    .call(xAxis) // initiate the drawing action
                    // add a <text> element with attributes to display the name of the axis
                    .append("text")
                    .attr("x", width / 2)
                    .attr("y", margin.bottom - 20)
                    .style("text-anchor", "middle")
                    .style("font-size", 18)
                    .text(totalTime.toString().replace(",???,", " ??? "));

            // draw Y axis
            svg.append("g")
                    .attr("class", "y axis")
                    .style("font-size", 10)
                    .call(yAxis); // initiate the drawing action



////////// begin: statistics (diff lines)
            if (selectVal === "sign_diff") {

                // show non-valid query alert for diff 
                // if there are more than two words or
                // if the two words are not identical
                if (!checkQueries()) {
                    var msg = "<h4>NON-VALID QUERY</h4>Currently, only frequencies of 1 n-gram in 2 different subsets can be compared.";
                    showAlert("alertStatistics", msg);
                    $('html, body').animate({
                        scrollTop: $("#graphArea").offset().top
                    }, 300);
                }
                else {

                    hideAlert("alertStatistics");

                    $('html, body').animate({
                        scrollTop: $("#heading").offset().top
                    }, 300);

                    var signStatsLow = "diff_low" + smoothParam;
                    var signStatsHigh = "diff_high" + smoothParam;

                    // an array of 2 arrays of objects (for 2 lines)
                    var diffData = [];

                    // for each word - create an array of points (objects)
                    for (var w = 0; w < words.length; w++) {

                        if (words[w][signStatsHigh] || words[w][signStatsLow]) {

                            var word1 = formatName(words[w].name);
                            var wordFullHigh = word1 + "_" + signStatsHigh;
                            var wordFullLow = word1 + "_" + signStatsLow;

                            var pointsHigh = [];

                            if (words[w][signStatsHigh]) {
                                pointsHigh = (words[w][signStatsHigh]).filter(function (d, k) {
                                    return (data[k].date === d.date && data[k][wordFullHigh] !== "");
                                });
                            }

                            var pointsLow = [];
                            if (words[w][signStatsLow]) {
                                pointsLow = (words[w][signStatsLow]).filter(function (d, u) {
                                    return (data[u].date === d.date && data[u][wordFullLow] !== "");
                                });
                            }

                            // merge the two lists together
                            var diffDataSm = _.union(pointsHigh, pointsLow); // check if it works with objects!
                            // sort by date
                            diffDataSm = _.sortBy(diffDataSm, function (d) {
                                return d.date;
                            });

                            var diffDataBg = {};
                            diffDataBg["name"] = words[w].name;
                            diffDataBg["sign_points"] = diffDataSm;


                            diffData.push(diffDataBg);
                        } else {
                            // show alertStatistics
                            var msg = "NOT ENOUGH DATA for statistical analysis. <br/> Please, provide a longer period of time <br/> or choose a smaller smoothing parameter.";
                            showAlert("alertStatistics", msg);
                            $('html, body').animate({
                                scrollTop: $("#graphArea").offset().top
                            }, 300);
                            return;
                        }

                    }

                    if ((diffData.length !== 0) && (diffData[0].sign_points.length !== 0 || diffData[1].sign_points.length !== 0) ) {
                        
                        // reorganize diffData
                        var newDiffData = [];
                        for (var t = 0; t < diffData[0].sign_points.length; t++) {
                            var obj = {};
                            obj["date"] = (diffData[0].sign_points)[t].date;
                            obj["count1"] = (diffData[0].sign_points)[t].count_percent;
                            obj["count2"] = (diffData[1].sign_points)[t].count_percent;
                            newDiffData.push(obj);
                        }


                        var diffLineAll = svg.append("g")
                                .attr("class", "diffLines")
                        var diffLine = diffLineAll.selectAll(".diffLine")
                                .data(newDiffData)
                                .enter().append("g")
                                .attr("class", "diffLine")
                                .style("visibility", "visible");

                        diffLine.append("svg:line")
                                .attr("x1", function (d) {
                                    return x(d.date);
                                })
                                .attr("y1", function (d) {
                                    return y(d.count1);
                                })
                                .attr("x2", function (d) {
                                    return x(d.date);
                                })
                                .attr("y2", function (d) {
                                    return y(d.count2);
                                })
                                .attr("class", "diff-line")
                                .on("mouseover", function (d) {
                                    // make the line thicker
                                    this.style.strokeWidth = "5px";

                                    // calculate the start and end dates of the significant span
                                    var span = smoothParam;

                                    var curDate = xValue(d);
                                    var startDate = d3.time.day.offset(curDate, -span);
                                    var endDate = d3.time.day.offset(curDate, span);

                                    curDate = ddmmyyyyFormat(curDate);
                                    startDate = ddmmyyyyFormat(startDate);
                                    endDate = ddmmyyyyFormat(endDate);

                                    var tooltipHTMLDiff = "<strong>significant difference</strong> <br/> higher frequency for <br/><strong>";


                                    // add info about the higher frequency - subset
                                    // compare the two counts
                                    var higherFreq = "higher frequency for ";
                                    if (d.count1 > d.count2) {
                                        higherFreq = formatAgain(formatName(diffData[0].name));
                                    } else {
                                        higherFreq = formatAgain(formatName(diffData[1].name));
                                    }
                                    tooltipHTMLDiff += higherFreq + "</strong><br/>";

                                    if (span === 0) {
                                        tooltipHTMLDiff += curDate;
                                    } else {
                                        tooltipHTMLDiff += startDate + " - " + endDate + "<br/>";
                                    }

                                    toolTip.transition()
                                            .duration(100)
                                            .style("opacity", 1);
                                    toolTip.html(tooltipHTMLDiff)
                                            .style("left", (d3.event.pageX + 5) + "px")
                                            .style("top", (d3.event.pageY - 40) + "px");


                                    if (smoothParam === 0) {
                                        span = 0.5;
                                    }

                                    var startX = xMap(d) - span * (width / NUM_DAYS); // top left starting point
                                    var w = span * 2 * (width / NUM_DAYS);
                                    // fit the rectStats width into the width of graphArea
                                    if (w > width) { // in case of a big parameter
                                        startX = 0;
                                        w = width;
                                    }
                                    if (startX < 0) { // in case the rect goes beyond graphArea on the left
                                        w = w - Math.abs(startX);
                                        startX = 0;
                                    }
                                    if ((startX + w) > width) { // in case the rect goes beyond graphArea on the right
                                        w = width - startX;
                                    }

                                    rectStats.attr("x", startX)
                                            .attr("width", w)
                                            .style("fill", "red")
                                            .style("visibility", "visible");


                                })
                                .on("mouseout", function (d) {
                                    // make the line thin again
                                    this.style.strokeWidth = "3px";
                                    // hide tooltip
                                    hideTooltip();
                                    // hide rectangle
                                    rectStats.style("visibility", "hidden");
                                });

                    } else {
                        // show alertStatistics
                        var msg = "The difference between these two words is not significant at this level of smoothing. <br/> Please, choose another smoothing parameter.";
                        showAlert("alertStatistics", msg);

                        if (diffData[0].sign_points.length !== diffData[1].sign_points.length) {
                            msg = "Sorry, something went wrong. Try other levels of smoothing.";
                            showAlert("alertStatistics", msg);
                        }
                    }

                }

            }

///////////// end: statistics (diff lines)



            ////// set path and text for every word
            var aWord = svg.selectAll(".word")
                    .data(words) // words = an array
                    .enter().append("g")
                    .attr("class", "word")
                    .attr("id", function (d) {
                        return formatName(d.name);
                    })
                    .style("visibility", "visible");

            // create a svg element which is a path going from one set of 'd.values' coordinates to another
            // can inherit the ???path??? styles from the CSS section
            // add attributes on-the-go because the color depends on the number of words ("stroke")
            aWord.append("path")
                    .attr("class", "smooth") // tie to CSS ,line

                    // creates a svg element which is a path going from one set of 'd.values' coordinates to another
                    .attr("d", function (d) {

                        var w = this.parentNode.id;

                        return line((d[smoothLevel]).filter(function (d, i) {

                            if (smoothLevel === "smooth0") {

                                var current_author = []
                                for (var l = 0; l < AUTHORS.length; l++) {
                                    if ((w.indexOf("_" + AUTHORS[l]) > 0) && (!_.contains(current_author, AUTHORS[l]))) {
                                        current_author.push(AUTHORS[l]);
                                    }
                                }

                                if (current_author.length === 1) {
                                    return (data[i].date === d.date && data[i][current_author + "_PerCent"] !== 0);
                                } else if (current_author.length === 0) {
                                    return (data[i].date === d.date && data[i]["all_PerCent"] !== 0);
                                } else {
                                    alert("Error line 382 WordVizFunctions!");
                                }
                            } else {
                                return (data[i].date === d.date && data[i][w + "_" + smoothLevel] !== "");
                            }
                        }));
                    })
                    .style("stroke", function (d) {
                        return color(d.name);
                    })
                    .on("mouseover", function (d, i) {
                        this.style.strokeWidth = "3.5px";
                    })
                    .on("mouseout", function (d, i) {
                        this.style.strokeWidth = "1.5px";
                    });



            // set the n-gram label at the end of the line
            aWord.append("text")
                    .attr("class", "text1")
                    .attr("x", 5)
                    .attr("dy", ".35em")
                    .text(function (d) {
                        return formatAgain(formatName(d.name));
                    })
                    .on("mouseover", function (d) {
                        var msg = "<strong>Click</strong> on the word to remove the line. <br/> Find it on the <strong>'removed'</strong> list below.";
                        showHelpTooltip(msg);
                    })
                    .on("mouseout", function (d) {
                        hideHelpTooltip();
                    })
                    .datum(function (d) {
                        var w = this.parentNode.__data__;
                        var lastEl = w[smoothLevel].filter(function (v, i) {

                            var current_author = []
                            for (var l = 0; l < AUTHORS.length; l++) {
                                if ((w.name.indexOf("_" + AUTHORS[l]) > 0) && (!_.contains(current_author, AUTHORS[l]))) {
                                    current_author.push(AUTHORS[l]);
                                }
                            }

                            if (current_author.length === 1) {
                                return (data[i].date === d.date && data[i][current_author + "_PerCent"] !== 0);
                            } else if (current_author.length === 0) {
                                return (data[i].date === d.date && data[i]["all_PerCent"] !== 0);
                            } else {
                                alert("Error line 495 WordVizFunctions!");
                            }
                        });
                        lastEl = lastEl[lastEl.length - 1];
                        var formatted_once = formatName(d.name);
                        var formatted_twice = formatAgain(formatted_once);
                        this.innerHTML = formatted_twice;
                        return {name: formatted_twice, value: lastEl};
                    })
                    .attr("transform", function (d) {

                        // last percent != 0
                        var w = this.parentNode.__data__;
                        var lastEl = w[smoothLevel].filter(function (d, i) {

                            var current_author = [];
                            for (var l = 0; l < AUTHORS.length; l++) {
                                if ((w.name.indexOf("_" + AUTHORS[l]) > 0) && (!_.contains(current_author, AUTHORS[l]))) {
                                    current_author.push(AUTHORS[l]);
                                }
                            }

                            if (current_author.length === 1) {
                                return (data[i].date === d.date && data[i][current_author + "_PerCent"] !== 0);
                            } else if (current_author.length === 0) {
                                return (data[i].date === d.date && data[i]["all_PerCent"] !== 0);
                            } else {
                                alert("Error line 452 WordVizFunctions!");
                            }

                        });

                        lastEl = lastEl[lastEl.length - 1];
                        var yPercent = y(lastEl.count_percent);

                        // store the object with yPercent
                        coordinates.push({name: this.__data__.name, obj: lastEl, percent: yPercent}); // coordinates - a list of objects

                        return "translate(" + (width + 10) + "," + yPercent + ")";
                    })
                    .style("fill", function (d, i) {
                        var col = this.parentNode.childNodes[0].attributes[2].value;

                        if (col.indexOf("rgb") > 0) {
                            col = col.substring(col.indexOf("rgb"), col.indexOf(")") + 1);
                        } else {
                            col = col.substring(col.indexOf("#") + 1, col.indexOf(";"));
                        }
                        return col;
                    })
                    // click on the label to delete the line
                    .on("click", function (d) {
                        (this.parentNode).style.visibility = "hidden";
                        var dots = (this.parentNode.getElementsByClassName("dots"))[0].childNodes;
                        for (var j = 0; j < dots.length; j++) {
                            dots[j].style.visibility = "hidden";
                        }
                        var thisWord = this.parentNode.id;
                        if (!_.contains(removedLinesArray, thisWord)) {
                            var col = this.parentNode.childNodes[0].attributes[2].value;
                            if (col.indexOf("rgb") > 0) {
                                col = col.substring(col.indexOf("rgb"), col.indexOf(")") + 1);
                            } else {
                                col = col.substring(col.indexOf("#") + 1, col.indexOf(";"));
                            }
                            removedLinesArray.push(thisWord);
                            var removedContent = removedLines.innerHTML;
                            removedLines.innerHTML = '<a class="list-group-item" id="' + thisWord + '_removed" style="color: ' + col + '; cursor: pointer;" onclick="showLine(\'' + thisWord + '\')">' + formatAgain(thisWord) + '</a>' + removedContent;
                        }
                    });



///////////////// ------ start: word label adjustment

            // order coordinates by coordinates[i][1]
            coordinates.sort(function (a, b) {
                return a.percent - b.percent;
            });


            //// find min and max in the coordinates

            var tooClose = false;

            for (var e = 0; e < coordinates.length / 2; e++) {

                var max = coordinates[coordinates.length - 1 - e].percent;
                tooClose = true;

                // if the last value is at the very bottom
                // move the word labels up
                if (max > (height - SPACE_BETWEEN_WORDS)) {
                    // move the words up from max
                    var prev = coordinates[coordinates.length - 1].percent;
                    var cur;
                    for (var k = coordinates.length - 2; k >= 0; k--) {
                        cur = coordinates[k].percent;
                        var diff = prev - cur;
                        // if the distance between words is not big enough
                        if (diff < SPACE_BETWEEN_WORDS) {
                            var upd = cur - (SPACE_BETWEEN_WORDS - diff);

                            coordinates[k].percent = upd;
                            prev = upd;
                        } else {
                            prev = cur;
                        }
                    }
                }

                else {
                    // move the words down from min
                    var prev = coordinates[0].percent;
                    var cur;
                    for (var k = 1; k < coordinates.length; k++) {
                        cur = coordinates[k].percent;
                        var diff = cur - prev;
                        if (diff < SPACE_BETWEEN_WORDS) {
                            var upd = cur + (SPACE_BETWEEN_WORDS - diff);
                            coordinates[k].percent = upd;
                            prev = upd;
                        } else {
                            prev = cur;
                        }
                    }
                }
            }

            if (tooClose) {
                aWord.selectAll(".text1")
                        .attr("transform", function (d) {

                            var thisName = this.__data__.name;
                            var wordObj;

                            for (var t = 0; t < coordinates.length; t++) {
                                if (coordinates[t].name === thisName) {
                                    wordObj = coordinates[t];
                                }
                            }

                            return "translate(" + (width + 10) + "," + wordObj.percent + ")";
                        });
            }
//////////////// ------ end: word label adjustment


            // add data points
            addDataPointsStats(smoothParam);
            addDataPoints();

            // if the current state is 'dots shown' (i.e. the button reads 'hide data points')
            if ((hideOrShowLength === 0) || (hideOrShowText.indexOf("hide") > 0)) {

                // "hide/show data points" text/button
                svg.append("g")
                        .attr("class", "hideDots")
                        .append("text")
                        .attr("transform", "translate(2,-10)")
                        .text("\u24E7 hide data points")
                        .on("click", function () {
                            // if the current state is 'shown'
                            if ((this.textContent).indexOf("hide") > 0) {
                                this.textContent = "\u24DE show data points";

                                svg.selectAll(".dots").selectAll(".dot").style("visibility", "hidden");
                            }
                            // if the current state is 'hidden'
                            else {
                                this.textContent = "\u24E7 hide data points";
                                var currentWords = findCurrentWords();
                                for (var i = 0; i < currentWords.length; i++) {
                                    var dots = (currentWords[i].getElementsByClassName("dots")[0]).childNodes;
                                    for (var j = 0; j < dots.length; j++) {
                                        dots[j].style.visibility = "visible";
                                    }
                                }
                            }
                            ;
                        });

            }
            // if the current state is 'dots hidden' (i.e. the button reads 'show data points')
            else {
                if (hideOrShowText.indexOf("show") > 0) {
                    // hide the dots
                    svg.selectAll(".dots").selectAll(".dot").style("visibility", "hidden");
                }
                // "hide/show data points" text/button
                svg.append("g")
                        .attr("class", "hideDots")
                        .append("text")
                        .attr("transform", "translate(2,-10)")
                        .text("\u24DE show data points")
                        .on("click", function () {
                            // if the current state is 'shown'
                            if ((this.textContent).indexOf("hide") > 0) {
                                this.textContent = "\u24DE show data points";

                                svg.selectAll(".dots").selectAll(".dot").style("visibility", "hidden");
                            }
                            // if the current state is 'hidden'
                            else {
                                this.textContent = "\u24E7 hide data points";
                                var currentWords = findCurrentWords();
                                for (var i = 0; i < currentWords.length; i++) {
                                    var dots = (currentWords[i].getElementsByClassName("dots"))[0].childNodes;
                                    for (var j = 0; j < dots.length; j++) {
                                        dots[j].style.visibility = "visible";
                                    }
                                }
                            }
                            ;
                        });
            }

            // hide the lines that have been removed in this session
            if (!passedFromShowGraph) {
                var wordList = aWord[0];
                // for every word:
                for (var w = 0; w < wordList.length; w++) {
                    // hide if it is in removedLinesArray
                    if (_.contains(removedLinesArray, wordList[w].id)) {
                        wordList[w].style.visibility = "hidden";
                        var dots = wordList[w].lastChild.childNodes;
                        for (var j = 0; j < dots.length; j++) {
                            dots[j].style.visibility = "hidden";
                        }
                        // TODO: check if it works with pos and lemmas
                    }
                }
            }
        }
    }

    else if ((param === null) || (param < 0)) {
        // change into a nice alert? (tooltip / pop-over)
        alert("This parameter has to be a number greater or equal to 0.");
    }
}
;


function addDataPointsStats(smoothParam) {

    // variables
    var aWord = svg.selectAll(".word");
    var rectStats = svg.selectAll(".rectStats");


    /////////////// begin: statistics (fluct dots)
    if (selectVal === "sign_fluct") {

        hideAlert("alertStatistics");


        $('html, body').animate({
            scrollTop: $("#heading").offset().top
        }, 300);

        /////// add extra circles/dots with tooltips for HIGH frequencies

        var prefixHigh = "high";

        aWord.append("g")
                .attr("class", "dots-high");
        aWord.selectAll(".dots-high")
                .selectAll(".dot-high")
                .data(function (d) {

                    if (d[prefixHigh + smoothParam]) {
                        hideAlert("alertStatistics");

                        var w = this.parentNode.parentNode.id;

                        return d[prefixHigh + smoothParam].filter(function (d, k) {
                            return (data[k].date === d.date && data[k][w + "_" + prefixHigh + smoothParam] !== "");
                        });

                    } else {
                        if (d[prefixLow + smoothParam]) {
                            // show alertStatistics
                            var msg = "NOT ENOUGH DATA for statistical analysis. <br/> Please, provide a longer period of time <br/> or choose a smaller smoothing parameter.";
                            showAlert("alertStatistics", msg);
                            $('html, body').animate({
                                scrollTop: $("#graphArea").offset().top
                            }, 300);
                        }

                        return [];
                    }
                })
                .enter().append("circle")
                .attr("class", "dot-high")
                .attr("r", 8)
                .attr("cx", xMap)
                .attr("cy", yMap)
                .style("fill", function (d, i) {
                    var col = this.parentNode.parentNode.childNodes[0].attributes[2].value;

                    if (col.indexOf("rgb") > 0) {
                        col = col.substring(col.indexOf("rgb"), col.indexOf(")") + 1);
                    } else {
                        col = col.substring(col.indexOf("#") + 1, col.indexOf(";"));
                    }

                    return col;
                })
//                        .style("opacity", 0.6)
                .on("mouseover", function (d) {
                    var span = smoothParam;
                    if (!clicked) {
                        // calculate the start and end dates of the significant span

                        var curDate = xValue(d);
                        var startDate = d3.time.day.offset(curDate, -span);
                        var endDate = d3.time.day.offset(curDate, span);

                        curDate = ddmmyyyyFormat(curDate);
                        startDate = ddmmyyyyFormat(startDate);
                        endDate = ddmmyyyyFormat(endDate);

                        var tooltipHTMLHigh = "<strong>high frequency</strong> <br/>";
                        if (span === 0) {
                            tooltipHTMLHigh += curDate;
                        } else {
                            tooltipHTMLHigh += startDate + " - " + endDate;
                        }
                        toolTip.transition()
                                .duration(100)
                                .style("opacity", 1);
                        toolTip.html(formatAgain(formatName(this.parentNode.parentNode.__data__.name)) + "<br/>" + tooltipHTMLHigh)
                                .style("left", (d3.event.pageX + 5) + "px")
                                .style("top", (d3.event.pageY - 40) + "px");

                    }

                    // assign x and width to the rectangle
                    // show rectangle

                    if (smoothParam === 0) {
                        span = 0.5;
                    }

                    var startX = xMap(d) - span * (width / NUM_DAYS); // top left starting point
                    var w = span * 2 * (width / NUM_DAYS);
                    // fit the rectStats width into the width of graphArea
                    if (w > width) { // in case of a big parameter
                        startX = 0;
                        w = width;
                    }
                    if (startX < 0) { // in case the rect goes beyond graphArea on the left
                        w = w - Math.abs(startX);
                        startX = 0;
                    }
                    if ((startX + w) > width) { // in case the rect goes beyond graphArea on the right
                        w = width - startX;
                    }

                    var col = this.parentNode.parentNode.childNodes[0].attributes[2].value;

                    if (col.indexOf("rgb") > 0) {
                        col = col.substring(col.indexOf("rgb"), col.indexOf(")") + 1);
                    } else {
                        col = col.substring(col.indexOf("#") + 1, col.indexOf(";"));
                    }

                    rectStats.attr("x", startX)
                            .attr("width", w)
                            .style("fill", col)
                            .style("visibility", "visible");

                })
                .on("mouseout", function (d) {
                    if (!clicked) {
                        // hide tooltip and line
                        hideTooltip();
                    }
                    rectStats.style("visibility", "hidden");
                })
                ;



        /////// add extra circles/dots with tooltips for LOW frequencies

        var prefixLow = "low";

        // dots for low frequency - colored background
        aWord.append("g")
                .attr("class", "dots-low-bg");
        aWord.selectAll(".dots-low-bg")
                .selectAll(".dot-low-bg")
                .data(function (d) {

                    if (d[prefixLow + smoothParam]) {
                        hideAlert("alertStatistics");

                        var w = this.parentNode.parentNode.id;
                        return d[prefixLow + smoothParam].filter(function (d, k) {
                            return (data[k].date === d.date && data[k][w + "_" + prefixLow + smoothParam] !== "");
                        });
                    } else {
                        return [];
                    }
                })
                .enter().append("circle")
                .attr("class", "dot-low-bg")
                .attr("r", 8)
                .attr("cx", xMap)
                .attr("cy", yMap)
                .style("fill", function (d, i) {
                    var col = this.parentNode.parentNode.childNodes[0].attributes[2].value;

                    if (col.indexOf("rgb") > 0) {
                        col = col.substring(col.indexOf("rgb"), col.indexOf(")") + 1);
                    } else {
                        col = col.substring(col.indexOf("#") + 1, col.indexOf(";"));
                    }

                    return col;
                })
                .on("mouseover", function (d) {
                    var span = smoothParam;
                    if (!clicked) {

                        // calculate the start and end dates of the significant span
                        var curDate = xValue(d);
                        var startDate = d3.time.day.offset(curDate, -span);
                        var endDate = d3.time.day.offset(curDate, span);

                        curDate = ddmmyyyyFormat(curDate);
                        startDate = ddmmyyyyFormat(startDate);
                        endDate = ddmmyyyyFormat(endDate);

                        var tooltipHTMLLow = "<strong>low frequency </strong><br/>";
                        if (span === 0) {
                            tooltipHTMLLow += curDate;
                        } else {
                            tooltipHTMLLow += startDate + " - " + endDate;
                        }
                        toolTip.transition()
                                .duration(100)
                                .style("opacity", 1);
                        toolTip.html(formatAgain(formatName(this.parentNode.parentNode.__data__.name)) + "<br/>" + tooltipHTMLLow)
                                .style("left", (d3.event.pageX + 5) + "px")
                                .style("top", (d3.event.pageY - 40) + "px");

                        // assign x and width to the rectangle
                        // show rectangle

                        if (smoothParam === 0) {
                            span = 0.5;
                        }

                        var startX = xMap(d) - span * (width / NUM_DAYS); // top left starting point
                        var w = span * 2 * (width / NUM_DAYS);
                        // fit the rectStats width into the width of graphArea
                        if (w > width) { // in case of a big parameter
                            startX = 0;
                            w = width;
                        }
                        if (startX < 0) { // in case the rect goes beyond graphArea on the left
                            w = w - Math.abs(startX);
                            startX = 0;
                        }
                        if ((startX + w) > width) { // in case the rect goes beyond graphArea on the right
                            w = width - startX;
                        }

                        var col = this.parentNode.parentNode.childNodes[0].attributes[2].value;

                        if (col.indexOf("rgb") > 0) {
                            col = col.substring(col.indexOf("rgb"), col.indexOf(")") + 1);
                        } else {
                            col = col.substring(col.indexOf("#") + 1, col.indexOf(";"));
                        }

                        rectStats.attr("x", startX)
                                .attr("width", w)
                                .style("fill", col)
                                .style("visibility", "visible");

                    }
                })
                .on("mouseout", function (d) {
                    if (!clicked) {
                        // hide tooltip and line
                        hideTooltip();
                    }
                    rectStats.style("visibility", "hidden");
                })
                ;

        // dots for low frequency - white foreground
        aWord.append("g")
                .attr("class", "dots-low-fg");
        aWord.selectAll(".dots-low-fg")
                .selectAll(".dot-low-fg")
                .data(function (d) {

                    if (d[prefixLow + smoothParam]) {
                        hideAlert("alertStatistics");

                        var w = this.parentNode.parentNode.id;
                        return d[prefixLow + smoothParam].filter(function (d, k) {
                            return (data[k].date === d.date && data[k][w + "_" + prefixLow + smoothParam] !== "");
                        });
                    } else {
                        return [];
                    }
                })
                .enter().append("circle")
                .attr("class", "dot-low-fg")
                .attr("r", 6)
                .attr("cx", xMap)
                .attr("cy", yMap)
                .style("fill", "white")
                .on("mouseover", function (d) {
                    var span = smoothParam;
                    if (!clicked) {

                        // calculate the start and end dates of the significant span
                        var curDate = xValue(d);
                        var startDate = d3.time.day.offset(curDate, -span);
                        var endDate = d3.time.day.offset(curDate, span);

                        curDate = ddmmyyyyFormat(curDate);
                        startDate = ddmmyyyyFormat(startDate);
                        endDate = ddmmyyyyFormat(endDate);

                        var tooltipHTMLLow = "<strong>low frequency</strong> <br/>";
                        if (span === 0) {
                            tooltipHTMLLow += curDate;
                        } else {
                            tooltipHTMLLow += startDate + " - " + endDate;
                        }

                        toolTip.transition()
                                .duration(100)
                                .style("opacity", 1);
                        toolTip.html(formatAgain(formatName(this.parentNode.parentNode.__data__.name)) + "<br/>" + tooltipHTMLLow)
                                .style("left", (d3.event.pageX + 5) + "px")
                                .style("top", (d3.event.pageY - 40) + "px");


                        if (smoothParam === 0) {
                            span = 0.5;
                        }

                        var startX = xMap(d) - span * (width / NUM_DAYS); // top left starting point
                        var w = span * 2 * (width / NUM_DAYS);
                        // fit the rectStats width into the width of graphArea
                        if (w > width) { // in case of a big parameter
                            startX = 0;
                            w = width;
                        }
                        if (startX < 0) { // in case the rect goes beyond graphArea on the left
                            w = w - Math.abs(startX);
                            startX = 0;
                        }
                        if ((startX + w) > width) { // in case the rect goes beyond graphArea on the right
                            w = width - startX;
                        }

                        var col = this.parentNode.parentNode.childNodes[0].attributes[2].value;

                        if (col.indexOf("rgb") > 0) {
                            col = col.substring(col.indexOf("rgb"), col.indexOf(")") + 1);
                        } else {
                            col = col.substring(col.indexOf("#") + 1, col.indexOf(";"));
                        }

                        rectStats.attr("x", startX)
                                .attr("width", w)
                                .style("fill", col)
                                .style("visibility", "visible");

                    }
                })
                .on("mouseout", function (d) {
                    if (!clicked) {
                        // hide tooltip and line
                        hideTooltip();
                    }
                    rectStats.style("visibility", "visible");
                })
                ;
                
        if ((document.getElementsByClassName("dot-high").length === 0) && (document.getElementsByClassName("dot-low-bg").length === 0)) {
            var msg = "No statistically significant fluctuations for this level of smoothing. Try selecting another one or provide a longer period of time.";
            showAlert("alertStatistics", msg);
        }
    }

///////////////////// end: statistics (fluct dots)



}
;




function addDataPoints() {
    var aWord = svg.selectAll(".word");

    // add circles/dots with tooltips
    aWord.append("g")
            .attr("class", "dots");
    aWord.selectAll(".dots")
            .selectAll(".dot")
            .data(function (d, i) {
                return (words[i].smooth0).filter(function (d, j) {

                    var current_author = []
                    for (var l = 0; l < AUTHORS.length; l++) {
                        if (((words[i].name).indexOf("_" + AUTHORS[l]) > 0) && (!_.contains(current_author, AUTHORS[l]))) {
                            current_author.push(AUTHORS[l]);
                        }
                    }

                    if (current_author.length === 1) {
                        return (data[j].date === d.date && data[j][current_author + "_PerCent"] !== 0);
                    } else if (current_author.length === 0) {
                        return (data[j].date === d.date && data[j]["all_PerCent"] !== 0);
                    } else {
                        alert("Error line 887 WordVizFunctions!");
                    }
                });
            })
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("stroke", function (d, i) {
                var col = this.parentNode.parentNode.childNodes[0].attributes[2].value;

                if (col.indexOf("rgb") > 0) {
                    col = col.substring(col.indexOf("rgb"), col.indexOf(")") + 1);
                } else {
                    col = col.substring(col.indexOf("#") + 1, col.indexOf(";"));
                }

                return col;
            })
            .on("mouseover", function (d) {
                if (!clicked) {
                    tmpLine.attr("y1", yMap(d) + 44)
                            .attr("y2", yMap(d) + 44)
                            .style("stroke", "lightgray")
                            .style("stroke-width", 1)
                            .style("opacity", 1);

                    toolTip.transition()
                            .duration(100)
                            .style("opacity", 1);
                    toolTip.html(formatAgain(formatName(this.parentNode.parentNode.__data__.name)) + "<br/>" + printDate(xValue(d))
                            + "<br/>" + yValue(d))
                            .style("left", (d3.event.pageX + 5) + "px")
                            .style("top", (d3.event.pageY - 40) + "px");

                }
            })
            .on("mouseout", function (d) {
                if (!clicked) {
                    // hide tooltip and line
                    hideTooltip();
                }
            })
            // show full info on click + leave the opacity at 1
            // show context at the bottom
            .on("click", function (d, i) {
                if (!clicked) {
                    tmpLine.attr("y1", yMap(d) + 44)
                            .attr("y2", yMap(d) + 44)
                            .style("stroke", "lightgray")
                            .style("stroke-width", 1)
                            .style("opacity", 1);
                    toolTip.transition()
                            .duration(100)
                            .style("opacity", 1);
                    toolTip.html(formatAgain(formatName(this.parentNode.parentNode.__data__.name)) + "<br/>" + printDate(xValue(d)) + "<br/>"
                            + yValue(d))
                            .style("left", (d3.event.pageX + 5) + "px")
                            .style("top", (d3.event.pageY - 40) + "px");

                    // show context
                    var ngram = formatAgain(formatName(this.parentNode.parentNode.__data__.name));
                    var thisDate = d.date;

                    var col = this.parentNode.parentNode.childNodes[0].attributes[2].value;
                    if (col.indexOf("rgb") > 0) {
                        col = col.substring(col.indexOf("rgb"), col.indexOf(")") + 1);
                    } else {
                        col = col.substring(col.indexOf("#") + 1, col.indexOf(";"));
                    }

                    this.style.strokeWidth = "3.5px";
                    this.style.fill = col;

                    showContext(ngram, thisDate, col);
                    clicked = true;

                    $('html, body').animate({
                        scrollTop: $("#lowRow").offset().top - 100
                    }, 300);
                }
                else {
                    hideTooltip();
                }
            });
}