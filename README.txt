*****************************************************************************************
> Slash/A N-gram Tendency Viewer <
> version 2.0 (statistical) <

Velislava Todorova: todorova.slava@gmail.com
Maria Chinkina: maria.chinkina@gmail.com

Universität Tübingen
*****************************************************************************************




General information
-----------------------

Authors: 
- Velislava Todorova: todorova.slava@gmail.com
- Maria Chinkina: maria.chinkina@gmail.com

Our tool visualizes the actual frequencies of n-grams in a dated text corpus in XML format and provides the options of:
- smoothing (to make the general tendency in the data clearer to see)
- (NEW!) statistical analysis (to highlight significant changes or differences)




Requirements:
-----------------------

Browser:
- Any browser but Internet Explorer (has not been tested)

Libraries:
(provided in the /js/libs folder)
- jQuery.js
- underscore.js
- d3.js
- bootstrap.js


Corpus:
(the Brownings’ corpus is provided as an example*) 
a dated text corpus consisting of files in XML format (1 text - 1 file) with specified: 

- date (obligatory!)

- author (optional) or another subset (e.g. recipient, newspaper name, genre, female/male, etc.)

- tokens (optional)
- lemmas (optional - to be able to use it in queries)
- POS tags (optional - to be able to use it in queries)
- text (optional - to be able to get access to original data)

* The Brownings’ corpus can also be downloaded here: http://linguistics.chrisculy.net/vistola/index.html#resources


Licensing
-----------------------

Slash/A N-Gram Viewer is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License:
http://creativecommons.org/licenses/by-nc/4.0/



How to Use Slash/A
-----------------------

1. Open index.html in a browser.

2. Configure the Settings of your corpus by clicking on a gear-wheel icon at the top of the page.

3. Load (part of) your corpus in XML format by clicking on the button "Load corpus" in the top-right corner on the window.
The subsets that you have specified in the Settings will appear as blue panels on the right side of the window.

4. Click on the blue panels to open the query boxes, where you can type in your queries.

5. Type in one or several n-grams to search in the whole corpus or only in some particular subset (which has been specified in the Settings).
   Some example queries: ‘book/NP’, ‘free/lemma’, ‘/V*’, ‘/JJ correspondence’ (get more examples by clicking on HowTo at the top of the window)

6. Hit the “Show Graph” button. 

7. Click on the smoothing level buttons to see our five steps of gradual smoothing and observe the tendencies of n-gram usage. 
Click on Customize to specify your own smoothing parameter to acquire more fine-grained differences.

8. NEW! Go to “Add some statistics” to display either significant fluctuations (or changes) for each n-gram or significant differences for the same n-gram searched for in 2 different subsets. 
The tests applied are Pearson's chi squared test of independence and in case there is too little data - the Fisher's exact test of independence. The critical significance level is set to 0.01. In the fluctuations case what is tested is if the values in the period at hand are significantly lower (or higher) than the values in the rest of the corpus. In the differences case the frequencies from two subsets of the corpus for the same time period are compared.

9. You can find additional functionality and a more detailed description of the program by clicking on “WhatIs // HowTo // POStags” at the top of the screen.



The paper
-----------------------
The full paper describing the tool can be found in the ESSLLI 2014 Proceedings on pp.229-239 here: 
http://www.kr.tuwien.ac.at/drm/dehaan/stus2014/proceedings.pdf