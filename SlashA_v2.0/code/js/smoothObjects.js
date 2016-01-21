/*
 Copyright (c) [2014] [Todorova V]
 */

/* 
 * Objects
 */

/*
 * Constructor for the Day object
 * @param {Date} date
 * @param {Array} xml Array of XML DOM objects 
 * @param {Array} authors Array of author objects
 * @param {Number} num_tokens
 * @returns {day}
 */
function Day(date, letters, num_tokens, authors) {
    this.date = date;
    this.letters = letters;
    this.tokens = num_tokens;
    this.weight = Math.sqrt(num_tokens);
    this.authors = authors;
    this.occurrences = 0;
    this.frequency = null;
    this.gap = 0; // gap between this day and the next one with data (in days)
    return this;
}

/*
 * Constructor for the Author Object
 * @param {String} name
 * @param {Array} xml array of xml DOM objects
 * @param {Number} num_tokens
 * @param {Number} num_occurrences
 */
function Author(name, letter_indices, num_tokens) {
    this.name = name;
    this.letter_indices = letter_indices;
    this.tokens = num_tokens;
    this.weight = Math.sqrt(this.tokens);
    this.occurrences = 0;
    this.frequency = null;
    this.gap = 0; // gap in days to the next letter by this author
}

/*
 * Constructor for the Letter Object
 * @param {String} file_name
 * @param {String} the content of the text node of the node with tag "text"
 * @param {Number} num_tokens
 * @param {Number} num_occurrences
 */
function Letter(file_name, xml) {
    this.name = file_name;
    this.author_name = getAuthor(xml); //might be null!!!
    // the text
    var text_det = new TextDetector();
    if (getData(xml, text_det) !== null) {
        this.text = getData(xml, text_det)[0];
    } else {
        this.text = null;
        BAD_DOCS.missing_text.push(this.name);
    }
    // Tokens. If no tokens, split the text into tokens
    if (getData(xml, new TokenDetector()) !== null) {
        this.tokens = getData(xml, new TokenDetector());
    } else {
        // TO DO add alert!
        BAD_DOCS.missing_tokens.push(this.name);
        if (this.text !== null) { // if text, take tokens from there
            this.tokens = this.text.split(/\s+/); // it is already trimmed in getData()7
        } else {
            this.tokens = [];
        }
    }
// Lemmas. If no lemmas provided, no lemmas
    if (getData(xml, new LemmaDetector()) !== null) {
        this.lemmas = getData(xml, new LemmaDetector());
    } else {
        // TO DO add alert!
        BAD_DOCS.missing_lemmas.push(this.name);
        this.lemmas = [];
        for (var t = 0; t < this.tokens.length; t++) {
            this.lemmas.push("");
        }
    }
// Tags. If no tags provided, no tags
    if (getData(xml, new TagDetector()) !== null) {
        this.tags = getData(xml, new TagDetector());
    } else {
        // TO DO add alert!
        BAD_DOCS.missing_pos.push(this.name);
        this.tags = [];
        for (var t = 0; t < this.tokens.length; t++) {
            this.tags.push("");
        }
    }
    this.occurrences = 0;
    this.frequency = null;
    this.indices = []; // contains the start-end indices of the tokens
    this.highlights = []; // tells you whch tokens to highlight, i.e. which indices to take
}

function getData(xml, detector) {
    if (detector.tag !== null && detector.tag.length > 0) {
        var nodes = xml.getElementsByTagName(detector.tag);
        if (nodes !== null && nodes.length > 0) {
            var data = new Array(nodes.length);
            if (detector.property !== null && detector.property.length > 0) {
                for (var n = 0; n < nodes.length; n++) {
                    data[n] = nodes[n].getAttribute(detector.property).trim().toLowerCase();
                }
            } else {
                for (var n = 0; n < nodes.length; n++) {
                    data[n] = "";
                    for (var tn = 0; tn < nodes[n].childNodes.length; tn++) {
                        data[n] += nodes[n].childNodes[tn].nodeValue.trim().toLowerCase();
                    }
                }
            }
            return data;
        }
    }
    return null;
}
/*
 * Object for the identification of hits in the letters after a querie
 * @param {String} hitString the querry as entered by the user
 * @param {Array} indices the start ([][0]) and end ([][1]) indices of the tokens-hits
 * @returns {undefined}
 */
function Highlight(hit, indices) {
    this.hit = hit;
    this.indices = indices;
}

/*
 * Constructor for the Query Object (n-grams)
 * @param {String} input the query as entered by the user
 */
function Query(input, index) {
    this.input = new String(input.trim().toLowerCase());
    var item_strings = this.input.split(/\s+/);
    this.subset = index; // index of the subset, -1 if for the whole corpus
    this.items = []; // the elements of the n-gram (number of items: n)
    for (var i = 0; i < item_strings.length; i++) {
        this.items.push(new QueryItem(item_strings[i]));
    }
}

/*
 * Constructor for the QueryItem Object (elements of n-grams)
 * @param {String} input each element of the ngram searched for
 */
function QueryItem(input) {
    // TO DO remove the option of omitting the key word "lemma"
    // Eventually make the syntax more complex (for example with sth like pos=NN)
    var input_string = new String(input);
    var elements = input_string.split("/");
    var tmp_elements = new Array(elements.length);
    for (var i = 0; i < elements.length; i++) {
        tmp_elements[i] = elements[i].trim().toLowerCase();
    }
    elements = tmp_elements;
    var star = -1;
    if (elements[0] !== "" && elements[0] !== null) {
        this.content = new RegExp(escapeSpecialChar(elements[0]));
    } else {
        this.content = null;
    }
    this.lemma = false;
    this.pos = null;
    star = -1;
    if (elements.length === 2) {
        if (elements[1] === "" || elements[1] === "lemma") {
            this.lemma = true;
        } else {
            this.pos = new RegExp(escapeSpecialChar(elements[1]));
        }
    } else if (elements.length > 2) {
        this.lemma = true;
        if (elements[1] === "" || elements[1] === "lemma") {
            this.pos = new RegExp(escapeSpecialChar(elements[2]));
        } else {
            this.pos = new RegExp(escapeSpecialChar(elements[1]));
        }
    }
    // TO DO else some sort of alert for wrong syntax???
}

function escapeSpecialChar(word) {
    var spec_exp = [/\\/g, /\(/g, /\)/g, /\[/g, /\]/g, /\{/g, /\}/g, /\+/g,
        /\|/g, /\^/g, /\./g, /\!/g, /\?/g];
    var spec_char = ["\\", "\(", "\)", "\[", "\]", "\{", "\}", "\+",
        "\|", "\^", "\.", "\!", "\?"];
    for (var s = 0; s < spec_char.length; s++) {
        word = word.replace(spec_exp[s], "\\" + spec_char[s]);
    }
    word = word.replace(/\*/g, "\.\*");
    return word;
}


function Interval(start_index, end_index) {
    this.start = start_index;
    this.end = end_index;
    this.occ = 0;
    this.tok = 0;
    this.p = 1;
//    this.higher = false; // higher than the rest
//    this.lower = false; // lower than the rest
    this.isSame = function(other_interval) {
        if (other_interval.tok === this.tok && other_interval.occ === this.occ) {
            return true;
        }
        return false;
    }; // included in another interval
}

// object to hold info for the annotations NOT present in the corpus
function MissingAnnotations() {
    this.missing_date = [];
    this.missing_subset = [];
    this.missing_tokens = [];
    this.missing_lemmas = [];
    this.missing_pos = [];
    this.missing_text = [];
}

// experimental
function TSVobject(tsv_string, word, author, ngram_length) {
    this.string = tsv_string;
    this.word = word;
    this.author = author;
    this.n = ngram_length;
}

//function SignificantPeriod() {
//    this.dates = [];
//    this.frequencies = [];
//}