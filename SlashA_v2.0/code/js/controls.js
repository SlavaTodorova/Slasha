/*
 Copyright (c) [2014] [Todorova V]
 */



/* 
 * When your corpus is not in the default format handled by Slash/A (TCF for correspondence)
 * you can adjust the program to deal with your own data. 
 * However, your corpus *must* be in (some sort of) XML format.
 */




//// Brownings
//var DATE_TAG = "written";
//var DATE_PROP = "date";
//var SUBSET_TAG = "correspondence";
//var SUBSET_PROP = "from";
//var TEXT_TAG = "text";
//var TEXT_PROP = null;
//var TOKEN_TAG = "token";
//var TOKEN_PROP = null;
//var LEMMA_TAG = "lemma";
//var LEMMA_PROP = null;
//var TAG_TAG = "tag";
//var TAG_PROP = null;

//// Bierce
//var DATE_TAG = "date"; // we will exclude it if it is null
//var DATE_PROP = null;
//var SUBSET_TAG = "to"; // no comparisons if it is null
//var SUBSET_PROP = null;
//var TEXT_TAG = null; // no original data if it is null
//var TEXT_PROP = null;
//var TOKEN_TAG = "token"; // automatic tokenization if it is null
//var TOKEN_PROP = null;
//var LEMMA_TAG = "lemma"; // no lemmas if it null
//var LEMMA_PROP = null;
//var TAG_TAG = "tag"; //no (pos) tags if it is null
//var TAG_PROP = null;

//// Facebook
//var DATE_TAG = "date"; // we will exclude it if it is null
//var DATE_PROP = null;
//var SUBSET_TAG = "from"; // no comparisons if it is null
//var SUBSET_PROP = null;
//var TEXT_TAG = null; // no original data if it is null
//var TEXT_PROP = null;
//var TOKEN_TAG = "token"; // automatic tokenization if it is null
//var TOKEN_PROP = null;
//var LEMMA_TAG = "lemma"; // no lemmas if it null
//var LEMMA_PROP = null;
//var TAG_TAG = "tag"; //no (pos) tags if it is null
//var TAG_PROP = null;


function DateDetector() {
    this.tag = DATE_TAG;
    this.property = DATE_PROP;
}

function SubsetDetector() {
    this.tag = SUBSET_TAG;
    this.property = SUBSET_PROP;
}

function TextDetector() {
    this.tag = TEXT_TAG;
    this.property = TEXT_PROP;
}


function TokenDetector() {
    this.tag = TOKEN_TAG;
    this.property = TOKEN_PROP;
}


function LemmaDetector() {
    this.tag = LEMMA_TAG;
    this.property = LEMMA_PROP;
}


function TagDetector() {
    this.tag = TAG_TAG;
    this.property = TAG_PROP;
}
