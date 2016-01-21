/*
 Copyright (c) [2014] [Todorova V]
 */


/*
 * Tool to calculate and smooth relative token frequencies
 */

// array of Day objects
var DATA_BY_DATE = new Array();

var AUTHORS = null; // the names of the authors, sorted alphabetically
var TSV_ARRAY = []; // the tsv two dimentional array

// collection of documents that lack some annotation
// this is for the alerts that say if some annotation layer is missing
var BAD_DOCS = null;

// stores the queries from the current session
var QUERIES = null;

var NUM_DAYS = 0;
/*
 * Loads the selested corpus
 * @param {type} corpus corpus to load
 */
function loadCorpus(corpus) {
    BAD_DOCS = new MissingAnnotations();
    DATA_BY_DATE = new Array();
    var num_files = corpus.length;
    var removed = [];
    // loop through all the files in the corpus and fill the information into the dataByDay array
    for (var i = 0; i < num_files; i++) {
        var ind_file = corpus[i];
        var file_name = ind_file.name;
        var xml = loadXML(ind_file);
        var date = getDate(xml);
        var author_name = getAuthor(xml);
        var the_letter = new Letter(file_name, xml);
        if (date !== null && author_name !== null) { // leaving the letter without a date out
            var num_tokens = the_letter.tokens.length;
            var index = 0;
            // check if the date already is present in the dataByDay array
            var date_is_new = true;
            while (index < DATA_BY_DATE.length && date_is_new) {
                if (!(DATA_BY_DATE[index].date > date || DATA_BY_DATE[index].date < date)) {
                    date_is_new = false;
                    DATA_BY_DATE[index].letters.push(the_letter);
                    DATA_BY_DATE[index].tokens += num_tokens;
                    DATA_BY_DATE[index].weight = Math.sqrt(DATA_BY_DATE[index].tokens);
                    // check if the author is already there
                    var aut = 0;
                    var author_is_new = true; // the index of the author in the author array
                    while (aut < DATA_BY_DATE[index].authors.length && author_is_new) {
                        if (DATA_BY_DATE[index].authors[aut].name === author_name) {
                            author_is_new = false;
                            DATA_BY_DATE[index].authors[aut].tokens += num_tokens;
                            DATA_BY_DATE[index].authors[aut].weight = Math.sqrt(DATA_BY_DATE[index].authors[aut].tokens);
                            DATA_BY_DATE[index].authors[aut].letters.push(the_letter);
                        }
                        aut++;
                    }
                    if (author_is_new) {
                        var author_of_letter = new Author(author_name, [the_letter], num_tokens);
                        DATA_BY_DATE[index].authors.push(author_of_letter);
                    }
                }
                index++;
            }
            if (date_is_new) {
                var author_of_letter = new Author(author_name, [the_letter], num_tokens);
                DATA_BY_DATE[index] = new Day(date, [the_letter], num_tokens, [author_of_letter]);
            }
            // if only author is not there
        } else if (date !== null) {
            // TO DO add alert for missing author!
            BAD_DOCS.missing_subset.push(file_name);
            var num_tokens = the_letter.tokens.length;
            var index = 0;
            // check if the date already is present in the dataByDay array
            var date_is_new = true;
            while (index < DATA_BY_DATE.length && date_is_new) {
                if (!(DATA_BY_DATE[index].date > date || DATA_BY_DATE[index].date < date)) {
                    date_is_new = false;
                    DATA_BY_DATE[index].letters.push(the_letter);
                    DATA_BY_DATE[index].tokens += num_tokens;
                    DATA_BY_DATE[index].weight = Math.sqrt(DATA_BY_DATE[index].tokens);
                }
                index++;
            }
            if (date_is_new) {
                DATA_BY_DATE
                DATA_BY_DATE[index] = new Day(date, [the_letter], num_tokens, null);
            }
        } else {
            // if author or date can not be read from the file
            BAD_DOCS.missing_date.push(file_name);
            removed.push(file_name);
        }
    }
    var removed_string = "";
    for (var t = 0; t < removed.length; t++) {
        removed_string += removed[t] + "<br>";
    }
    formatIssuesAllert(removed, removed_string);
    // sort the data by Date Array
    DATA_BY_DATE.sort(compareByDate);
    // for highlighting
    addIndices();
    // add dates where there are gaps
    getGaps();
    // add missing authors
    addMissingAuthors();
    // sort the author arrays
    for (var d = 0; d < DATA_BY_DATE.length; d++) {
        if (DATA_BY_DATE[d].authors !== null) {
            DATA_BY_DATE[d].authors.sort(compareByName);
        }
    }
    // fill in the tsv array
    fillGeneral();
    // count the number of days the corpus covers
    if (DATA_BY_DATE.length > 0) {
        NUM_DAYS = Math.abs((DATA_BY_DATE[DATA_BY_DATE.length - 1].date - DATA_BY_DATE[0].date) / 86400000);
    } else {
        NUM_DAYS = 0;
    }

}

/*
 * Takes an array of queries and creates a tsv string containing information about
 * their frequency
 * @param {array} word_lists the queries
 * @param {array} parameter the customized smoothing parameter
 */
function makeTSV(word_lists) {
    QUERIES = new Array();
    for (var w = 0; w < word_lists.length; w++) {
        if (word_lists[w] !== null) {
            var search_words = word_lists[w];
            for (var i = 0; i < search_words.length; i++) {
                var the_query = new Query(search_words[i], w - 1);
                QUERIES.push(the_query);
                // the w shows if we search in the whole corpus or by author (w = autInd+1)
                if (w <= 0) {
                    // check history so that _# and _smooth0 are not repeated
                    if (TSV_ARRAY[0].indexOf(the_query.input + "_#") < 0 && TSV_ARRAY[0].indexOf(the_query.input + "_smooth0") < 0) {
                        countOccurrences(the_query);
                        fillFrequencies(the_query.input); // fills in the tsv array and gives values to the frequency property
                    }
                } else {
                    if (TSV_ARRAY[0].indexOf(the_query.input + "_" + AUTHORS[the_query.subset] + "_#") < 0 &&
                            TSV_ARRAY[0].indexOf(the_query.input + "_" + AUTHORS[the_query.subset] + "_smooth0") < 0) {
                        countOccurrences(the_query);
                        countLetters(the_query.subset);
                        fillFrequenciesByAuthor(the_query.input, w - 1);
                    }
                }
            }
        }
    }
//    // for testing:
//    smooth(3);
//    smooth(15);
//    smooth(45);
//    smooth(182);
//    significantFluctuations(3);
//    significantFluctuations(15);
//    significantFluctuations(45);
//    significantFluctuations(182);
//    significantDifferences(3);
//    significantDifferences(15);
//    significantDifferences(45);
//    significantDifferences(182);
//    //
    var tsv_string = tsvArrayToString();
//    console.log(tsv_string); // for testing 
    return tsv_string;
}



// The function that has to be called on click on a smooth button
function smooth(parameter) {
    for (var q = 0; q < QUERIES.length; q++) {
        var the_query = QUERIES[q];
        if (the_query.subset >= 0) {
            smoothByAuthor(the_query.input, parameter, the_query.subset, the_query.items.length);
        } else {
            smoothWholeCorpus(the_query.input, parameter, the_query.items.length);
        }
    }
    var tsv_string = tsvArrayToString();
    return tsv_string;
}


// helper functions

/*
 * Load xml document from an xml file
 * @param {File} aFile
 * @returns {Document|Node} xml document
 */
function loadXML(aFile) {
    var objectURL = window.URL.createObjectURL(aFile);
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", objectURL, false); // asynch.
    xhttp.send();
    return xhttp.responseXML;
}

/*
 * Finds the date on which a letter was written
 * @param {xmlDOM Object} anXML
 * @returns {Date} the date of writing the letter or NULL if no date provided
 */
function getDate(xml) {
    var date = null;
    try {
        var detector = new DateDetector();
        if (detector.property !== null) {
            var date = xml.getElementsByTagName(detector.tag)[0].getAttribute(detector.property).trim();
        } else {
            var date = xml.getElementsByTagName(detector.tag)[0].childNodes[0].nodeValue.trim();
        }
    } finally {
        if (date <= 0 || isNaN(Date.parse(date))) {
            return null;
        }
    }
    return new Date(date);
}

/*
 * Finds the name of the author of the letter
 * @param {type} anXML
 * @returns {String} the name of the author of the letter
 */
function getAuthor(xml) {
    var author_name = null;
    try {
        var detector = new SubsetDetector();
        if (detector.property !== null) {
            author_name = xml.getElementsByTagName(detector.tag)[0].getAttribute(detector.property).trim();
        } else {
            author_name = xml.getElementsByTagName(detector.tag)[0].childNodes[0].nodeValue.trim();
        }
    } finally {
        if (author_name <= 0) {
            return null;
        }
    }
    var tmp_name;
    // Symbols to be excluded to prevent HTML conflicts
    var symbols = ["'", '"', ".", ",", ":", ";", "!"]; // punctuation should be removed
    for (var s = 0; s < symbols.length; s++) {
        while (author_name.indexOf(symbols[s]) >= 0) {
            tmp_name = author_name.replace(symbols[s], '');
            author_name = tmp_name;
        }
    }
    // spaces should be removed too
    tmp_name = author_name.trim().replace(/\s+/g, '');
    author_name = tmp_name;
    // and ? are replaced with -quessertable
    tmp_name = author_name.trim().replace(/\?/g, "QUESSERTABLE");
    author_name = tmp_name;
    return author_name;
}

/*
 * Compare function for day objects
 * @param {day} a
 * @param {day} b
 * @returns {Number}
 */
function compareByDate(a, b) {
    if (a.date < b.date)
        return -1;
    if (a.date > b.date)
        return 1;
    return 0;
}

function getGaps() {
    for (var i = 0; i < DATA_BY_DATE.length - 1; i++) {
        var time1 = DATA_BY_DATE[i].date.getTime();
        var time2 = DATA_BY_DATE[i + 1].date.getTime();
        var daysBetween = (time2 - time1) / 86400000; // sorted, no need for abs, TODO!! hours must be fixed if different
        DATA_BY_DATE[i].gap = daysBetween;
    }
}

/*
 * GIves the next day
 * @param {Date} aDate
 * @returns {Date} the next day
 */
function getNextDate(date) {
    date.setTime(date.getTime() + 86400000); // going a day ahead in milliseconds
    return new Date(date.toString());
}

/*
 * Makes sure there is object for each author in every day
 */
function addMissingAuthors() {
    var author_names = getNamesOfAuthors();
    for (var i = 0; i < DATA_BY_DATE.length; i++) {
        if (DATA_BY_DATE[i].authors === null) { // if there are no letters in this day
            DATA_BY_DATE[i].authors = new Array();
            for (var n = 0; n < author_names.length; n++) {
                DATA_BY_DATE[i].authors.push(new Author(author_names[n], null, 0));
            }
        } else { // if there are some letters in this day
            for (var n = 0; n < author_names.length; n++) {
                var name_is_there = false;
                for (var a = 0; a < DATA_BY_DATE[i].authors.length; a++) {
                    if (author_names[n] === DATA_BY_DATE[i].authors[a].name) {
                        name_is_there = true;
                    }
                }
                if (!name_is_there) {
                    DATA_BY_DATE[i].authors.push(new Author(author_names[n], null, 0));
                }
            }
        }
    }
}

/*
 * Gives the names of the authors in the corpus
 * @returns {Array of Strings} the names of all the authors of texts in the corpus
 */
function getNamesOfAuthors() {
    var authors = new Array();
    for (var i = 0; i < DATA_BY_DATE.length; i++) {
        if (DATA_BY_DATE[i].authors !== null) {
            for (var a = 0; a < DATA_BY_DATE[i].authors.length; a++) {
                if (authors.indexOf(DATA_BY_DATE[i].authors[a].name) < 0) {
                    authors.push(DATA_BY_DATE[i].authors[a].name);
                }
            }
        }
    }
    authors = authors.sort();
    AUTHORS = authors;
    return authors;
}

/*
 * Compares authors by name
 * @param {author} a
 * @param {author} b
 * @returns {Number}
 */
function compareByName(a, b) {
    if (a.name < b.name)
        return -1;
    if (a.name > b.name)
        return 1;
    // a must be equal to b
    return 0;
}

/*
 * Fills the general information about the data in the corpus in a tsv array
 * @returns {Array} an array of strings in tsv format
 */
function fillGeneral() {
    TSV_ARRAY = new Array(DATA_BY_DATE.length + 1);
    for (var t = 0; t < TSV_ARRAY.length; t++) {
        TSV_ARRAY[t] = [];
    }
    TSV_ARRAY[0].push("date_All");
    TSV_ARRAY[0].push("all_PerCent");
    TSV_ARRAY[0].push("all_Num");
    var authors = AUTHORS;
    for (var a = 0; a < authors.length; a++) {
        TSV_ARRAY[0].push(authors[a] + "_PerCent");
        TSV_ARRAY[0].push(authors[a] + "_Num");
    }
    var most_tokens = findMost(); // finding number of tokens in the day [0] and each author [1,..] with most data
    for (var i = 0; i < DATA_BY_DATE.length; i++) {
        // filling the lines
        var year = DATA_BY_DATE[i].date.getFullYear();
        var month = DATA_BY_DATE[i].date.getMonth() + 1;
        if (month < 10) {
            month = "0" + month;
        }
        var day = DATA_BY_DATE[i].date.getDate();
        TSV_ARRAY[i + 1].push(year + "" + month + "" + day); // date
        // % transparency for the background
        var transparency_corpus = Math.round(100 * (DATA_BY_DATE[i].tokens / most_tokens[0]));
        TSV_ARRAY[i + 1].push(transparency_corpus);
        TSV_ARRAY[i + 1].push(DATA_BY_DATE[i].tokens);
        for (var a = 0; a < authors.length; a++) {
            var tokens_by_author = DATA_BY_DATE[i].authors[a].tokens; // the authors are always sorted alphabetically
            var transparency_by_author = Math.round(100 * (tokens_by_author / most_tokens[a + 1]));
            TSV_ARRAY[i + 1].push(transparency_by_author);
            TSV_ARRAY[i + 1].push(tokens_by_author);
        }
    }
}

/*
 * Counts the occurrences of a word and fills the number in the dataByDay occurrences property
 * @param {string} word
 */

/*
 * Counts the occurrences of a word and fills the number in the dataByDay occurrences property
 * @param {Query} query the query object
 * @param {number} query_index either the index of the author+1, or 0 for the whole corpus
 */
function countOccurrences(query) {
    var search_word = query.items[0].content; // this is a RE
    // count the occurrences in the whole corpus
    if (query.subset === -1) {
        // count the occurences in the whole corpus
        for (var i = 0; i < DATA_BY_DATE.length; i++) {
            // first clear the occurences
            DATA_BY_DATE[i].occurrences = 0;
            if (DATA_BY_DATE[i].letters !== null) {
                for (var x = 0; x < DATA_BY_DATE[i].letters.length; x++) {
                    // indexes for highlighting
                    var indices = [];
                    DATA_BY_DATE[i].letters[x].occurrences = 0;
                    // TO DO make lemmas and tags optional
                    var tokens = DATA_BY_DATE[i].letters[x].tokens;
                    var lemmas = DATA_BY_DATE[i].letters[x].lemmas;
                    var pos = DATA_BY_DATE[i].letters[x].tags;
                    for (var c = 0; c < tokens.length; c++) {
                        if (query.items[0].lemma) { // if the query is for lemmas
                            var corpus_word = lemmas[c];
                        } else { // if the query is for a particular form
                            var corpus_word = tokens[c];
                        }
                        // to find our word
                        if (findMatch(search_word, corpus_word)) {
                            if (findMatch(query.items[0].pos, pos[c])) {
                                var n_gram_found = true;
                                // indexes for highlighting
                                var ind_to_start = c;
                                // continue for the other elements of the n-gram
                                var n = 1;
                                while (n < query.items.length && n_gram_found) {
                                    if ((c + n) >= tokens.length) {
                                        n_gram_found = false;
                                    } else if (query.items[n].lemma && !findMatch(query.items[n].content, lemmas[c + n])) {
                                        n_gram_found = false;
                                    } else if (!query.items[n].lemma && !findMatch(query.items[n].content, tokens[c + n])) {
                                        n_gram_found = false;
                                    } else if (!findMatch(query.items[n].pos, pos[c + n])) {
                                        n_gram_found = false;
                                    }
                                    n++;
                                }
                                if (n_gram_found) {
                                    // indexes for highlighting
                                    var ind_to_end = c + n - 1;
                                    indices.push([ind_to_start, ind_to_end]);
                                    DATA_BY_DATE[i].letters[x].occurrences++;
                                }
                            }
                        }
                    }
                    if ((DATA_BY_DATE[i].letters[x].tokens.length - (query.items.length - 1)) > 0) {
                        DATA_BY_DATE[i].letters[x].frequency = DATA_BY_DATE[i].letters[x].occurrences / (DATA_BY_DATE[i].letters[x].tokens.length - (query.items.length - 1));
                    } else if (DATA_BY_DATE[i].letters[x].tokens.length < 1) {
                        DATA_BY_DATE[i].letters[x].frequency = null;
                    } else {
                        DATA_BY_DATE[i].letters[x].frequency = 0;
                    }
                    // indexes for highlighting
                    DATA_BY_DATE[i].letters[x].highlights.push(new Highlight(query.input, indices));
                    // the day frequency
                    DATA_BY_DATE[i].occurrences += DATA_BY_DATE[i].letters[x].occurrences;
                }
            }
            if ((DATA_BY_DATE[i].tokens - (query.items.length - 1)) > 0) {
                DATA_BY_DATE[i].frequency = DATA_BY_DATE[i].occurrences / (DATA_BY_DATE[i].tokens - DATA_BY_DATE[i].letters.length * (query.items.length - 1));
            } else if (DATA_BY_DATE[i].tokens < 1) {
                DATA_BY_DATE[i].frequency = null;
            } else {
                DATA_BY_DATE[i].frequency = 0;
            }
        }

    } else { // count the occurrences in a subset of the corpus
        var occs = []; // to store and memorize the occurrences
        var freqs = []; // to store and memorize the frequences
        for (var i = 0; i < DATA_BY_DATE.length; i++) {
            // count the occurences for the individual authors
            var a = query.subset; // author index
            DATA_BY_DATE[i].authors[a].occurrences = 0;
            // first clear the occurencies
            if (DATA_BY_DATE[i].authors[a].letters !== null) {
                for (var x = 0; x < DATA_BY_DATE[i].authors[a].letters.length; x++) {
                    var indices = []; // indexes for highlighting
                    DATA_BY_DATE[i].authors[a].letters[x].occurrences = 0;
                    // TO DO make lemmas and tags optional
                    var tokens = DATA_BY_DATE[i].authors[a].letters[x].tokens;
                    var lemmas = DATA_BY_DATE[i].authors[a].letters[x].lemmas;
                    var pos = DATA_BY_DATE[i].authors[a].letters[x].tags;
                    for (var c = 0; c < tokens.length; c++) {
                        if (query.items[0].lemma) { // if the query is for lemmas
                            var corpus_word = lemmas[c];
                        } else { // if the query is for a particular form
                            var corpus_word = tokens[c];
                        }
                        // to find our word
                        if (findMatch(search_word, corpus_word)) {
                            if (findMatch(query.items[0].pos, pos[c])) {
                                var n_gram_found = true;
                                var ind_to_start = c; // indexes for highlighting
                                // continue for the other elements of the n-gram
                                var n = 1;
                                while (n < query.items.length && n_gram_found) {
                                    if ((c + n) >= tokens.length) {
                                        n_gram_found = false;
                                    } else if (query.items[n].lemma && !findMatch(query.items[n].content, lemmas[c + n])) {
                                        n_gram_found = false;
                                    } else if (!query.items[n].lemma && !findMatch(query.items[n].content, tokens[c + n])) {
                                        n_gram_found = false;
                                    } else if (!findMatch(query.items[n].pos, pos[c + n])) {
                                        n_gram_found = false;
                                    }
                                    n++;
                                }
                                if (n_gram_found) {
                                    var ind_to_end = c + n - 1; // indexes for highlighting
                                    indices.push([ind_to_start, ind_to_end]); // indexes for highlighting
                                    DATA_BY_DATE[i].authors[a].letters[x].occurrences++;
                                }
                            }
                        }
                    }
                    if ((DATA_BY_DATE[i].authors[a].letters[x].tokens.length - (query.items.length - 1)) > 0) {
                        DATA_BY_DATE[i].authors[a].letters[x].frequency = DATA_BY_DATE[i].authors[a].letters[x].occurrences / (DATA_BY_DATE[i].authors[a].letters[x].tokens.length - (query.items.length - 1));
                    } else if (DATA_BY_DATE[i].authors[a].letters[x].tokens.length < 1) {
                        DATA_BY_DATE[i].authors[a].letters[x].frequency = null;
                    } else {
                        DATA_BY_DATE[i].authors[a].letters[x].frequency = 0;
                    }
                    // for highlighting
                    DATA_BY_DATE[i].authors[a].letters[x].highlights.push(new Highlight(query.input, indices));
                    // author frequencies
                    DATA_BY_DATE[i].authors[a].occurrences += DATA_BY_DATE[i].authors[a].letters[x].occurrences;
                }
            }
            occs.push(DATA_BY_DATE[i].authors[a].occurrences);
            if ((DATA_BY_DATE[i].authors[a].tokens - (query.items.length - 1)) > 0) {
                DATA_BY_DATE[i].authors[a].frequency = DATA_BY_DATE[i].authors[a].occurrences / (DATA_BY_DATE[i].authors[a].tokens - DATA_BY_DATE[i].authors[a].letters.length * (query.items.length - 1));
            } else if (DATA_BY_DATE[i].authors[a].tokens < 1) {
                DATA_BY_DATE[i].authors[a].frequency = null;
            } else {
                DATA_BY_DATE[i].authors[a].frequency = 1; // this should be checked
            }
            freqs.push(DATA_BY_DATE[i].authors[a].frequency);
        }
    }
}

/*
 *
 * @param {RE} search_word
 * @param {String} corpus_word
 * @returns {undefined}
 */
function findMatch(search_word, corpus_word) {
    var word_is_a_match = false;
    if (search_word === null) {
        word_is_a_match = true;
    } else {
        var matches = corpus_word.match(search_word);
        if (matches !== null) {
            var m = 0;
            while (m < matches.length && !word_is_a_match) {
                if (matches[m].length === corpus_word.length) {
                    word_is_a_match = true;
                }
                m++;
            }
        }
    }
    return word_is_a_match;
}

function addIndices() {
    for (var d = 0; d < DATA_BY_DATE.length; d++) {
        // first for all the letters by day
        if (DATA_BY_DATE[d].letters !== null) {
            for (var l = 0; l < DATA_BY_DATE[d].letters.length; l++) {
                if (DATA_BY_DATE[d].letters[l].text !== null) {
                    DATA_BY_DATE[d].letters[l].indices = makeIndices(DATA_BY_DATE[d].letters[l].text, DATA_BY_DATE[d].letters[l].tokens);
                } else {
                    DATA_BY_DATE[d].letters[l].indices = [];
                }
            }
        }
        // then for the letters of individual authors by day
        if (DATA_BY_DATE[d].authors !== null) {
            for (var a = 0; a < DATA_BY_DATE[d].authors.length; a++) {
                if (DATA_BY_DATE[d].authors[a].letters !== null) {
                    for (var l = 0; l < DATA_BY_DATE[d].authors[a].letters.length; l++) {
                        if (DATA_BY_DATE[d].authors[a].letters[l].text !== null) {
                            DATA_BY_DATE[d].authors[a].letters[l].indices = makeIndices(DATA_BY_DATE[d].authors[a].letters[l].text, DATA_BY_DATE[d].authors[a].letters[l].tokens);
                        } else {
                            DATA_BY_DATE[d].authors[a].letters[l].indices = [];
                        }
                    }
                }
            }
        }
    }
}

/*
 * Helper function for the addIndices() function.
 * @param {type} text the whole (well...) text of the letter
 * @param {type} tokens single tokens to get the indexes of
 * @returns {Array|makeIndices.index_array} array of arrays of the form [start index, end index] for each token
 */
function makeIndices(text, toks) {
    var index_array = [];
    var tokens = [];
    for (var i = 0; i < toks.length; i++) {
        tokens.push(toks[i]);
    }
    var start_ind = 0;
    var regex = null;
    var the_match = "";
    var end_ind = -1; //for the first token
    // characters that may mess up the reg ex
    var spec_char = ["(", ")", "[", "]", "{", "}", "+", "*", "|", "^", ".", "!", "?"];
    for (var t = 0; t < tokens.length; t++) {
        if (text.length > 0) {
            // replace \ with |
            while (tokens[t].indexOf("\\") >= 0) {
                var tmp_token = tokens[t].replace("\\", "|");
                // replace special characters with a non white space symbol
                tokens[t] = tmp_token;
            }
            for (var s = 0; s < spec_char.length; s++) {
                while (tokens[t].indexOf(spec_char[s]) >= 0) {
                    var tmp_token = tokens[t].replace(spec_char[s], "\\S");
                    // replace special characters with a non white space symbol
                    tokens[t] = tmp_token;
                }
            }
            var pattern = "\\s*" + tokens[t];
            regex = new RegExp(pattern);
            if (text.match(regex) !== null) {
                the_match = text.match(regex)[0];
                end_ind += the_match.length;
                start_ind = end_ind - (toks[t].length) + 1;
                index_array.push([start_ind, end_ind]);
                text = text.substr(the_match.length, text.length);
            } else {
                // if there are no matches, then the text must be incomplete
                // (for example containing only "yo" instead of the full form "you")
                text = "";
            }
        }
    }
    return index_array;
}
/*
 * Counts how many letters are written by this author on this day
 * @param {type} author_ind the index of the author
 * @returns {undefined}
 */
function countLetters(author_ind) {
    var letters_by_author = 0;
    var d = 0;
    while (d < DATA_BY_DATE.length && letters_by_author < 2) {
        if (DATA_BY_DATE[d].authors[author_ind].letters !== null) {
            letters_by_author++;
        }
        d++;
    }
    var author_name = getNamesOfAuthors()[author_ind];
    if (letters_by_author < 2) {
        tooFewLettersAlert(author_name);
    }
}

/*
 * Finds the number of tokens in the day with most data for the corpus as a whole and
 * for the individual authors
 * @returns {array} tokens in the day with most data for all, and for individual authors
 */
function findMost() {
    var authors = getNamesOfAuthors();
    var most = new Array(authors.length + 1);
    for (var t = 0; t < most.length; t++) {
        most[t] = 1; // we assume there is at least one token by every author
    }
    for (var i = 0; i < DATA_BY_DATE.length; i++) {
        if (most[0] < DATA_BY_DATE[i].tokens) {
            most[0] = DATA_BY_DATE[i].tokens;
        }
        for (var j = 0; j < DATA_BY_DATE[i].authors.length; j++) {
            if (most[j + 1] < DATA_BY_DATE[i].authors[j].tokens) {
                most[j + 1] = DATA_BY_DATE[i].authors[j].tokens;
            }
        }
    }
    return most;
}

/*
 * Fills the tsv Array with token frequences adding "assumed" frequences where no data
 * @param {type} tsv array of tsv lines
 * @param {type} word search word
 * @returns {undefined}
 */ function fillFrequencies(word) {
    cleanFrequencies();

    TSV_ARRAY[0].push(word + "_#"); // adding occurences
    TSV_ARRAY[0].push(word + "_smooth0"); // adding one new column
    var last_data = 0; // the index of the last day with data
    var last_frequency; // the frequency in the last day with data (the first day always has data)
    var next_data = 0;
    for (var i = 0; i < DATA_BY_DATE.length; i++) {
        if (DATA_BY_DATE[i].tokens > 0 && DATA_BY_DATE[i].frequency !== null) { // && or || or nothing???
            last_data = i;
            TSV_ARRAY[i + 1].push(DATA_BY_DATE[i].occurrences);
            last_frequency = DATA_BY_DATE[i].frequency;
            TSV_ARRAY[i + 1].push(DATA_BY_DATE[i].frequency);
            next_data = (i + 1); //the index of the next day with data
            while (next_data < DATA_BY_DATE.length && DATA_BY_DATE[next_data].tokens < 1) { // the last day has data, so we are safe with this loop
                next_data++;
            }
        } else {
            TSV_ARRAY[i + 1].push(null);
            TSV_ARRAY[i + 1].push(null);
        }
    }
}

/*
 * fillFrequencies for individual authors' graphs
 * @param {Array} tsv the tsv array where the info must be stored
 * @param {string} word the ngram for which the fillFrequencies is done
 * @param {number} ind the index of the author
 */
function fillFrequenciesByAuthor(word, ind) {
    cleanFrequencies();
    TSV_ARRAY[0].push(word + "_" + DATA_BY_DATE[0].authors[ind].name + "_#"); // occurrences column
    TSV_ARRAY[0].push(word + "_" + DATA_BY_DATE[0].authors[ind].name + "_smooth0"); // frequencies column
    var last_data = -1; // the index of the last day with data
    var next_data = 0;
    // filling in the known frequencies
    for (var i = 0; i < DATA_BY_DATE.length; i++) {
        if (DATA_BY_DATE[i].authors[ind].tokens > 0) {
            last_data = i;
            TSV_ARRAY[i + 1].push(DATA_BY_DATE[i].authors[ind].occurrences);
            TSV_ARRAY[i + 1].push(DATA_BY_DATE[i].authors[ind].frequency);
            next_data = i + 1; //the index of the next day with data
            while (next_data < DATA_BY_DATE.length && DATA_BY_DATE[next_data].authors[ind].tokens < 1) {
                next_data++;
            }
        } else {
            TSV_ARRAY[i + 1].push(null);
            TSV_ARRAY[i + 1].push(null);
        }
    }
}

/*
 * Smoothing algorithm - weighted moving average
 * @param {Array} tsv
 * @param {String} word
 * @param {Number} parameter
 * @param {Number} n like in n-gram
 */
function smoothWholeCorpus(word, parameter, n) {


// j goes through all the elements in the day array
    if (TSV_ARRAY[0].indexOf(word + "_smooth" + parameter) < 0) { // if the search is new
        TSV_ARRAY[0].push(word + "_smooth" + parameter);
        var freq_col = TSV_ARRAY[0].indexOf(word + "_smooth0"); // the column with the unsmoothed frequencies
        var frequencies_to_smooth = new Array(TSV_ARRAY.length - 1);
        for (var f = 0; f < TSV_ARRAY.length - 1; f++) {
            frequencies_to_smooth[f] = TSV_ARRAY[f + 1][freq_col];
        }
        for (var j = 0; j < DATA_BY_DATE.length; j++) {
            if (frequencies_to_smooth[j] !== null) {
                var numerator = 0; // doubly weighted frequencies
                var denominator = 0; // weighted weights
                var weight = 0; // weight for the weighted moving average
                var ind = j; // start calculations from this index
                var count = 0; // to determine the limits of the sliding window in days
                var gap_backwards = 0;
                if (ind > 0) {
                    gap_backwards = DATA_BY_DATE[ind - 1].gap;
                }
                // go back to the begining of the window 
                while (ind > 0 && count < parameter - gap_backwards) {
                    ind--;
                    count += gap_backwards;
                    if (ind > 0) {
                        gap_backwards = DATA_BY_DATE[ind - 1].gap;
                    } else {
                        gap_backwards = 0;
                    }
                }
                weight = parameter + 1 - count;
                // go right towards the center of the window
                while (ind < DATA_BY_DATE.length && weight <= parameter + 1) { // TODO check if it causes problems
                    if (frequencies_to_smooth[ind] !== null) {
                        numerator += weight * DATA_BY_DATE[ind].weight * frequencies_to_smooth[ind];
                        denominator += weight * DATA_BY_DATE[ind].weight;
                    }
                    weight += DATA_BY_DATE[ind].gap;
                    ind++;
                }
                if (ind < DATA_BY_DATE.length) {
                    // go right to the end of the window
                    weight = parameter + 1 - DATA_BY_DATE[ind - 1].gap;
                    while (ind < DATA_BY_DATE.length && weight >= 1) { // TODO check if it is ok
                        if (frequencies_to_smooth[ind] !== null) {
                            numerator += weight * DATA_BY_DATE[ind].weight * frequencies_to_smooth[ind];
                            denominator += weight * DATA_BY_DATE[ind].weight;
                        }
                        weight -= DATA_BY_DATE[ind].gap;
                        ind++;
                    }
                }
                if (denominator !== 0) {
                    TSV_ARRAY[j + 1].push(numerator / denominator);
                } else {
                    TSV_ARRAY[j + 1].push(null);
                }
            }
        }
    }
}


function readTokens(subset) {
    var toks = [];
    if (subset < 0) {
        for (var d = 0; d < DATA_BY_DATE.length; d++) {
            toks.push(DATA_BY_DATE[d].tokens);
        }
    } else {
        for (var d = 0; d < DATA_BY_DATE.length; d++) {
            toks.push(DATA_BY_DATE[d].authors[subset].tokens);
        }
    }
    return toks;
}

function readOccurrences(query) {
    var entry = query.input;
    if (query.subset >= 0) {
        entry += "_" + AUTHORS[query.subset];
    }
    var occ_entry = entry + "_#";
    var occ_index = TSV_ARRAY[0].indexOf(occ_entry);

    var occs = [];

    if (occ_index >= 0) {
        for (var f = 1; f < TSV_ARRAY.length; f++) {
            occs.push(TSV_ARRAY[f][occ_index]);
        }
    }
    return occs;
}

function readFrequencies(query, parameter) {
    var entry = query.input;
    if (query.subset >= 0) {
        entry += "_" + AUTHORS[query.subset];
    }
    var freq_entry = entry + "_smooth" + parameter;
    var freq_index = TSV_ARRAY[0].indexOf(freq_entry);

    var freqs = [];

    if (freq_index >= 0) {
        for (var f = 1; f < TSV_ARRAY.length; f++) {
            freqs.push(TSV_ARRAY[f][freq_index]);
        }
    }
    return freqs;
}

/*
 *
 * @param {Number} parameter the size of the sliding window, 0 if no smoothing
 * @param 
 * @returns {undefined}
 */
function significantFluctuations(parameter) {
    for (var q = 0; q < QUERIES.length; q++) {

        var query = QUERIES[q];

        var sub = "";
        if (query.subset >= 0) {
            sub = "_" + AUTHORS[query.subset];
        }
        var tsv_entry_high = query.input + sub + "_high" + parameter;
        var tsv_entry_low = query.input + sub + "_low" + parameter;
        if (TSV_ARRAY[0].indexOf(tsv_entry_high) < 0 ||
                TSV_ARRAY[0].indexOf(tsv_entry_low) < 0) {
            // do the tests only if they haven't been done before

            var toks = readTokens(query.subset);
            var occs = readOccurrences(query);
            var freqs = readFrequencies(query, parameter);

            // find the center of the window
            var first_possible = 0;
            while (toks[first_possible] < 1) { // the first day may not have data
                first_possible++;
            }
            var day_ind = first_possible;
//            // uncomment below for a center at least parameter days away from the beginning
//            var sum_gaps = 0;
//            while (day_ind < DATA_BY_DATE.length && sum_gaps < parameter) {
//                sum_gaps += DATA_BY_DATE[day_ind].gap;
//                day_ind++;
//            }

            // find the last possible center
            var last_possible = occs.length - 1;
            while (occs[last_possible] === null) {
                last_possible--;
            }
//            // uncomment below for a center at least parameter days away from the end
//            sum_gaps = 0;
//            while (last_possible > day_ind && sum_gaps < parameter) {
//                sum_gaps += DATA_BY_DATE[last_possible - 1];
//                last_possible--;
//            }

// we don't want too big periods to be tested
            // (alternative would be taking half of the tokens,
            // but it seems less intuitive for the visualization)
            if (parameter * 2 + 1 < ((DATA_BY_DATE[last_possible].date - DATA_BY_DATE[first_possible].date) / 86400000) / 2) {
                // count all occurrences and tokens
                var sum_all_occ = 0;
                var sum_all_tokens = 0;
                for (var index = 0; index < occs.length; index++) {
                    sum_all_occ += occs[index];
                    if (toks[index] >= query.items.length) {
                        sum_all_tokens += toks[index] - (query.items.length - 1); // for ngrams
                    }
                }

                // slide the window
                var last = "";
                var last_start = -1;
                var last_end = -1;
                var last_high = null;
                var last_low = null;
                var last_tok = 0;
                var last_occ = 0;
                var last_insign = null;
                var all_high = [];
                var all_low = [];
                while (day_ind <= last_possible) {
                    // we don't need to go through the same thing too many times           
                    while ((last !== "" && day_ind < (occs.length - 1) && day_ind - parameter > 0 && toks[day_ind - parameter] < 1 && toks[(day_ind - 1) - parameter] < 1) && (day_ind + parameter >= occs.length || (toks[day_ind + parameter] < 1 && toks[(day_ind - 1) + parameter] < 1))) {
                        if (last === "insign") {
                            day_ind++;
                        } else if (last === "high") {
                            all_high.push(day_ind);
                            day_ind++;
                        } else if (last === "low") {
                            all_low.push(day_ind);
                            day_ind++;
                        } else {
                            day_ind++;
                        }
                    }

                    // finding the beginning of the window
                    var start_ind = day_ind; // to become less (eventually)
                    var sum_gaps = 0;
                    while (start_ind - 1 >= 0 && sum_gaps + DATA_BY_DATE[start_ind - 1].gap < parameter) {
                        sum_gaps += DATA_BY_DATE[start_ind - 1].gap;
                        start_ind--;
                    }
                    // just to be sure
                    if (start_ind < 0) {
                        start_ind = 0;
                    }


                    // finding the end of the window
                    var end_ind = day_ind;
                    var sum_gaps = 0;
                    while (end_ind < DATA_BY_DATE.length && sum_gaps + DATA_BY_DATE[end_ind].gap < parameter) {
                        sum_gaps += DATA_BY_DATE[end_ind].gap;
                        end_ind++;
                    }
                    // just to be sure
                    if (end_ind >= occs.length) {
                        end_ind = occs.length - 1;
                    }

                    var test_int = new Interval(start_ind, end_ind);

                    // if this is not the first interval to test
                    if (last_start >= 0 && last_end >= 0) {
                        test_int.tok = last_tok;
                        test_int.occ = last_occ;
                        for (var left = last_start; left < test_int.start; left++) {
                            if (toks[left] >= query.items.length) {
                                test_int.tok -= toks[left];
                                test_int.occ -= occs[left];
                            }
                        }
                        for (var right = (last_end + 1); right <= test_int.end; right++) {
                            if (toks[right] >= query.items.length) {
                                test_int.tok += toks[right];
                                test_int.occ += occs[right];
                            }
                        }
                    } else { // if this is the first interval to test
                        test_int.tok = 0;
                        test_int.occ = 0;
                        for (var every = test_int.start; every <= test_int.end; every++) {
                            if (toks[every] >= query.items.length) {
                                test_int.tok += toks[every];
                                test_int.occ += occs[every];
                            }
                        }
                    }

                    last_start = test_int.start;
                    last_end = test_int.end;
                    last_tok = test_int.tok;
                    last_occ = test_int.occ;

                    // check if the interval is different from the previous (it might have same number of tokens and occurences)
                    if (last_insign !== null && test_int.isSame(last_insign)) {
                        last_insign = test_int;
                        last = "insign"; //TODO check if this "last" variable does anything at all
                    } else if (last_high !== null && test_int.isSame(last_high)) {
                        last_high = test_int;
                        all_high.push(day_ind);
                        last = "high";
                    } else if (last_low !== null && test_int.isSame(last_low)) {
                        last_low = test_int;
                        all_low.push(day_ind);
                        last = "low";
                    } else {
                        // now we have a period to be tested for significance, that hasn't been yet
                        // if we have enough data, we do chi squared
                        if (test_int.occ >= 5 && sum_all_occ - test_int.occ >= 5) {
                            if (chiSquared(test_int.tok, sum_all_tokens - test_int.tok, test_int.occ, sum_all_occ - test_int.occ)) {
                                if (test_int.occ / test_int.tok > (sum_all_occ - test_int.occ) / (sum_all_tokens - test_int.tok)) {
                                    all_high.push(day_ind);
                                    last = "high";
                                } else if (test_int.occ / test_int.tok < (sum_all_occ - test_int.occ) / (sum_all_tokens - test_int.tok)) {
                                    all_low.push(day_ind);
                                    last = "low";
                                }
                            } else {
                                last = "insign";
                            }

                        } else {
                            // else the fisher exact test of independence
                            test_int.p = fisher(sum_all_tokens, sum_all_occ, test_int);
                            // one tailed test - upwards
                            if (test_int.p < 0.01) {
                                if (test_int.occ / test_int.tok > (sum_all_occ - test_int.occ) / (sum_all_tokens - test_int.tok)) {
                                    var result = fluctuationsUpwards(toks, occs, sum_all_tokens, sum_all_occ, test_int);
                                    if (result < 0.01) {
                                        all_high.push(day_ind);
                                        last = "high";
                                    }
                                } else if (test_int.occ / test_int.tok < (sum_all_occ - test_int.occ) / (sum_all_tokens - test_int.tok)) {// one tailed test - downwards
                                    var result = fluctuationsDownwards(toks, occs, sum_all_tokens, sum_all_occ, test_int);
                                    if (result < 0.01) {
                                        all_low.push(day_ind);
                                        last = "low";
                                    }
                                }
                            } else {
                                last = "insign";
                            }
                        }
                    }
                    day_ind++;
                }
//                testing
//                console.log("High:");
//                for (var h = 0; h < all_high.length; h++) {
//                    console.log(all_high[h]);
//                }
//                console.log("Low:");
//                for (var h = 0; h < all_low.length; h++) {
//                    console.log(all_low[h]);
//                }

                // filling in the tsv array
                if (query.subset < 0) {
                    TSV_ARRAY[0].push(query.input + "_high" + parameter);
                    TSV_ARRAY[0].push(query.input + "_low" + parameter);
                } else {
                    TSV_ARRAY[0].push(query.input + "_" + AUTHORS[query.subset] + "_high" + parameter);
                    TSV_ARRAY[0].push(query.input + "_" + AUTHORS[query.subset] + "_low" + parameter);
                }
                for (var t = 1; t < TSV_ARRAY.length; t++) {
                    var written = false;
                    for (var h = 0; h < all_high.length; h++) {
                        if (all_high[h] === (t - 1)) {
                            if (freqs[t - 1] !== null) {
                                TSV_ARRAY[t].push(freqs[t - 1]);
                            } else {
//                            console.log("Fluctuations: Null frequency at index " + day_ind);
                                TSV_ARRAY[t].push(interpolate(freqs, t - 1));
                            }
                            written = true;
                        }
                    }
                    if (!written) {
                        TSV_ARRAY[t].push(null);
                    }
                    written = false;
                    for (var l = 0; l < all_low.length; l++) {
                        if (all_low[l] === (t - 1)) {
                            if (freqs[t - 1] !== null) {
                                TSV_ARRAY[t].push(freqs[t - 1]);
                            } else {
//                            console.log("Fluctuations: Null frequency at index " + day_ind);
                                TSV_ARRAY[t].push(interpolate(freqs, t - 1));
                            }
                            written = true;
                        }
                    }
                    if (!written) {
                        TSV_ARRAY[t].push(null);
                    }
                }
            } else {
                var maxParam = getNumDays(first_possible, last_possible)/2;
                maxParam -= 1;
                maxParam /= 2;
                // maybe an alert here?? What would you say, Masha?
            }
        }
    }
    return tsvArrayToString();
}

//function getLengthOfPeriods(tsv_stats_entry, tsv_smooth_entry, parameter) {
//    var ind = TSV_ARRAY[0].indexOf(tsv_entry);
//    if (ind >= 0) {
//
//        // create a new collumn
//        TSV_ARRAY[0].push(tsv_entry + "_line");
//
//        //getting the values from the column
//        var values = [];
//        var dates = [];
//        for (var i = 1; i < TSV_ARRAY.length; i++) {
//            values.push(TSV_ARRAY[i][ind]);
//            dates.push(TSV_ARRAY[i][0]);
//        }
//        
//        var significant_periods = [];
//        for (var i = 0; i < values.length; i++) {
//            if (values[i] !== null) {
//                var period = new SignificantPeriod();
//                var first_day = getFirstDayOfPeriod();
//                var last_day = getLastDayOfPeriod();
//                if (first_day < DATA_BY_DATE[0].date) {
//                    first_days.push(DATA_BY_DATE[0].date);
//                }
//            }
//        }
//
//    }
//}

function getNumDays(index1, index2) {
    return Math.abs((DATA_BY_DATE[index1].date - DATA_BY_DATE[index2].date) / 86400000);
}

function interpolate(freqs, ind) {
    // go back to the last day woth data
    var data_before = ind;
    while (freqs[data_before] === null && data_before > 0) {
        data_before--; // shouldn't go below 0
    }
    var data_after = ind;
    while (freqs[data_after] === null && data_after < freqs.length - 1) {
        data_after++; // shouldn't go above freqs.length-1
    }
    var interpolated_freq = freqs[data_before] +
            ((freqs[data_after] - freqs[data_before]) / getNumDays(data_after, data_before)) *
            getNumDays(data_before, ind);
//    console.log("last frequency:\t" + freqs[data_before]);
//    console.log("next frequency:\t" + freqs[data_after]);
//    console.log("interpolated frequency:\t" + interpolated_freq);
    return interpolated_freq;
}

function fluctuationsUpwards(toks, occs, sum_all_tokens, sum_all_occ, interval) {
    var tmp_interval = interval;
    var change = 1; // change in the result
    while (interval.p < 0.01 && change > 0 && (sum_all_occ - tmp_interval.occ) > 0 && (tmp_interval.tok - tmp_interval.occ) > 0) {
        tmp_interval.occ++;
        change = fisher(sum_all_tokens, sum_all_occ, tmp_interval);
        interval.p += change;
    }
    return interval.p;
}

function fluctuationsDownwards(toks, occs, sum_all_tokens, sum_all_occ, interval) { //TODO toks and occs are not needed here!
    var tmp_interval = interval;
    var change = 1;
    while (interval.p < 0.01 && change > 0 && tmp_interval.occ > 0 && (sum_all_tokens - sum_all_occ - tmp_interval.tok + tmp_interval.occ) > 0) {
        tmp_interval.occ--;
        change = fisher(sum_all_tokens, sum_all_occ, tmp_interval);
        interval.p += change;
    }
    return interval.p;
}

function fisher(all_tok, all_occ, an_interval) {
    var n = all_tok;
    var a = an_interval.occ;
    var b = an_interval.tok - a;
    var c = all_occ - a;
    var d = n - all_occ - b;

    return fisherTest(a, b, c, d, n);
}


function fisherTest(a, b, c, d, n) {
    var noms = [1, a + b, c + d, a + c, b + d];
    var dens = [a, b, c, d, n];
    noms.sort(compareNumbers);
    dens.sort(compareNumbers);
    for (var i = 0; i < noms.length; i++) {
        if (noms[i] < 1) {
            noms[i] = 1;
        }
    }
    for (var i = 0; i < dens.length; i++) {
        if (dens[i] < 1) {
            dens[i] = 1;
        }
    }

    var log_res = Math.log(1);
    for (var i = 0; i < noms.length; i++) {
        if (noms[i] > dens[i]) {
            while (noms[i] > dens[i]) {
                log_res += Math.log(noms[i]);
                noms[i]--;
            }
        }
        if (noms[i] < dens[i]) {
            while (noms[i] < dens[i]) {
                log_res -= Math.log(dens[i]);
                dens[i]--;
            }
        }
    }

    var res = Math.pow(Math.E, log_res);
    return res;
}

function fisherComparisons(interval_1, interval_2) {

    var n = interval_1.tok + interval_2.tok;
    var a = interval_1.occ;
    var b = interval_1.tok - a;
    var c = interval_2.occ;
    var d = interval_2.tok - c;
    var noms = [1, a + b, c + d, a + c, b + d];
    var dens = [a, b, c, d, n];

    return fisherTest(a, b, c, d, n);
}


function comparisonsUpwards(interval_1, interval_2) {
    var tmp_interval_1 = interval_1;
    var tmp_interval_2 = interval_2;
    var change = 1; // change in the result
    while (interval_1.p < 0.01 && change > 0 && interval_2.occ > 0 && (tmp_interval_1.tok - tmp_interval_1.occ) > 0) {
        tmp_interval_1.occ++;
        tmp_interval_2.occ--;
        change = fisherComparisons(tmp_interval_1, tmp_interval_2);
        interval_1.p += change;
        interval_2.p += change;
    }
    return interval_1.p;
}


/*
 * chi squared test of independence
 * @param {type} all_tok
 * @param {type} all_occ
 * @param {type} interval
 * @returns {Boolean} true if the result significant, false otherwise
 */
function chiSquared(toks1, toks2, occs1, occs2) {
    var observed = [occs1, occs2];
    var expected = new Array(2);
    expected[0] = ((occs1 + occs2) * (toks1 / (toks1 + toks2)));
    expected[1] = ((occs1 + occs2) * (toks2 / (toks1 + toks2)));

    var chi2 = 0;
    for (var i = 0; i < observed.length; i++) {
        chi2 += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }

    if (chi2 > 6.635) {
        return true;
    }
    return false;
}

/*
 * Descending order
 * @param {type} a
 * @param {type} b
 * @returns {Number}
 */
function compareNumbers(a, b) {
    if (a < b)
        return 1;
    if (a > b)
        return -1;
    // a must be equal to b
    return 0;
}

/*
 * Resets the values for the frequency and weight properties of the day objects
 */
function cleanFrequencies() {
    for (var i = 0; i < DATA_BY_DATE.length; i++) {
        if (DATA_BY_DATE[i].tokens === 0) {
            DATA_BY_DATE[i].frequency = null;
        }
        for (var a = 0; a < getNamesOfAuthors().length; a++) {
            if (DATA_BY_DATE[i].authors[a].tokens === 0) {
                DATA_BY_DATE[i].authors[a].frequency = null;
            }
        }
    }
}

/*
 * Smoothens the frequencies for a specified author
 * @param {array} tsv
 * @param {string} word
 * @param {string} name
 * @returns {undefined}
 */
function smoothByAuthor(word, parameter, aut, n) {
    var aut_name = DATA_BY_DATE[0].authors[aut].name;
    // 2i+1 is the size of the sliding window
    if (TSV_ARRAY[0].indexOf(word + "_" + aut_name + "_smooth" + parameter) < 0) {
        // TO DO unify it somehow with the other smoothing
        TSV_ARRAY[0].push(word + "_" + aut_name + "_smooth" + parameter);
        var freq_col = TSV_ARRAY[0].indexOf(word + "_" + aut_name + "_smooth0"); // the column with the unsmoothed frequencies
        var frequencies_to_smooth = new Array(TSV_ARRAY.length - 1);
        for (var f = 0; f < TSV_ARRAY.length - 1; f++) {
            frequencies_to_smooth[f] = TSV_ARRAY[f + 1][freq_col];
        }
        for (var j = 0; j < DATA_BY_DATE.length; j++) {
            if (frequencies_to_smooth[j] !== null) {
                var numerator = 0; // doubly weighted frequencies
                var denominator = 0; // weighted weights
                var weight; // weight for the weighted moving average
                var ind = j; // start calculations from this index
                var count = 0; // to determine the limits of the sliding window
                var gap_backwards = 0;
                if (ind > 0) {
                    gap_backwards = DATA_BY_DATE[ind - 1].gap;
                }
                // go back to the begining of the window 
                while (ind > 0 && count < parameter - gap_backwards) {
                    ind--;
                    count += gap_backwards;
                    if (ind > 0) {
                        gap_backwards = DATA_BY_DATE[ind - 1].gap;
                    } else {
                        gap_backwards = 0;
                    }
                }
                weight = parameter + 1 - count;
                // go right towards the center of the window
                while (ind < DATA_BY_DATE.length && weight <= parameter + 1) { // TODO check if it causes problems
                    if (frequencies_to_smooth[ind] !== null) {
                        numerator += weight * DATA_BY_DATE[ind].weight * frequencies_to_smooth[ind];
                        denominator += weight * DATA_BY_DATE[ind].weight;
                    }
                    weight += DATA_BY_DATE[ind].gap;
                    ind++;
                }
                if (ind < DATA_BY_DATE.length) {
                    // go right to the end of the window
                    weight = parameter + 1 - DATA_BY_DATE[ind - 1].gap;
                    while (ind < DATA_BY_DATE.length && weight >= 1) { // TODO check if it is ok
                        if (frequencies_to_smooth[ind] !== null) {
                            numerator += weight * DATA_BY_DATE[ind].weight * frequencies_to_smooth[ind];
                            denominator += weight * DATA_BY_DATE[ind].weight;
                        }
                        weight -= DATA_BY_DATE[ind].gap;
                        ind++;
                    }
                }
                if (denominator !== 0) {
                    TSV_ARRAY[j + 1].push(numerator / denominator);
                } else {
                    TSV_ARRAY[j + 1].push(null);
                }
            } else {
                TSV_ARRAY[j + 1].push(null);
            }
        }
    }
}

function significantDifferences(wow) {
    // check if the queries are exactly two for the same n-gram
    if (checkQueries()) {
        var word = QUERIES[0].input;
        var aut1 = AUTHORS[QUERIES[0].subset];
        var aut2 = AUTHORS[QUERIES[1].subset];

        var tsv_ind1 = TSV_ARRAY[0].indexOf(word + "_" + aut1 + "_diff_high" + wow);
        var tsv_ind2 = TSV_ARRAY[0].indexOf(word + "_" + aut2 + "_diff_low" + wow);
        if (tsv_ind1 < 0 || tsv_ind2 < 0 || Math.abs(tsv_ind1 - tsv_ind2) !== 1) { // if these queries have not been tested

            var toks_1 = readTokens(QUERIES[0].subset);
            var toks_2 = readTokens(QUERIES[1].subset);
            var occs_1 = readOccurrences(QUERIES[0]);
            var occs_2 = readOccurrences(QUERIES[1]);
            var freqs1 = readFrequencies(QUERIES[0], wow);
            var freqs2 = readFrequencies(QUERIES[1], wow);

            var n = QUERIES[0].items.length;

            var first_ind = 0; // the first day NOT always has data (authors) (check!!)
            while (toks_1[first_ind] < 1 && toks_2[first_ind] < 1) {
                first_ind++;
            }
            if (toks_1[first_ind] < 1) {
                while (toks_1[first_ind] < 1) {
                    first_ind++;
                }
            } else if (toks_2[first_ind] < 1) {
                while (toks_2[first_ind] < 1) {
                    first_ind++;
                }
            }

            var last_ind = occs_1.length - 1; // the last index such that there is data for both subsets
            while (toks_1[last_ind] < 1 && toks_2[last_ind] < 1) {
                last_ind--;
            }
            if (toks_1[last_ind] < 1) {
                while (toks_1[last_ind] < 1) {
                    last_ind--;
                }
            } else if (toks_2[last_ind] < 1) {
                while (toks_2[last_ind] < 1) {
                    last_ind--;
                }
            }
            // if the windos is not larger than the whole time span // TODO add alserts for if otherwise
//            if (wow * 2 + 1 <= (DATA_BY_DATE[last_ind].date - DATA_BY_DATE[first_ind].date) / 86400000) {

// slide the window
            var last = "";
            var last_start = -1;
            var last_end = -1;
            var last_tok_1 = 0;
            var last_occ_1 = 0;
            var last_tok_2 = 0;
            var last_occ_2 = 0;
            var last_sign_1 = null; // last sign perod from the first time series
            var last_insign_1 = null;
            var last_sign_2 = null; // last sign perod from the second time series
            var last_insign_2 = null;
            var all_sign1 = [];
            var all_sign2 = [];

            var day_ind = first_ind;
//                // uncomment below for a center at least parameter days away from the beginning
//                var sum_gaps = 0;
//                while (day_ind < last_ind && sum_gaps < wow) {
//                    sum_gaps += DATA_BY_DATE[day_ind].gap;
//                    day_ind++;
//                }

            var last_possible = last_ind;
//                // uncomment below for a center at least parameter days away from the end
//                sum_gaps = 0;
//                while (last_possible > day_ind && sum_gaps < wow) {
//                    sum_gaps += DATA_BY_DATE[last_possible - 1];
//                    last_possible--;
//                }

            // TODO! not + wow! add the gap info!
            while (day_ind <= last_possible) {

                // finding the beginning of the window
                var start_ind = day_ind; // to become less (eventually)
                var sum_gaps = 0;
                while (start_ind - 1 >= first_ind && sum_gaps + DATA_BY_DATE[start_ind - 1].gap < wow) {
                    sum_gaps += DATA_BY_DATE[start_ind - 1].gap;
                    start_ind--;
                }
                //just to be sure
                if (start_ind < first_ind) {
                    start_ind = first_ind;
                }

                // finding the end of the window
                var end_ind = day_ind;
                var sum_gaps = 0;
                while (end_ind < last_ind && sum_gaps + DATA_BY_DATE[end_ind].gap < wow) {
                    sum_gaps += DATA_BY_DATE[end_ind].gap;
                    end_ind++;
                }
                // just to be sure // TODO Maybe make this a havy duty condition?
                if (end_ind > last_ind) {
                    end_ind = last_ind;
                }

                var test_int_1 = new Interval(start_ind, end_ind);
                var test_int_2 = new Interval(start_ind, end_ind);
                // if there were other tested intervals
                if (last_start >= first_ind && last_end >= first_ind) {
                    // start with the data for last interval and add/subtract occurences
                    // it is efficient for large sliding windows
                    test_int_1.tok = last_tok_1;
                    test_int_1.occ = last_occ_1;
                    test_int_2.tok = last_tok_2;
                    test_int_2.occ = last_occ_2;
                    // subtract occurrences that appeared to the left of the current window
                    for (var left = last_start; left < test_int_1.start; left++) {
                        if (toks_1[left] >= n) { // if the num of tokens is at least the size of the ngram
                            test_int_1.tok -= toks_1[left];
                            test_int_1.occ -= occs_1[left];
                        }
                        if (toks_2[left] >= n) { // if the num of tokens is at least the size of the ngram
                            test_int_2.tok -= toks_2[left];
                            test_int_2.occ -= occs_2[left];
                        }
                    }
                    // add the occurences that have been to the right of the previous window
                    for (var right = (last_end + 1); right <= test_int_1.end; right++) {
                        if (toks_1[right] >= n) { // if the num of tokens is at least the size of the ngram
                            test_int_1.tok += toks_1[right];
                            test_int_1.occ += occs_1[right];
                        }
                        if (toks_2[right] >= n) { // if the num of tokens is at least the size of the ngram
                            test_int_2.tok += toks_2[right];
                            test_int_2.occ += occs_2[right];
                        }
                    }
                } else { // if this is the first interval
                    test_int_1.tok = 0;
                    test_int_1.occ = 0;
                    test_int_2.tok = 0;
                    test_int_2.occ = 0;
                    for (var every = test_int_1.start; every <= test_int_1.end; every++) {
                        if (toks_1[every] >= n) {
                            test_int_1.tok += toks_1[every];
                            test_int_1.occ += occs_1[every];
                        }
                        if (toks_2[every] >= n) {
                            test_int_2.tok += toks_2[every];
                            test_int_2.occ += occs_2[every];
                        }
                    }
                }

// actualization of the last window data
                last_start = test_int_1.start;
                last_end = test_int_1.end;
                last_tok_1 = test_int_1.tok;
                last_occ_1 = test_int_1.occ;
                last_tok_2 = test_int_2.tok;
                last_occ_2 = test_int_2.occ;

                // if one of the intervals has zero tokens, we don't test
                if (test_int_1.tok !== 0 && test_int_2.tok !== 0) {

                    // check if the interval is different from the previous (it might have same number of tokens and occurences)
                    if (last_insign_1 !== null && test_int_1.isSame(last_insign_1) && test_int_2.isSame(last_insign_2)) {
                        last_insign_1 = test_int_1;
                        last_insign_2 = test_int_2;
                        last = "insign"; // TODO see what this is doing
                    } else if (last_sign_1 !== null && test_int_1.isSame(last_sign_1) && test_int_2.isSame(last_sign_2)) {
                        last_sign_1 = test_int_1;
                        last_sign_2 = test_int_2;
                        if (last_occ_1 / last_tok_1 > last_occ_2 / last_tok_2) {
                            all_sign1.push(day_ind);
                        } else {
                            all_sign2.push(day_ind);
                        }
                        last = "sign";
                    } else {
                        // now we have two periods to be tested for significant difference

                        // if we have enough data, we do chi sqared test
                        if (test_int_1.occ >= 5 && test_int_2.occ >= 5) {
                            if (chiSquared(test_int_1.tok, test_int_2.tok, test_int_1.occ, test_int_2.occ)) {
                                if (test_int_1.occ / test_int_1.tok > test_int_2.occ / test_int_2.tok) {
                                    all_sign1.push(day_ind);
                                    last = "sign";
                                } else if (test_int_1.occ / test_int_1.tok < test_int_2.occ / test_int_2.tok) {
                                    all_sign2.push(day_ind);
                                    last = "sign";
                                }
                            } else {
                                last = "insign";
                            }
                            // else, we do Fisher's exact test of independence
                        } else {
                            test_int_1.p = fisherComparisons(test_int_1, test_int_2);
                            test_int_2.p = test_int_1.p;
                            // one tailed test - upwards
                            if (test_int_1.p < 0.01 && test_int_1.occ / test_int_1.tok > test_int_2.occ / test_int_2.tok) {
                                var result = comparisonsUpwards(test_int_1, test_int_2);
                                if (result < 0.01) {
                                    all_sign1.push(day_ind);
                                }
                            } else if (test_int_1.p < 0.01 && test_int_1.occ / test_int_1.tok < test_int_2.occ / test_int_2.tok) {// one tailed test - downwards
                                var result = comparisonsUpwards(test_int_2, test_int_1);
                                if (result < 0.01) {
                                    all_sign2.push(day_ind);
                                }
                            } else if (test_int_1.p >= 0.01) { // insignificant result
                                last_insign_1 = test_int_1;
                                last_insign_2 = test_int_2;
                                last = "insign";
                            }
                        }
                    }
                } else { // in case one of the intervals has zero tokens, no significant differences
                    last_insign_1 = test_int_1;
                    last_insign_2 = test_int_2;
                    last = "insign";
                }
                day_ind++;
            }

            TSV_ARRAY[0].push(word + "_" + aut1 + "_diff_high" + wow);
            TSV_ARRAY[0].push(word + "_" + aut2 + "_diff_low" + wow);

            TSV_ARRAY[0].push(word + "_" + aut2 + "_diff_high" + wow);
            TSV_ARRAY[0].push(word + "_" + aut1 + "_diff_low" + wow);


            for (var t = 1; t < TSV_ARRAY.length; t++) {
                var written = false;
                for (var s = 0; s < all_sign1.length; s++) {
                    if (all_sign1[s] === (t - 1)) {
                        if (freqs1[t - 1] !== null) {
                            TSV_ARRAY[t].push(freqs1[t - 1]);
                        } else {
//                                console.log("Differences: Zero tokens for the first subset at index " + day_ind);
                            TSV_ARRAY[t].push(interpolate(freqs1, t - 1));
                        }
                        if (freqs2[t - 1] !== null) {
                            TSV_ARRAY[t].push(freqs2[t - 1]);
                        } else {
//                                console.log("Differences: Zero tokens for the second subset at index " + day_ind);
                            TSV_ARRAY[t].push(interpolate(freqs2, t - 1));
                        }
                        written = true;
                    }
                }
                if (!written) {
                    TSV_ARRAY[t].push(null);
                    TSV_ARRAY[t].push(null);
                }
                written = false;
                for (var s = 0; s < all_sign2.length; s++) {
                    if (all_sign2[s] === (t - 1)) {
                        if (freqs2[t - 1] !== null) {
                            TSV_ARRAY[t].push(freqs2[t - 1]);
                        } else {
//                                console.log("Differences: Zero tokens for the first subset at index " + day_ind);
                            TSV_ARRAY[t].push(interpolate(freqs2, t - 1));
                        }
                        if (freqs1[t - 1] !== null) {
                            TSV_ARRAY[t].push(freqs1[t - 1]);
                        } else {
//                                console.log("Differences: Zero tokens for the second subset at index " + day_ind);
                            TSV_ARRAY[t].push(interpolate(freqs1, t - 1));
                        }
                        written = true;
                    }
                }
                if (!written) {
                    TSV_ARRAY[t].push(null);
                    TSV_ARRAY[t].push(null);
                }
            }
//            }
        }
    }
    return tsvArrayToString();
}

function checkQueries() {
    if (QUERIES.length !== 2) { // if more than two graph plotted, no comparison possible
        return false;
    }
    if (QUERIES[0].input.toString() === QUERIES[1].input.toString() && QUERIES[0].subset >= 0 &&
            QUERIES[1].subset >= 0 && QUERIES[0].subset !== QUERIES[1].subset) {
        return true;
    }
    return false;
}

/*
 * Creates one single string out of all the lines in the tsv array  
 * * @param {Array} tsvArray array of lines in tsv format 
 * * @returns {String} the tsv string to be processed by the d3 visualization
 */
function tsvArrayToString() {
    var tsv_string = "";
    for (var i = 0; i < TSV_ARRAY.length; i++) {
        for (var j = 0; j < TSV_ARRAY[i].length; j++) {
            if (TSV_ARRAY[i][j] !== null) {
                tsv_string += TSV_ARRAY[i][j];
            }
            tsv_string += "\t";
        }
        tsv_string += "\n";
    }
    return tsv_string;
}

//function getData(xml, detector) {
//    var data = null;
//
//    try {
//        if (detector.property !== null && detector.property.length > 0) {
//            var nodes = xml.getElementsByTagName(detector.tag);
//            data = new Array(nodes.length);
//            for (var i=0; i<nodes.length; i++) {
//                data[i] = nodes[i].getAttribute(detector.property).trim().toLowerCase();
//            }
//        } else {
//            var nodes = xml.getElementsByTagName(detector.tag);
//            data = new Array(nodes.length);
//            for (var n = 0; n < nodes.length; n++) {
//                data[n] = "";
//                for (var tn = 0; tn < nodes[n].childNodes.length; tn++) {
//                    data[n] += nodes[n].childNodes[tn].nodeValue.trim().toLowerCase();
//                }
//            }
//        }
//    } finally {
//        if (data <= 0) {
//            return null;
//        }
//    }
//    return data;
//}