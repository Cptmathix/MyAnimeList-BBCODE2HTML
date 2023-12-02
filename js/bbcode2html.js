/* eslint-disable no-case-declarations */
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

let XBBCODE = (function () {
    "use strict";

    // -----------------------------------------------------------------------------
    // Set up private variables
    // -----------------------------------------------------------------------------

    let me = {},
        urlPattern = /^(?:https?|file|c):(?:\/{1,3}|\\{1})[-a-zA-Z0-9:;,@#%&()~_?+=/\\.]*$/,
        colorNamePattern = /^(?:aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/,
        colorCodePattern = /^#?[a-fA-F0-9]{6}$/,
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
     * LIMITATIONS on adding NEW TAGS:
     *  - Tag names should be alphanumeric (including underscores) and all tags should have an opening tag
     *    and a closing tag.
     *    The [*] tag is an exception because it was already a standard
     *    bbcode tag. Technecially tags don't *have* to be alphanumeric, but since
     *    regular expressions are used to parse the text, if you use a non-alphanumeric
     *    tag names, just make sure the tag name gets escaped properly (if needed).
     * --------------------------------------------------------------------------- */

    tags = {
        "b": {
            openTag: () => '<b>',
            closeTag: () => '</b>'
        },
        "br": {
            openTag: () => '<br>'
        },
        "center": {
            openTag: () => '<div style="text-align: center;">',
            closeTag: () => '</div>'
        },
        "code": {
            openTag: () => '<div class="codetext"><pre>',
            closeTag: () => '</pre></div>',
            noParse: true
        },
        "color": {
            openTag: (params) => {
                let colorCode = params.get('color') || "black";

                if (!colorNamePattern.test(colorCode)) {
                    if (!colorCodePattern.test(colorCode)) {
                        colorCode = "black";
                    } else {
                        if (colorCode.substr(0, 1) !== "#") {
                            colorCode = "#" + colorCode;
                        }
                    }
                }

                return '<span style="color:' + colorCode + '">';
            },
            closeTag: () => '</span>'
        },
        "font": {
            openTag: (params) => {
                let font = params.get('font')?.replace(/'/g, "") || "inherit";
                return '<span style="font-family:' + font + ';">';
            },
            closeTag: () => '</span>'
        },
        "hr": {
            openTag: () => '<hr>',
            singleTag: true
        },
        "i": {
            openTag: () => '<i>',
            closeTag: () => '</i>'
        },
        "img": {
            openTag: (params, content) => {
                let align = params.get('align');
                let alt = params.get('alt');
                let title = params.get('title');
                let width = params.get('width');
                let height = params.get('height');
                let widthxheight = params.get('img'); // [img=widthxheight]

                let classNames = "userimg"
                if (align == "left") {
                    classNames += " img-a-l";
                } else if (align == "right") {
                    classNames += " img-a-r";
                }

                let altAttr = alt ? `alt="${alt}"` : "";
                let titleAttr = title ? `title="${title}"` : "";

                if (widthxheight && /^\d+x\d+$/.test(widthxheight)) {
                    let [w, h] = widthxheight.split("x");
                    width = width || w;
                    height = height || h;
                }

                width = width ? width + "px" : "auto";
                height = height ? height + "px" : "auto";
                let styleAttr = `style="width:${width};height:${height};"`;

                let attributes = [altAttr, titleAttr, styleAttr].filter(Boolean).join(" ");

                let url = content;
                if (!urlPattern.test(url)) {
                    url = "";
                }

                return '<img class="' + classNames + '" src="' + url + '" ' + attributes + '>';
            },
            displayContent: false
        },
        "justify": {
            openTag: () => '<div style="text-align: justify;">',
            closeTag: () => '</div>'
        },
        "list": {
            openTag: (params) => {
                let type = parseInt(params.get('list')) || 0;

                if (type === 1) {
                    return '<ol>';
                } else {
                    return '<ul>';
                }
            },
            closeTag: (params) => {
                let type = parseInt(params.get('list')) || 0;

                if (type === 1) {
                    return '</ol>';
                } else {
                    return '</ul>';
                }
            },
            restrictChildrenTo: ["*", "br"]
        },
        "pre": {
            openTag: () => '<pre>',
            closeTag: () => '</pre>',
            noParse: true
        },
        "quote": {
            openTag: (params) => {
                let user = params.get('quote');
                let messageId = params.get('message')

                if (user && messageId) {
                    return '<div class="quotetext" data-id="' + messageId + '" data-user="' + user + '"><strong><a href="https://myanimelist.net/forum/message/' + messageId + '?goto=topic">' + user + ' said:</a></strong><br>'
                } else if (user) {
                    return '<div class="quotetext" data-user="' + user + '"><strong>' + user + ' said:</strong><br>';
                } else {
                    return '<div class="quotetext">';
                }
            },
            closeTag: () => '</div>'
        },
        "right": {
            openTag: () => '<div style="text-align: right;">',
            closeTag: () => '</div>'
        },
        "s": {
            openTag: () => '<span style="text-decoration:line-through;">',
            closeTag: () => '</span>'
        },
        "size": {
            openTag: (params) => {
                let size = params.get('size');
                return '<span style="font-size:' + size + '%;">';
            },
            closeTag: () => '</span>'
        },
        "spoiler": {
            openTag: (params) => {
                let title = params.get('spoiler')?.replace("\"", "") || "spoiler";

                return '<div class="spoiler"><input type="button" class="button show_button" onclick="this.nextSibling.style.display=\'inline-block\';this.style.display=\'none\';" data-showname="Show ' + title + '" data-hidename="Hide ' + title + '" value="Show ' + title + '"><span class="spoiler_content" style="display:none"><input type="button" class="button hide_button" onclick="this.parentNode.style.display=\'none\';this.parentNode.parentNode.childNodes&#91;0&#93;.style.display=\'inline-block\';" value="Hide ' + title + '"><br>';
            },
            closeTag: () => '</span></div>'
        },
        "sub": {
            openTag: () => '<sub>',
            closeTag: () => '</sub>'
        },
        "sup": {
            openTag: () => '<sup>',
            closeTag: () => '</sup>'
        },
        "table": {
            openTag: () => '<table class="bbcode-table"><tbody>',
            closeTag: () => '</tbody></table>',
            restrictChildrenTo: ["tr", "br"]
        },
        "td": {
            openTag: () => '<td>',
            closeTag: () => '</td>',
            restrictParentsTo: ["tr"]
        },
        "th": {
            openTag: () => '<th>',
            closeTag: () => '</th>',
            restrictParentsTo: ["tr"]
        },
        "tr": {
            openTag: () => '<tr>',
            closeTag: () => '</tr>',
            restrictChildrenTo: ["td", "th", "br"],
            restrictParentsTo: ["table"]
        },
        "u": {
            openTag: () => '<u>',
            closeTag: () => '</u>'
        },
        "url": {
            openTag: (params, content) => {
                let url;

                if (!params.get('url')) {
                    url = content.replace(/<.*?>/g, "");
                } else {
                    url = params.get('url');
                }

                if (!urlPattern.test(url)) {
                    url = "#";
                }

                return '<a href="' + url + '" target="_blank" rel="nofollow noopener noreferrer">';
            },
            closeTag: () => '</a>'
        },
        "yt": {
            openTag: (_, content) => '<iframe width="425" height="355" frameborder="0" src="https://www.youtube.com/embed/' + content + '?rel=1"/>',
            closeTag: () => '</iframe>',
            displayContent: false
        },
        /*
            The [*] tag is special since the user does not define a closing [/*] tag when writing their bbcode.
            Instead this module parses the code and adds the closing [/*] tag in for them. None of the tags you
            add will act like this and this tag is an exception to the others.
        */
        "*": {
            openTag: () => "<li>",
            closeTag: () => "</li>",
            restrictParentsTo: ["list"]
        }
    };

    // create tag list and lookup fields
    function initTags() {
        tagList = [];
        let prop,
            ii,
            len;
        for (prop in tags) {
            if (Object.prototype.hasOwnProperty.call(tags, prop)) {
                if (prop === "*") {
                    tagList.push("\\" + prop);
                } else {
                    tagList.push(prop);
                    if (tags[prop].noParse) {
                        tagsNoParseList.push(prop);
                    }
                }

                tags[prop].validChildLookup = {};
                tags[prop].validParentLookup = {};
                tags[prop].restrictParentsTo = tags[prop].restrictParentsTo || [];
                tags[prop].restrictChildrenTo = tags[prop].restrictChildrenTo || [];

                len = tags[prop].restrictChildrenTo.length;
                for (ii = 0; ii < len; ii++) {
                    tags[prop].validChildLookup[tags[prop].restrictChildrenTo[ii]] = true;
                }
                len = tags[prop].restrictParentsTo.length;
                for (ii = 0; ii < len; ii++) {
                    tags[prop].validParentLookup[tags[prop].restrictParentsTo[ii]] = true;
                }
            }
        }

        bbRegExp = new RegExp("<bbcl=([0-9]+) (" + tagList.join("|") + ")([ =][^>]*?)?>((?:.|[\\r\\n])*?)<bbcl=\\1 /\\2>", "gi");
        pbbRegExp = new RegExp("\\[(" + tagList.join("|") + ")([ =][^\\]]*?)?\\]([^\\[]*?)\\[/\\1\\]", "gi");
        pbbRegExp2 = new RegExp("\\[(" + tagsNoParseList.join("|") + ")([ =][^\\]]*?)?\\]([\\s\\S]*?)\\[/\\1\\]", "gi");

        // create the regex for escaping ['s that aren't apart of tags
        (function () {
            let closeTagList = [];
            for (var ii = 0; ii < tagList.length; ii++) {
                if (tagList[ii] !== "\\*") { // the * tag doesn't have an offical closing tag
                    closeTagList.push("/" + tagList[ii]);
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

    function checkParentChildRestrictions(parentTag, _bbcode, bbcodeLevel, _tagName, _tagParams, tagContents, errQueue) {

        errQueue = errQueue || [];
        bbcodeLevel++;

        // get a list of all of the child tags to this tag
        let reTagNames = new RegExp("(<bbcl=" + bbcodeLevel + " )(" + tagList.join("|") + ")([ =>])", "gi"),
            reTagNamesParts = new RegExp("(<bbcl=" + bbcodeLevel + " )(" + tagList.join("|") + ")([ =>])", "i"),
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

            if (pInfo && pInfo.restrictChildrenTo && pInfo.restrictChildrenTo.length > 0) {
                if (!pInfo.validChildLookup[childTag]) {
                    errStr = "The tag \"" + childTag + "\" is not allowed as a child of the tag \"" + parentTag + "\".";
                    errQueue.push(errStr);
                }
            }
            cInfo = tags[childTag] || {};
            if (cInfo.restrictParentsTo.length > 0) {
                if (!cInfo.validParentLookup[parentTag]) {
                    errStr = "The tag \"" + parentTag + "\" is not allowed as a parent of the tag \"" + childTag + "\".";
                    errQueue.push(errStr);
                }
            }
        }

        tagContents = tagContents.replace(bbRegExp, (matchStr, bbcodeLevel, tagName, tagParams, tagContents) => {
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
        tagContents = tagContents.replace(/<([^>][^>]*?)>/gi, (_matchStr, subMatchStr) => {
            let bbCodeLevel = subMatchStr.match(/^bbcl=([0-9]+) /);
            if (bbCodeLevel === null) {
                return "<bbcl=0 " + subMatchStr + ">";
            } else {
                return "<" + subMatchStr.replace(/^(bbcl=)([0-9]+)/, (_matchStr, m1, m2) => m1 + (parseInt(m2, 10) + 1)) + ">";
            }
        });
        return tagContents;
    }

    /*
        This function removes the metadata added by the updateTagDepths function
    */
    function unprocess(tagContent) {
        return tagContent.replace(/<bbcl=[0-9]+ \/\*>/gi, "").replace(/<bbcl=[0-9]+ /gi, "&#91;").replace(/>/gi, "&#93;");
    }

    function parseParameters(tagName, tagParams) {
        let result = new Map();

        if (!tagParams) { return result }

        tagParams = tagParams.replaceAll('&#39;', '"');
        tagParams = tagParams.replaceAll('&quot;', '"');
        let paramList = tagParams.trim().match(/((?:[^\s"]+|"[^"]*")+)/g);

        for (var param of paramList) {
            let [key, ...value] = param.split("=");

            key = key?.toLowerCase() || tagName;
            value = value.join('=').replace(/^"+|"+$/g, '');

            if (value.includes('"')) {
                return null;
            }

            result.set(key, value);
        }

        return result;
    }

    let replaceFunc = (matchStr, _bbcodeLevel, tagName, tagParams, tagContents) => {
        tagName = tagName.toLowerCase();

        let parsedParameters = parseParameters(tagName, tagParams);
        if (parsedParameters === null) {
            return unprocess(matchStr)
        }

        let tag = tags[tagName];
        let processedContent = tag.noParse ? unprocess(tagContents) : tagContents.replace(bbRegExp, replaceFunc);
        let openTag = (tag.openTag) ? tag.openTag(parsedParameters, processedContent) : "";
        let closeTag = (tag.closeTag) ? tag.closeTag(parsedParameters, processedContent) : "";

        if (tag.displayContent === false) {
            processedContent = "";
        }

        return openTag + processedContent + closeTag;
    };

    function parse(config) {
        let output = config.text;
        output = output.replace(bbRegExp, replaceFunc);
        return output;
    }

    function parseSingleTags(text) {
        for (var tag in tags) {
            if (tags[tag].singleTag) {
                text = text.replaceAll(`[${tag}]`, tags[tag].openTag());
            }
        }
        return text;
    }

    /*
        The star tag [*] is special in that it does not use a closing tag. Since this parser requires that tags to have a closing
        tag, we must pre-process the input and add in closing tags [/*] for the star tag.
        We have a little leverage in that we know the text we're processing wont contain the <> characters (they have been
        changed into their HTML entity form to prevent XSS and code injection), so we can use those characters as markers to
        help us define boundaries and figure out where to place the [/*] tags.
    */
    function fixStarTag(text) {
        text = text.replace(/\[(?!\*[ =\]]|list([ =][^\]]*)?\]|\/list[\]])/ig, "<");
        text = text.replace(/\[(?=list([ =][^\]]*)?\]|\/list[\]])/ig, ">");

        while (text !== (text = text.replace(/>list([ =][^\]]*)?\]([^>]*?)(>\/list])/gi, (matchStr) => {
            let innerListTxt = matchStr;

            while (innerListTxt !== (innerListTxt = innerListTxt.replace(/\[\*\]([^[]*?)(\[\*\]|>\/list])/i, (_matchStr, contents, endTag) => {
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

    function securityFixes(text) {
        return text
            .replaceAll(';', '&#59;')
            .replaceAll("'", '&#39;')
            .replaceAll('"', '&quot;');
    }

    function addBbcodeLevels(text) {
        while (text !== (text = text.replace(pbbRegExp, (matchStr) => {
            matchStr = matchStr.replace(/\[/g, "<");
            matchStr = matchStr.replace(/\]/g, ">");
            return updateTagDepths(matchStr);
        })));
        return text;
    }

    // -----------------------------------------------------------------------------
    // public functions
    // -----------------------------------------------------------------------------

    // API, Expose all available tags
    me.tags = () => tags;

    // API
    me.addTags = (newtags) => {
        let tag;
        for (tag in newtags) {
            tags[tag] = newtags[tag];
        }
        initTags();
    };

    me.process = (config) => {
        let ret = { html: "", error: false }, errQueue = [];

        config.text = securityFixes(config.text);

        if (config.convertLineBreaksToBbcode) {
            config.text = config.text.replace(/(?:\r\n|\r|\n)/g, '[br][/br]\n');
        }

        config.text = config.text.replace(/</g, "&lt;"); // escape HTML tag brackets
        config.text = config.text.replace(/>/g, "&gt;"); // escape HTML tag brackets

        config.text = config.text.replace(openTags, (_matchStr, _openB, contents) => "<" + contents + ">");
        config.text = config.text.replace(closeTags, (_matchStr, _openB, contents) => "<" + contents + ">");

        config.text = config.text.replace(/\[/g, "&#91;"); // escape ['s that aren't apart of tags
        config.text = config.text.replace(/\]/g, "&#93;"); // escape ]'s that aren't apart of tags
        config.text = config.text.replace(/</g, "["); // replace <'s that aren't apart of tags
        config.text = config.text.replace(/>/g, "]"); // replace >'s that aren't apart of tags


        // process tags that don't have their content parsed
        while (config.text !== (config.text = config.text.replace(pbbRegExp2, (_matchStr, tagName, tagParams, tagContents) => {

            // Newlines should not be converted to [br] in tags that don't have their content parsed
            if (config.convertLineBreaksToBbcode) {
                tagContents = tagContents.replaceAll('[br][/br]', '');
            }

            tagContents = tagContents.replace(/\[/g, "&#91;");
            tagContents = tagContents.replace(/\]/g, "&#93;");
            tagParams = tagParams || "";
            tagContents = tagContents || "";

            return "[" + tagName + tagParams + "]" + tagContents + "[/" + tagName + "]";

        })));

        config.text = fixStarTag(config.text); // add in closing tags for the [*] tag
        config.text = addBbcodeLevels(config.text); // add in level metadata

        errQueue = checkParentChildRestrictions("bbcode", config.text, -1, "", "", config.text);

        ret.html = parse(config);
        ret.html = parseSingleTags(ret.html);

        if (ret.html.indexOf("[") !== -1 || ret.html.indexOf("]") !== -1) {
            errQueue.push("Some tags appear to be misaligned.");
        }

        if (config.removeMisalignedTags) {
            ret.html = ret.html.replace(/\[.*?\]/g, "");
        }

        if (config.addInLineBreaks) {
            ret.html = '<div style="white-space:pre-wrap;">' + ret.html + '</div>';
        }

        if (config.wrapper) {
            ret.html = '<div id="word-break">' + ret.html + '</div>';
        }

        if (!config.escapeHtml) {
            ret.html = ret.html.replace(/&#91;/g, "["); // put ['s back in
            ret.html = ret.html.replace(/&#93;/g, "]"); // put ]'s back in
        }

        ret.error = errQueue.length !== 0;
        ret.errorQueue = errQueue;

        console.assert(!ret.error, ret.errorQueue);

        return ret;
    };

    return me;
})();

/////////////////////////////////////////////////////////////////////
// END OF BBCODE TO HTML PARSER
/////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", () => { init() });

function init() {
    // textarea listener
    document.getElementById("bbcode").addEventListener("input", textareaUpdate);

    // submit button listener
    document.getElementById("submit").addEventListener("click", loadParser);

    // bbcode buttons listeners
    let newButtons = document.querySelectorAll("#bbcode-buttons button.bbcode");
    for (let button of newButtons) {
        button.addEventListener("click", (event) => {
            event.preventDefault();

            let bbcode = event.target.closest("button").dataset.bbcode;
            let bbcodeParam = event.target.closest("button").dataset.param;
            if (bbcode) {
                insertBBCODE(bbcode, bbcodeParam);
            }
        });
    }

    // color wheel listener
    document.getElementById("colorWheel").addEventListener("change", (event) => {
        insertBBCODE("color", event.target.value);
    });

    // remove new lines button
    document.getElementById("removeNewLines").addEventListener("click", () => {
        removeNewLinesFromSelection();
    });
}

function textareaUpdate() {
    runAutoPreview()

    var inputText = document.querySelector("#bbcode-textarea").value;
    var chars = inputText.match(/(?:[^\r\n]|\r(?!\n))/g);
    document.querySelector('#characters').innerHTML = chars?.length ?? 0;
}

function loadParser() {
    let html = document.getElementById("word-break");
    html.parentNode.removeChild(html);

    let result = runParser(document.getElementById("bbcode-textarea").value);
    document.getElementById("html-cell").insertAdjacentHTML('afterbegin', result.html);
}

function runParser(content, shouldWrap = true) {
    return XBBCODE.process({
        text: content,
        convertLineBreaksToBbcode: true,
        removeMisalignedTags: false,
        wrapper: shouldWrap
    });
}

function removeNewLinesFromSelection() {
    let textArea = document.getElementById("bbcode-textarea");
    let start = textArea.selectionStart;
    let end = textArea.selectionEnd;
    let selection = textArea.value.substring(start, end);
    let selectionWithoutNewlines = selection.replace(/\n/g, "")

    insertAtCursor(textArea, selectionWithoutNewlines);
    textArea.selectionStart = start;
    textArea.selectionEnd = end + selectionWithoutNewlines.length;

    runAutoPreview();
}

function insertAtCursor(input, textToInsert) {
    input.focus();
    const isSuccess = document.execCommand("insertText", false, textToInsert);

    // Firefox (non-standard method)
    if (!isSuccess && typeof input.setRangeText === "function") {
        const start = input.selectionStart;
        input.setRangeText(textToInsert);
        // update cursor to be at the end of insertion
        input.selectionStart = input.selectionEnd = start + textToInsert.length;

        // Notify any possible listeners of the change
        const e = document.createEvent("UIEvent");
        e.initEvent("input", true, false);
        input.dispatchEvent(e);
    }
}

function insertBBCODE(type, param) {
    let textArea = document.getElementById("bbcode-textarea");
    let start = textArea.selectionStart;
    let end = textArea.selectionEnd;
    let selection = textArea.value.substring(start, end);
    let [tagOpen, innerText, tagClosed, selectionPos, cancelled] = createBBCODE(type, param, selection);

    if (!cancelled && tagOpen.length > 0) {
        insertAtCursor(textArea, tagOpen + innerText + tagClosed);
        textArea.selectionStart = start + selectionPos;
        textArea.selectionEnd = end + selectionPos;

        runAutoPreview();
    }
}

function runAutoPreview() {
    let autoPreview = document.getElementById("auto-preview").checked;
    if (autoPreview) {
        loadParser();
    }
}

function createBBCODE(type, param, innerText = "") {
    let tagOpen, tagClose, selectionPos = 0, cancelled = false;

    switch (type.toLowerCase().trim()) {
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

        case "justify":
            tagOpen = "[justify]";
            tagClose = "[/justify]";

            break;

        case "subscript":
            tagOpen = "[sub]";
            tagClose = "[/sub]";

            break;

        case "superscript":
            tagOpen = "[sup]";
            tagClose = "[/sup]";

            break;

        case "pre":
            tagOpen = "[pre]\n";
            tagClose = "\n[/pre]";

            break;

        case "hr":
            tagOpen = "[hr]";
            tagClose = "";

            break;

        case "code":
            tagOpen = "[code]";
            tagClose = "[/code]";

            break;

        case "url":
            let url = prompt("Insert URL", "");

            if (url == null) {
                cancelled = true;
                break;
            }

            tagOpen = "[url=" + url + "]";
            tagClose = "[/url]";

            break;

        case "spoiler":
            let spoiler = prompt("Insert Spoiler name (optional)", "");

            if (spoiler == null) {
                cancelled = true;
                break;
            }

            tagOpen = "[spoiler=" + spoiler + "]";
            tagClose = "[/spoiler]";

            break;

        case "img":
            let imgURL = prompt("Insert Image URL", "");

            if (imgURL == null) {
                cancelled = true;
                break;
            }

            innerText = imgURL;
            tagOpen = "[img]";
            tagClose = "[/img]";
            selectionPos = innerText.length + tagClose.length;

            break;

        case "size":
            tagOpen = "[size=" + param + "]";
            tagClose = "[/size]";

            break;

        case "font":
            tagOpen = "[font='" + param + "']";
            tagClose = "[/font]";

            break;

        case "youtube":
            let yt = prompt("Insert youtube video url", "");

            if (yt == null) {
                cancelled = true;
                break;
            }

            innerText = getVideoInfoFromUrl(yt, "v") || yt;
            tagOpen = "[yt]";
            tagClose = "[/yt]";
            selectionPos = innerText.length + tagClose.length;

            break;

        case "color":
            if (param == null) {
                cancelled = true;
                break;
            }

            tagOpen = "[color=" + param + "]";
            tagClose = "[/color]";

            break;

        case "quote":
            let quote = prompt("Insert quoted person name (optional)", "");

            if (quote == null) {
                cancelled = true;
                break;
            }

            tagOpen = quote.length > 0 ? "[quote=" + quote + "]" : "[quote]";
            tagClose = "[/quote]";

            break;

        case "list-ul":
            let u_items = parseInt(prompt("How many list items?", ""));

            if (isNaN(u_items)) {
                cancelled = true;
                break;
            }

            tagOpen = "[list]\n[*]";
            tagClose = `${"\n[*]".repeat(u_items - 1)}\n[/list]`;

            break;

        case "list-ol":
            let o_items = parseInt(prompt("How many list items?", ""));

            if (isNaN(o_items)) {
                cancelled = true;
                break;
            }

            tagOpen = "[list=1]\n[*]";
            tagClose = `${"\n[*]".repeat(o_items - 1)}\n[/list]`;

            break;

        case "table":
            let columns = parseInt(prompt("How many table columns?", ""));

            if (isNaN(columns)) {
                cancelled = true;
                break;
            }

            let rows = parseInt(prompt("How many table rows?", ""));

            if (isNaN(rows)) {
                cancelled = true;
                break;
            }

            let columns_header_string = `${"\n[th]title[/th]".repeat(columns)}`
            let columns_string = `${("\n[td]" + innerText + "[/td]").repeat(columns)}`

            tagOpen = `[table]\n[tr]${columns_header_string}\n[/tr]`;
            tagClose = `${`\n[tr]${columns_string}\n[/tr]`.repeat(rows)}\n[/table]`;
            innerText = "";
            selectionPos += 10;

            break;

        default:
            return;
    }

    if (!cancelled) {
        selectionPos += tagOpen?.length;
    }

    return [tagOpen, innerText, tagClose, selectionPos, cancelled];
}

function getVideoInfoFromUrl(url, info) {
    if (url.indexOf("?") === -1) {
        return null;
    }

    let urlVariables = url.split("?")[1].split("&"),
        varName;

    for (let i = 0; i < urlVariables.length; i++) {
        varName = urlVariables[i].split("=");

        if (varName[0] === info) {
            return varName[1] === undefined ? null : varName[1];
        }
    }
}

// for jest testing
if (typeof exports !== 'undefined') {
    module.exports = { runParser };
}