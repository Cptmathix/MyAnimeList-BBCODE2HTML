// below a slightly modified version of Patrick Gillespie's BBCode Parser to make it work like the bbcode on myanimelist, thank you for making this available

/*
Copyright (C) 2011 Patrick Gillespie, http://patorjk.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
    Extendible BBCode Parser v1.0.0
    By Patrick Gillespie (patorjk@gmail.com)
    Website: http://patorjk.com/

    This module allows you to parse BBCode and to extend to the mark-up language
    to add in your own tags.
*/

var XBBCODE = (function() {
    "use strict";

    // -----------------------------------------------------------------------------
    // Set up private variables
    // -----------------------------------------------------------------------------

    var me = {},
        urlPattern = /^(?:https?|file|c):(?:\/{1,3}|\\{1})[-a-zA-Z0-9:;@#%&()~_?\+=\/\\\.]*$/,
        colorNamePattern = /^(?:aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/,
        colorCodePattern = /^#?[a-fA-F0-9]{6}$/,
        emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/,
        fontFacePattern = /^([a-z][a-z0-9_]+|"[a-z][a-z0-9_\s]+")$/i,
        tags,
        tagList,
        tagsNoParseList = [],
        bbRegExp,
        pbbRegExp,
        pbbRegExp2,
        openTags,
        closeTags;

    /* -----------------------------------------------------------------------------
     * tags
     * This object contains a list of tags that your code will be able to understand.
     * Each tag object has the following properties:
     *
     *   openTag - A function that takes in the tag's parameters (if any) and its
     *             contents, and returns what its HTML open tag should be.
     *             Example: [color=red]test[/color] would take in "=red" as a
     *             parameter input, and "test" as a content input.
     *             It should be noted that any BBCode inside of "content" will have
     *             been processed by the time it enter the openTag function.
     *
     *   closeTag - A function that takes in the tag's parameters (if any) and its
     *              contents, and returns what its HTML close tag should be.
     *
     *   displayContent - Defaults to true. If false, the content for the tag will
     *                    not be displayed. This is useful for tags like IMG where
     *                    its contents are actually a parameter input.
     *
     *   restrictChildrenTo - A list of BBCode tags which are allowed to be nested
     *                        within this BBCode tag. If this property is omitted,
     *                        any BBCode tag may be nested within the tag.
     *
     *   restrictParentsTo - A list of BBCode tags which are allowed to be parents of
     *                       this BBCode tag. If this property is omitted, any BBCode
     *                       tag may be a parent of the tag.
     *
     *   noParse - true or false. If true, none of the content WITHIN this tag will be
     *             parsed by the XBBCode parser.
     *
     *
     *
     * LIMITIONS on adding NEW TAGS:
     *  - Tag names should be alphanumeric (including underscores) and all tags should have an opening tag
     *    and a closing tag.
     *    The [*] tag is an exception because it was already a standard
     *    bbcode tag. Technecially tags don't *have* to be alphanumeric, but since
     *    regular expressions are used to parse the text, if you use a non-alphanumeric
     *    tag names, just make sure the tag name gets escaped properly (if needed).
     * --------------------------------------------------------------------------- */

    tags = {
        "b": {
            openTag: function(params,content) {
                return '<b>';
            },
            closeTag: function(params,content) {
                return '</b>';
            }
        },
		"br": {
			openTag: function(params,content) {
                return '<br>';
            },
            closeTag: function(params,content) {
                return '';
            }
		},
        "center": {
            openTag: function(params,content) {
                return '<div style="text-align: center;">';
            },
            closeTag: function(params,content) {
                return '</div>';
            }
        },

        "code": {
            openTag: function(params,content) {
                return '<div class="codetext"><pre>';
            },
            closeTag: function(params,content) {
                return '</pre></div>';
            },
            noParse: true
        },
        "color": {
            openTag: function(params,content) {
                params = params || '';
                
                var colorCode = (params.substr(1)).toLowerCase() || "black";
                colorNamePattern.lastIndex = 0;
                colorCodePattern.lastIndex = 0;
                if ( !colorNamePattern.test( colorCode ) ) {
                    if ( !colorCodePattern.test( colorCode ) ) {
                        colorCode = "black";
                    } else {
                        if (colorCode.substr(0,1) !== "#") {
                            colorCode = "#" + colorCode;
                        }
                    }
                }
                return '<span style="color:' + colorCode + '">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "i": {
            openTag: function(params,content) {
                return '<i>';
            },
            closeTag: function(params,content) {
                return '</i>';
            }
        },
        "img": {
            openTag: function(params,content) {
				params = params || '';
                
                var align = (params.substr(1)).toLowerCase() || "";
				if (align == "align=left") {
					align = "img-a-l";
				} else if (align == "align=right") {
					align = "img-a-r";
				} else {
					align = "";
				}
				
                var myUrl = content;

                urlPattern.lastIndex = 0;
                if ( !urlPattern.test( myUrl ) ) {
                    myUrl = "";
                }

                return '<img style="vertical-align:bottom" class="userimg ' + align + '" src="' + myUrl + '" />';
            },
            closeTag: function(params,content) {
                return '';
            },
            displayContent: false
        },
		"list": {
            openTag: function(params,content) {
				params = params || '';
				
				var type = (params.substr(1)).toLowerCase() || "";
				
				if (type == 1) {
					return '<ol>';
				} else {
					return '<ul>';
				}
            },
            closeTag: function(params,content) {
                params = params || '';
				
				var type = (params.substr(1)).toLowerCase() || "";
				
				if (type == 1) {
					return '</ol>';
				} else {
					return '</ul>';
				}
            },
            restrictChildrenTo: ["*", "li"]
        },
        "quote": {
            openTag: function(params,content) {
                params = params || '';

                var user = (params.substr(1).toLowerCase() || "");

                if (user) {
                    return '<div class="quotetext"><strong>' + user + ' said:</strong><br>';
                } else {
                    return '<div class="quotetext">';
                }
            },
            closeTag: function(params,content) {
                return '</div>';
            }
        },
		"right": {
            openTag: function(params,content) {
                return '<div style="text-align: right;">';
            },
            closeTag: function(params,content) {
                return '</div>';
            }
        },
        "s": {
            openTag: function(params,content) {
                return '<span style="text-decoration:line-through;">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "size": {
            openTag: function(params,content) {
                params = params || '';

                var mySize = parseInt(params.substr(1),10) || 0;

                return '<span style="font-size:' + mySize +'%;">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
		"spoiler": {
			openTag: function(params,content) {
                var title = "spoiler";

				if (params) {
                    title = params.substr(1).replace("\"", "");
                }
				
                return '<div class="spoiler"><input type="button" class="button show_button" onclick="this.nextSibling.style.display=\'inline-block\';this.style.display=\'none\';" data-showname="Show ' + title + '" data-hidename="Hide ' + title + '" value="Show ' + title + '"><span class="spoiler_content" style="display:none"><input type="button" class="button hide_button" onclick="this.parentNode.style.display=\'none\';this.parentNode.parentNode.childNodes[0].style.display=\'inline-block\';" value="Hide ' + title + '"><br>';
            },
            closeTag: function(params,content) {
                return '</span></div>';
            }
		},
        "u": {
            openTag: function(params,content) {
                return '<u>';
            },
            closeTag: function(params,content) {
                return '</u>';
            }
        },
        "url": {
            openTag: function(params,content) {

                var myUrl;

                if (!params) {
                    myUrl = content.replace(/<.*?>/g,"");
                } else {
                    myUrl = params.substr(1);
                }

                urlPattern.lastIndex = 0;
                if ( !urlPattern.test( myUrl ) ) {
                    myUrl = "#";
                }

                return '<a href="' + myUrl + '" rel="nofollow">';
            },
            closeTag: function(params,content) {
                return '</a>';
            }
        },
		"yt": {			
			openTag: function(params,content) {
                return '<iframe width="420" height="345" src="https://www.youtube.com/embed/' + content + '"/>';
            },
            closeTag: function(params,content) {
                return '</iframe>';
            },
			displayContent: false
		},
        /*
            The [*] tag is special since the user does not define a closing [/*] tag when writing their bbcode.
            Instead this module parses the code and adds the closing [/*] tag in for them. None of the tags you
            add will act like this and this tag is an exception to the others.
        */
        "*": {
            openTag: function(params,content) {
                return "<li>";
            },
            closeTag: function(params,content) {
                return "</li>";
            },
            restrictParentsTo: ["list","ul","ol"]
        }
    };

    // create tag list and lookup fields
    function initTags() {
        tagList = [];
        var prop,
            ii,
            len;
        for (prop in tags) {
            if (tags.hasOwnProperty(prop)) {
                if (prop === "*") {
                    tagList.push("\\" + prop);
                } else {
                    tagList.push(prop);
                    if ( tags[prop].noParse ) {
                        tagsNoParseList.push(prop);
                    }
                }

                tags[prop].validChildLookup = {};
                tags[prop].validParentLookup = {};
                tags[prop].restrictParentsTo = tags[prop].restrictParentsTo || [];
                tags[prop].restrictChildrenTo = tags[prop].restrictChildrenTo || [];

                len = tags[prop].restrictChildrenTo.length;
                for (ii = 0; ii < len; ii++) {
                    tags[prop].validChildLookup[ tags[prop].restrictChildrenTo[ii] ] = true;
                }
                len = tags[prop].restrictParentsTo.length;
                for (ii = 0; ii < len; ii++) {
                    tags[prop].validParentLookup[ tags[prop].restrictParentsTo[ii] ] = true;
                }
            }
        }

        bbRegExp = new RegExp("<bbcl=([0-9]+) (" + tagList.join("|") + ")([ =][^>]*?)?>((?:.|[\\r\\n])*?)<bbcl=\\1 /\\2>", "gi");
        pbbRegExp = new RegExp("\\[(" + tagList.join("|") + ")([ =][^\\]]*?)?\\]([^\\[]*?)\\[/\\1\\]", "gi");
        pbbRegExp2 = new RegExp("\\[(" + tagsNoParseList.join("|") + ")([ =][^\\]]*?)?\\]([\\s\\S]*?)\\[/\\1\\]", "gi");

        // create the regex for escaping ['s that aren't apart of tags
        (function() {
            var closeTagList = [];
            for (var ii = 0; ii < tagList.length; ii++) {
                if ( tagList[ii] !== "\\*" ) { // the * tag doesn't have an offical closing tag
                    closeTagList.push ( "/" + tagList[ii] );
                }
            }

            openTags = new RegExp("(\\[)((?:" + tagList.join("|") + ")(?:[ =][^\\]]*?)?)(\\])", "gi");
            closeTags = new RegExp("(\\[)(" + closeTagList.join("|") + ")(\\])", "gi");
        })();

    }
    initTags();

    // -----------------------------------------------------------------------------
    // private functions
    // -----------------------------------------------------------------------------

    function checkParentChildRestrictions(parentTag, bbcode, bbcodeLevel, tagName, tagParams, tagContents, errQueue) {

        errQueue = errQueue || [];
        bbcodeLevel++;

        // get a list of all of the child tags to this tag
        var reTagNames = new RegExp("(<bbcl=" + bbcodeLevel + " )(" + tagList.join("|") + ")([ =>])","gi"),
            reTagNamesParts = new RegExp("(<bbcl=" + bbcodeLevel + " )(" + tagList.join("|") + ")([ =>])","i"),
            matchingTags = tagContents.match(reTagNames) || [],
            cInfo,
            errStr,
            ii,
            childTag,
            pInfo = tags[parentTag] || {};

        reTagNames.lastIndex = 0;

        if (!matchingTags) {
            tagContents = "";
        }

        for (ii = 0; ii < matchingTags.length; ii++) {
            reTagNamesParts.lastIndex = 0;
            childTag = (matchingTags[ii].match(reTagNamesParts))[2].toLowerCase();

            if ( pInfo && pInfo.restrictChildrenTo && pInfo.restrictChildrenTo.length > 0 ) {
                if ( !pInfo.validChildLookup[childTag] ) {
                    errStr = "The tag \"" + childTag + "\" is not allowed as a child of the tag \"" + parentTag + "\".";
                    errQueue.push(errStr);
                }
            }
            cInfo = tags[childTag] || {};
            if ( cInfo.restrictParentsTo.length > 0 ) {
                if ( !cInfo.validParentLookup[parentTag] ) {
                    errStr = "The tag \"" + parentTag + "\" is not allowed as a parent of the tag \"" + childTag + "\".";
                    errQueue.push(errStr);
                }
            }

        }

        tagContents = tagContents.replace(bbRegExp, function(matchStr, bbcodeLevel, tagName, tagParams, tagContents ) {
            errQueue = checkParentChildRestrictions(tagName.toLowerCase(), matchStr, bbcodeLevel, tagName, tagParams, tagContents, errQueue);
            return matchStr;
        });
        return errQueue;
    }

    /*
        This function updates or adds a piece of metadata to each tag called "bbcl" which
        indicates how deeply nested a particular tag was in the bbcode. This property is removed
        from the HTML code tags at the end of the processing.
    */
    function updateTagDepths(tagContents) {
        tagContents = tagContents.replace(/\<([^\>][^\>]*?)\>/gi, function(matchStr, subMatchStr) {
            var bbCodeLevel = subMatchStr.match(/^bbcl=([0-9]+) /);
            if (bbCodeLevel === null) {
                return "<bbcl=0 " + subMatchStr + ">";
            } else {
                return "<" + subMatchStr.replace(/^(bbcl=)([0-9]+)/, function(matchStr, m1, m2) {
                    return m1 + (parseInt(m2, 10) + 1);
                }) + ">";
            }
        });
        return tagContents;
    }

    /*
        This function removes the metadata added by the updateTagDepths function
    */
    function unprocess(tagContent) {
        return tagContent.replace(/<bbcl=[0-9]+ \/\*>/gi,"").replace(/<bbcl=[0-9]+ /gi,"&#91;").replace(/>/gi,"&#93;")
                         .replace(/ &#91;br&#93;&#91;\/br&#93; /g, "\n");
    }

    var replaceFunct = function(matchStr, bbcodeLevel, tagName, tagParams, tagContents) {

        tagName = tagName.toLowerCase();

        var processedContent = tags[tagName].noParse ? unprocess(tagContents) : tagContents.replace(bbRegExp, replaceFunct),
            openTag = tags[tagName].openTag(tagParams,processedContent),
            closeTag = tags[tagName].closeTag(tagParams,processedContent);

        if ( tags[tagName].displayContent === false) {
            processedContent = "";
        }

        return openTag + processedContent + closeTag;
    };

    function parse(config) {
        var output = config.text;
        output = output.replace(bbRegExp, replaceFunct);
        return output;
    }

    /*
        The star tag [*] is special in that it does not use a closing tag. Since this parser requires that tags to have a closing
        tag, we must pre-process the input and add in closing tags [/*] for the star tag.
        We have a little levaridge in that we know the text we're processing wont contain the <> characters (they have been
        changed into their HTML entity form to prevent XSS and code injection), so we can use those characters as markers to
        help us define boundaries and figure out where to place the [/*] tags.
    */
    function fixStarTag(text) {
        text = text.replace(/\[(?!\*[ =\]]|list([ =][^\]]*)?\]|\/list[\]])/ig, "<");
        text = text.replace(/\[(?=list([ =][^\]]*)?\]|\/list[\]])/ig, ">");

        while (text !== (text = text.replace(/>list([ =][^\]]*)?\]([^>]*?)(>\/list])/gi, function(matchStr,contents,endTag) {

            var innerListTxt = matchStr;
            while (innerListTxt !== (innerListTxt = innerListTxt.replace(/\[\*\]([^\[]*?)(\[\*\]|>\/list])/i, function(matchStr,contents,endTag) {
                if (endTag.toLowerCase() === ">/list]") {
                    endTag = "</*]</list]";
                } else {
                    endTag = "</*][*]";
                }
                return "<*]" + contents + endTag;
            })));

            innerListTxt = innerListTxt.replace(/>/g, "<");
            return innerListTxt;
        })));

        // add ['s for our tags back in
        text = text.replace(/</g, "[");
        return text;
    }

    function addBbcodeLevels(text) {
        while ( text !== (text = text.replace(pbbRegExp, function(matchStr, tagName, tagParams, tagContents) {
            matchStr = matchStr.replace(/\[/g, "<");
            matchStr = matchStr.replace(/\]/g, ">");
            return updateTagDepths(matchStr);
        })) );
        return text;
    }

    // -----------------------------------------------------------------------------
    // public functions
    // -----------------------------------------------------------------------------

    // API, Expose all available tags
    me.tags = function() {
        return tags;
    };

    // API
    me.addTags = function(newtags) {
        var tag;
        for (tag in newtags) {
            tags[tag] = newtags[tag];
        }
        initTags();
    };

    me.process = function(config) {
        var ret = {html: "", error: false},
            errQueue = [];

        config.text = config.text.replace(/</g, "&lt;"); // escape HTML tag brackets
        config.text = config.text.replace(/>/g, "&gt;"); // escape HTML tag brackets

        config.text = config.text.replace(openTags, function(matchStr, openB, contents, closeB) {
            return "<" + contents + ">";
        });
        config.text = config.text.replace(closeTags, function(matchStr, openB, contents, closeB) {
            return "<" + contents + ">";
        });

        config.text = config.text.replace(/\[/g, "&#91;"); // escape ['s that aren't apart of tags
        config.text = config.text.replace(/\]/g, "&#93;"); // escape ['s that aren't apart of tags
        config.text = config.text.replace(/</g, "["); // escape ['s that aren't apart of tags
        config.text = config.text.replace(/>/g, "]"); // escape ['s that aren't apart of tags

        // process tags that don't have their content parsed
        while ( config.text !== (config.text = config.text.replace(pbbRegExp2, function(matchStr, tagName, tagParams, tagContents) {
            tagContents = tagContents.replace(/\[/g, "&#91;");
            tagContents = tagContents.replace(/\]/g, "&#93;");
            tagParams = tagParams || "";
            tagContents = tagContents || "";
            return "[" + tagName + tagParams + "]" + tagContents + "[/" + tagName + "]";
        })) );

        config.text = fixStarTag(config.text); // add in closing tags for the [*] tag
        config.text = addBbcodeLevels(config.text); // add in level metadata

        errQueue = checkParentChildRestrictions("bbcode", config.text, -1, "", "", config.text);

        ret.html = parse(config);

        if ( ret.html.indexOf("[") !== -1 || ret.html.indexOf("]") !== -1) {
            errQueue.push("Some tags appear to be misaligned.");
        }

        if (config.removeMisalignedTags) {
            ret.html = ret.html.replace(/\[.*?\]/g,"");
        }
        if (config.wrapper) {
            ret.html = '<div id="word-break">' + ret.html + '</div>';
        }

		if (!config.escapeHtml) {
			ret.html = ret.html.replace("&#91;", "["); // put ['s back in
        	ret.html = ret.html.replace("&#93;", "]"); // put ['s back in
		}

        ret.error = errQueue.length !== 0;
        ret.errorQueue = errQueue;

        return ret;
    };

    return me;
})();

/////////////////////////////////////////////////////////////////////
// END OF BBCODE TO HTML PARSER
/////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function(event) {
	init();
});

function init() {
    // textarea listener
    document.getElementById("bbcode").addEventListener("input", function() {
        let autoPreview = document.getElementById("auto-preview").checked;

        if (autoPreview) {
            loadParser();
        }
    });

    // submit button listener
    document.getElementById("submit").addEventListener("click", loadParser);
    
    // bbcode buttons listeners
    let buttons = document.querySelectorAll("#bbcode-buttons input.btn");
    for (let button of buttons) {
        button.addEventListener("click", function(event) {
            event.preventDefault();
            insertBBCODE(event.srcElement.value);
        });
    }

    // size selection listener
    document.getElementById("sizeSelection").addEventListener("change", function(event) {
        document.getElementById("size").value = event.target.value;
    });

    // size sumbit listener
    document.getElementById("sizeSubmit").addEventListener("click",  function(){
        insertBBCODE("size");
    });

    // color selection listener
    document.getElementById("colorSelection").addEventListener("change", function(event) {
        document.getElementById("color").value = event.target.value;
    });

    // color wheel listener
    document.getElementById("colorWheel").addEventListener("change", function() {
        document.getElementById("color").value = event.target.value;
    });

    // color sumbit listener
    document.getElementById("colorSubmit").addEventListener("click",  function(){
        insertBBCODE("color");
    });
}

function loadParser() {
    let html = document.getElementById("word-break");
    html.parentNode.removeChild(html);
    
    let result = runParser(document.getElementById("bbcode-textarea").value.replace(/(?:\r\n|\r|\n)/g, ' [br][/br] '));
    document.getElementById("html").insertAdjacentHTML('afterbegin', result.html);
}

function runParser(content) {
	return XBBCODE.process(
		{
			text: content,
			removeMisalignedTags: false,
			wrapper: true
		}
	);
}

function insertBBCODE(type) {
    let textArea = document.getElementById("bbcode-textarea");
    let start = textArea.selectionStart;
    let end = textArea.selectionEnd;
    let selection = textArea.value.substring(start, end);
    let [tagOpen, innerText, tagClosed, selectionPos] = createBBCODE(type, selection);

    if (tagOpen.length > 0) {
        textArea.focus();
        document.execCommand("insertText", false, tagOpen + innerText + tagClosed);
        textArea.selectionStart = start + selectionPos;
        textArea.selectionEnd = end + selectionPos;
        
        let autoPreview = document.getElementById("auto-preview").checked;

        if (autoPreview) {
            loadParser();
        }
    }
}

function createBBCODE(type, innerText = "") {
    let tagOpen, tagClose, selectionPos = 0;

    switch(type.toLowerCase().trim()) {
        case "bold":
            tagOpen = "[b]";
            tagClose = "[/b]";

            break;

        case "italic":
            tagOpen = "[i]";
            tagClose = "[/i]";

            break;

        case "strike":
            tagOpen = "[s]";
            tagClose = "[/s]";

            break;     

        case "underline":
            tagOpen = "[u]";
            tagClose = "[/u]";

            break;
        
        case "center":
            tagOpen = "[center]";
            tagClose = "[/center]";

            break;
        
        case "right":
            tagOpen = "[right]";
            tagClose = "[/right]";

            break;

        case "code":
            tagOpen = "[code]";
            tagClose = "[/code]";

            break;

        case "url":
            let url = prompt("Insert URL", "");

            if (url == null) {
                break;
            }

            tagOpen = "[url=" + url + "]";
            tagClose = "[/url]";

            break;
        
        case "spoiler":
            let spoiler = prompt("Insert Spoiler name (optional)", "");

            if (spoiler == null) {
                break;
            }

            tagOpen = "[spoiler=" + spoiler + "]";
            tagClose = "[/spoiler]";

            break;

        case "img":
            tagOpen = "[img]";
            tagClose = "[/img]";

            if (!innerText) {
                let imgURL = prompt("Insert Image URL", "");

                if (imgURL == null) {
                    break;
                }

                innerText = imgURL;
                selectionPos = imgURL.length + tagClose.length;
            }

            break;

        case "img left":
            tagOpen = "[img align=left]";
            tagClose = "[/img]";

            if (!innerText) {
                let imgURLLeft = prompt("Insert Image URL", "");

                if (imgURLLeft == null) {
                    break;
                }

                innerText = imgURLLeft;
                selectionPos = imgURLLeft.length + tagClose.length;
            }

            break;

        case "img right":
            tagOpen = "[img align=right]";
            tagClose = "[/img]";

            if (!innerText) {
                let imgURLRight = prompt("Insert Image URL", "");

                if (imgURLRight == null) {
                    break;
                }

                innerText = imgURLRight;
                selectionPos = imgURLRight.length + tagClose.length;
            }

            break;

        case "size":
            let txtSize = document.getElementById("size").value;

            tagOpen = "[size=" + String(txtSize) + "]";
            tagClose = "[/size]";

            break;

        case "youtube":
            tagOpen = "[yt]";
            tagClose = "[/yt]";

            if (!innerText) {
                let yt = prompt("Insert youtube url", "");

                if (yt == null) {
                    break;
                }

                innerText = getVideoInfoFromUrl(yt, "v") || yt;
                selectionPos = innerText.length + tagClose.length;
            }

            break;

        case "color":
            color = document.getElementById("color").value;

            if (color == null) {
                break;
            }

            tagOpen = "[color=" + String(color) + "]";
            tagClose = "[/color]";

            break;

        case "quote":
            let quote = prompt("Insert quoted person name (optional)", "");

            if (quote == null) {
                break;
            }

            tagOpen = quote.length > 0 ? "[quote=" + quote + "]" : "[quote]";
            tagClose = "[/quote]";

            break;

        case "list":
            tagOpen = "[list]\n[*]";
            tagClose = "\n[/list]";

            break;

        case "ordered list":
            tagOpen = "[list=1]\n[*]";
            tagClose = "\n[/list]";

            break;

        case "list item":
            tagOpen = "\n[*]";
            tagClose = "";

            break;
    }

    selectionPos += tagOpen.length;

    return [tagOpen, innerText, tagClose, selectionPos];
}

function getVideoInfoFromUrl(url, info) {
    if (url.indexOf("?") === -1) {
        return null;
    }

    var urlVariables = url.split("?")[1].split("&"),
        varName;

    for (var i = 0; i < urlVariables.length; i++) {
        varName = urlVariables[i].split("=");

        if (varName[0] === info) {
            return varName[1] === undefined ? null : varName[1];
        }
    }
}

