import { runParser } from "./bbcode2html";

test('xss prevention', function () {

    let bbcode = '<script>alert("hello");</script>';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('&lt;script&gt;alert(&quot;hello&quot;)&#59;&lt;/script&gt;');

});

test('xss prevention with bbcode', function () {

    let bbcode = '[b]<script>alert("hello");</script>[/b]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<b>&lt;script&gt;alert(&quot;hello&quot;)&#59;&lt;/script&gt;</b>');

});

test('broken parameters returns unparsed bbcode', function () {

    let bbcode = '[spoiler="test "test"][/spoiler]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('[spoiler=&quot;test &quot;test&quot;][/spoiler]');

});

test('test newlines 1', function () {

    let bbcode = '\ntest\n';

    let html = runParser(bbcode, false).html;

	expect(html).toBe(`<br>
test<br>
`);

});

test('test newlines 2', function () {

    let bbcode = '\r\ntest\r\n';

    let html = runParser(bbcode, false).html;

	expect(html).toBe(`<br>
test<br>
`);

});

test('test newlines 3', function () {

    let bbcode = 'test\n\r\n';

    let html = runParser(bbcode, false).html;

	expect(html).toBe(`test<br>
<br>
`);

});

test('test newlines 4', function () {

    let bbcode = '\r\n\ntest';

    let html = runParser(bbcode, false).html;

	expect(html).toBe(`<br>
<br>
test`);

});

test('horizontal rule', function () {

    let bbcode = '[hr]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<hr>');

});

test('bold', function () {

    let bbcode = '[b]this is bold[/b]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<b>this is bold</b>');

});

test('italic', function () {

    let bbcode = '[i]this is italic[/i]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<i>this is italic</i>');

});

test('strikethrough', function () {

    let bbcode = '[s]this is strikethrough[/s]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<span style="text-decoration:line-through;">this is strikethrough</span>');

});

test('underline', function () {

    let bbcode = '[u]this is underlined[/u]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<u>this is underlined</u>');

});

test('center', function () {

    let bbcode = '[center]this is centered text[/center]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<div style="text-align: center;">this is centered text</div>');

});

test('right', function () {

    let bbcode = '[right]this is right aligned text[/right]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<div style="text-align: right;">this is right aligned text</div>');

});

test('justify', function () {

    let bbcode = '[justify]this is justified text[/justify]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<div style="text-align: justify;">this is justified text</div>');

});

test('subscript', function () {

    let bbcode = '[sub]this is subscript[/sub]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<sub>this is subscript</sub>');

});

test('superscript', function () {

    let bbcode = '[sup]this is superscript[/sup]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<sup>this is superscript</sup>');

});

test('code', function () {

    let bbcode = '[code]this is code[/code]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<div class="codetext"><pre>this is code</pre></div>');

});

test('code, should not parse inner bbcode', function () {

    let bbcode = '[code]this is code, with [b]bbcode[/b] inside[/code]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<div class="codetext"><pre>this is code, with [b]bbcode[/b] inside</pre></div>');

});

test('code, with newlines', function () {

    let bbcode = `[code]
this is an example of bbcode that will return bold text:
[b]this is bold text[/b]
[/code]`;

    let html = runParser(bbcode, false).html;

    let expectedHtml = `<div class="codetext"><pre>
this is an example of bbcode that will return bold text:
[b]this is bold text[/b]
</pre></div>`;

	expect(html).toBe(expectedHtml);

});

test('preformatted text', function () {

    let bbcode = `[pre]
this is preformatted text
    - and this is some more text
[/pre]`;

    let html = runParser(bbcode, false).html;

    let expectedHtml = `<pre>
this is preformatted text
    - and this is some more text
</pre>`;

	expect(html).toBe(expectedHtml);

});

test('preformatted text, should not parse inner bbcode', function () {

    let bbcode = `[pre]
this is preformatted text
    - and this is some [bbcode]that should not be parsed[/bbcode]
[/pre]`;

    let html = runParser(bbcode, false).html;

    let expectedHtml = `<pre>
this is preformatted text
    - and this is some [bbcode]that should not be parsed[/bbcode]
</pre>`;

	expect(html).toBe(expectedHtml);

});

test('url', function () {

    let bbcode = '[url=https://www.youtube.com/watch?v=dQw4w9WgXcQ]definitely not a rickroll[/url]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="nofollow noopener noreferrer">definitely not a rickroll</a>');

});

test('youtube', function () {

    let bbcode = '[yt]dQw4w9WgXcQ[/yt]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<iframe width="425" height="355" frameborder="0" src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=1"/></iframe>');

});

test('spoiler', function () {

    let bbcode = '[spoiler]The one piece is not treasure but the friends we made along the way[/spoiler]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe(`<div class="spoiler"><input type="button" class="button show_button" onclick="this.nextSibling.style.display='inline-block';this.style.display='none';" data-showname="Show spoiler" data-hidename="Hide spoiler" value="Show spoiler"><span class="spoiler_content" style="display:none"><input type="button" class="button hide_button" onclick="this.parentNode.style.display='none';this.parentNode.parentNode.childNodes[0].style.display='inline-block';" value="Hide spoiler"><br>The one piece is not treasure but the friends we made along the way</span></div>`);

});

test('named spoiler', function () {

    let bbcode = '[spoiler="One Piece"]The one piece is not treasure but the friends we made along the way[/spoiler]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe(`<div class="spoiler"><input type="button" class="button show_button" onclick="this.nextSibling.style.display='inline-block';this.style.display='none';" data-showname="Show One Piece" data-hidename="Hide One Piece" value="Show One Piece"><span class="spoiler_content" style="display:none"><input type="button" class="button hide_button" onclick="this.parentNode.style.display='none';this.parentNode.parentNode.childNodes[0].style.display='inline-block';" value="Hide One Piece"><br>The one piece is not treasure but the friends we made along the way</span></div>`);

});

test('quote', function () {

    let bbcode = '[quote]hello world![/quote]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<div class="quotetext">hello world!</div>');

});

test('quote with name', function () {

    let bbcode = '[quote=Cptmathix]hello world![/quote]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<div class="quotetext" data-user="Cptmathix"><strong>Cptmathix said:</strong><br>hello world!</div>');

});

test('quote with name and message id', function () {

    let bbcode = '[quote=Cptmathix message=56610471]hello world![/quote]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<div class="quotetext" data-id="56610471" data-user="Cptmathix"><strong><a href="https://myanimelist.net/forum/message/56610471?goto=topic">Cptmathix said:</a></strong><br>hello world!</div>');

});

test('image', function () {

    let bbcode = '[img]https://i.imgur.com/4049zHa.png[/img]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<img class="userimg" src="https://i.imgur.com/4049zHa.png" style="width:auto;height:auto;">');

});

test('image with alt and title', function () {

    let bbcode = '[img alt="Albert Einstein" title="This is Albert Einstein"]https://i.imgur.com/4049zHa.png[/img]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<img class="userimg" src="https://i.imgur.com/4049zHa.png" alt="Albert Einstein" title="This is Albert Einstein" style="width:auto;height:auto;">');

});

test('image with width and height', function () {

    let bbcode = '[img width="100" height="125"]https://i.imgur.com/4049zHa.png[/img]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<img class="userimg" src="https://i.imgur.com/4049zHa.png" style="width:100px;height:125px;">');

});

test('image with width x height', function () {

    let bbcode = '[img=125x100]https://i.imgur.com/4049zHa.png[/img]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<img class="userimg" src="https://i.imgur.com/4049zHa.png" style="width:125px;height:100px;">');

});

test('image with width x height and width and height', function () {

    let bbcode = '[img=125x100 width="200" height="300"]https://i.imgur.com/4049zHa.png[/img]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<img class="userimg" src="https://i.imgur.com/4049zHa.png" style="width:200px;height:300px;">');

});

test('image align left', function () {

    let bbcode = '[img align=left]https://i.imgur.com/4049zHa.png[/img]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<img class="userimg img-a-l" src="https://i.imgur.com/4049zHa.png" style="width:auto;height:auto;">');

});

test('image align right', function () {

    let bbcode = '[img align=right]https://i.imgur.com/4049zHa.png[/img]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<img class="userimg img-a-r" src="https://i.imgur.com/4049zHa.png" style="width:auto;height:auto;">');

});

test('image with all possible parameters', function () {

    let bbcode = '[img align=right alt="Albert Einstein" title="This is Albert Einstein" width="100" height="90"]https://i.imgur.com/4049zHa.png[/img]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<img class="userimg img-a-r" src="https://i.imgur.com/4049zHa.png" alt="Albert Einstein" title="This is Albert Einstein" style="width:100px;height:90px;">');

});

test('two images with all possible parameters', function () {

    let bbcode = `
[img align=right alt="Albert Einstein" title="This is Albert Einstein" width="100" height="100"]https://i.imgur.com/4049zHa.png[/img]
[img=100x100 align=left alt="Albert Einstein" title="This is Albert Einstein"]https://i.imgur.com/4049zHa.png[/img]`;

    let expectedHtml = `<br>
<img class="userimg img-a-r" src="https://i.imgur.com/4049zHa.png" alt="Albert Einstein" title="This is Albert Einstein" style="width:100px;height:100px;"><br>
<img class="userimg img-a-l" src="https://i.imgur.com/4049zHa.png" alt="Albert Einstein" title="This is Albert Einstein" style="width:100px;height:100px;">`;

    let html = runParser(bbcode, false).html;

	expect(html).toBe(expectedHtml);

});

test('unordered list', function () {

    let bbcode = `[list]
[*]one
[*]two
[/list]`;

    let html = runParser(bbcode, false).html;

    let expectedHtml = `<ul><br>
<li>one<br>
</li><li>two<br>
</li></ul>`;

	expect(html).toBe(expectedHtml);

});

test('ordered list', function () {

    let bbcode = `[list=1]
[*]one
[*]two
[/list]`;

    let html = runParser(bbcode, false).html;

    let expectedHtml = `<ol><br>
<li>one<br>
</li><li>two<br>
</li></ol>`;

	expect(html).toBe(expectedHtml);

});

test('nested lists', function () {

    let bbcode = `[list=1]
[*]1
[*]2
[list]
[*]2.1
[*]2.2
[/list]
[/list]`;

        let html = runParser(bbcode, false).html;

        let expectedHtml = `<ol><br>
<li>1<br>
</li><li>2<br>
<ul><br>
<li>2.1<br>
</li><li>2.2<br>
</li></ul><br>
</li></ol>`;

        expect(html).toBe(expectedHtml);

});

test('tables', function () {

let bbcode = `[table]
[tr]
[th]number[/th]
[th]value[/th]
[/tr]
[tr]
[td]5[/td]
[td]five[/td]
[/tr]
[tr]
[td]10[/td]
[td]ten[/td]
[/tr]
[/table]`;

        let html = runParser(bbcode, false).html;

        let expectedHtml = `<table class="bbcode-table"><tbody><br>
<tr><br>
<th>number</th><br>
<th>value</th><br>
</tr><br>
<tr><br>
<td>5</td><br>
<td>five</td><br>
</tr><br>
<tr><br>
<td>10</td><br>
<td>ten</td><br>
</tr><br>
</tbody></table>`;

        expect(html).toBe(expectedHtml);

});

test('color', function () {

    let bbcode = '[color=red]this is red[/color]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<span style="color:red">this is red</span>');

});

test('color, using hex', function () {

    let bbcode = '[color=#00ff00]this is light green[/color]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<span style="color:#00ff00">this is light green</span>');

});

test('size', function () {

    let bbcode = '[size=200]this is larger text[/size]';

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<span style="font-size:200%;">this is larger text</span>');

});

test('font, with fallback', function () {

    let bbcode = `[font='Roboto, sans-serif']this is another font[/font]`;

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<span style="font-family:Roboto, sans-serif;">this is another font</span>');

});

test('font, with fallback using double quotes', function () {

    let bbcode = `[font="Roboto, sans-serif"]this is another font[/font]`;

    let html = runParser(bbcode, false).html;

	expect(html).toBe('<span style="font-family:Roboto, sans-serif;">this is another font</span>');

});

test('verify multiple bbcodes together', function () {

    let bbcode = `
[b]this is bold[/b]
[i]this is italic[/i]
[s]this is strikethrough[/s]
[u]this is underlined[/u]
th[b]i[/b] [s]is[/s] [u][i]complicated![/i][/u]
[center]this is centered text[/center]
[right]this is right aligned text[/right]
[justify]this is justified text[/justify]
[sub]this is subscript[/sub]
[sup]this is superscript[/sup]
[code]
this is an example of bbcode that will return bold text:
[b]this is bold text[/b]
[/code]
[pre]
this is preformatted text
    - and this is some [bbcode]that should not be parsed[/bbcode]
[/pre]
[url=https://www.youtube.com/watch?v=dQw4w9WgXcQ]definitely not a rickroll[/url]
[spoiler]The one piece is not treasure but the friends we made along the way[/spoiler]
[spoiler="One Piece"]The one piece is not treasure but the friends we made along the way[/spoiler]
[quote]hello world![/quote]
[quote=Cptmathix]hello world![/quote]
[quote=Cptmathix message=56610471]hello world![/quote]
[img align=right alt="Albert Einstein" title="This is Albert Einstein" width="100" height="90"]https://i.imgur.com/4049zHa.png[/img]
[img=100x100 align=left alt="Albert Einstein" title="This is Albert Einstein"]https://i.imgur.com/4049zHa.png[/img]
[list=1]
[*]1
[*]2
[list]
[*]2.1
[*]2.2
[/list]
[/list]
[table][tr][th]number[/th][th]value[/th][/tr][tr][td]5[/td][td]five[/td][/tr][tr][td]10[/td][td]ten[/td][/tr][/table]
[color=red]this is red[/color]
[color=#00ff00]this is light green[/color]
[size=200]this is larger text[/size]
[font='Roboto, sans-serif']this is another font[/font]`;

    let html = runParser(bbcode, false).html;

    let expectedHtml = `<br>
<b>this is bold</b><br>
<i>this is italic</i><br>
<span style="text-decoration:line-through;">this is strikethrough</span><br>
<u>this is underlined</u><br>
th<b>i</b> <span style="text-decoration:line-through;">is</span> <u><i>complicated!</i></u><br>
<div style="text-align: center;">this is centered text</div><br>
<div style="text-align: right;">this is right aligned text</div><br>
<div style="text-align: justify;">this is justified text</div><br>
<sub>this is subscript</sub><br>
<sup>this is superscript</sup><br>
<div class="codetext"><pre>
this is an example of bbcode that will return bold text:
[b]this is bold text[/b]
</pre></div><br>
<pre>
this is preformatted text
    - and this is some [bbcode]that should not be parsed[/bbcode]
</pre><br>
<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="nofollow noopener noreferrer">definitely not a rickroll</a><br>
<div class="spoiler"><input type="button" class="button show_button" onclick="this.nextSibling.style.display='inline-block';this.style.display='none';" data-showname="Show spoiler" data-hidename="Hide spoiler" value="Show spoiler"><span class="spoiler_content" style="display:none"><input type="button" class="button hide_button" onclick="this.parentNode.style.display='none';this.parentNode.parentNode.childNodes[0].style.display='inline-block';" value="Hide spoiler"><br>The one piece is not treasure but the friends we made along the way</span></div><br>
<div class="spoiler"><input type="button" class="button show_button" onclick="this.nextSibling.style.display='inline-block';this.style.display='none';" data-showname="Show One Piece" data-hidename="Hide One Piece" value="Show One Piece"><span class="spoiler_content" style="display:none"><input type="button" class="button hide_button" onclick="this.parentNode.style.display='none';this.parentNode.parentNode.childNodes[0].style.display='inline-block';" value="Hide One Piece"><br>The one piece is not treasure but the friends we made along the way</span></div><br>
<div class="quotetext">hello world!</div><br>
<div class="quotetext" data-user="Cptmathix"><strong>Cptmathix said:</strong><br>hello world!</div><br>
<div class="quotetext" data-id="56610471" data-user="Cptmathix"><strong><a href="https://myanimelist.net/forum/message/56610471?goto=topic">Cptmathix said:</a></strong><br>hello world!</div><br>
<img class="userimg img-a-r" src="https://i.imgur.com/4049zHa.png" alt="Albert Einstein" title="This is Albert Einstein" style="width:100px;height:90px;"><br>
<img class="userimg img-a-l" src="https://i.imgur.com/4049zHa.png" alt="Albert Einstein" title="This is Albert Einstein" style="width:100px;height:100px;"><br>
<ol><br>
<li>1<br>
</li><li>2<br>
<ul><br>
<li>2.1<br>
</li><li>2.2<br>
</li></ul><br>
</li></ol><br>
<table class="bbcode-table"><tbody><tr><th>number</th><th>value</th></tr><tr><td>5</td><td>five</td></tr><tr><td>10</td><td>ten</td></tr></tbody></table><br>
<span style="color:red">this is red</span><br>
<span style="color:#00ff00">this is light green</span><br>
<span style="font-size:200%;">this is larger text</span><br>
<span style="font-family:Roboto, sans-serif;">this is another font</span>`;

	expect(html).toBe(expectedHtml);

})