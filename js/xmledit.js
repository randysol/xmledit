1 /*
 2  xmledit.js v1.0.0 (2012-01-02)
 3
 4  (c) 2012-2013 rsolton
 5
 6  License: none
 7 */
XMLParser = function() {
    this.isInit = false;
    this.isAlert = false;

    this.init = function(inXml)
    {
        if (!this.isInit) {
            this.lex = new XMLLex();
            this.lex.init(inXml);
            this.isInit = true;
            this.rootXml = {}
        }
        this.lineNumber = 1;
        this.tagCount = 0;
        this.isVerbose = false;
    }

    this.parse = function() {
        this.init();

        this.scan(); // get first token
        //try {
            if (this.isOpenTag("TokenTagQuestionMark")) {
                this.rootXml.declaration = this.token.attributes;
                this.scan();
            }
            var i = 0;
            var limit = 100; // sanity
            while (this.moreTokens() && i < limit) {
                this.rootXml.children = this.parseXMLTag();
                this.scan();
            }
        //}
        /*catch (err) {
            isInit = false;
            console.log("Parse Error", err)
        }*/

        console.log("parsed root", this.rootXml)
        return(this.rootXml);
    }

    this.parseXMLTag = function() {

        var tagName = this.token.lexime.strVal;
        var node = {
            name: tagName,
            type: "";
            value: "", // CDATA
            children: [],
            attributes: this.token.attributes,
            setValue: function() {
                this.value = value; // set any dirty flags and/or notify listeners
            }
        };
        if (this.token.tagType == "TagTypeOpen") {
            this.scan();
            if (this.isVerbose) {
                console.log("looking for tag", tagName);
            }
            while (this.moreTokens() && !(this.token.tagType === "TagTypeClose" && this.token.lexime.strVal === tagName)) {
                if (this.token.tagType == "TagTypeOpen") {
                    node.children.push(this.parseXMLTag());
                }
                else if (this.token.tagType == "TagTypeEmpty") {
                    node.children.push(this.parseXMLTag());
                }
                else if (this.token.tokenTag == "TokenTagCharData") {
                    node.value = this.token.lexime.strVal;
                }
                this.scan();
            }
            if (this.token.tagType === "TagTypeClose" && this.token.lexime.strVal === tagName)  {
                if (this.isVerbose) {
                    console.log("Found tag", tagName)
                }
            }
        }
        return(node);

    }

    this.scan = function() {
        this.token = this.lex.getToken();
        if (this.isVerbose) {
            console.log("token", this.token);
        }
        var lineNumber = this.lineNumber;
        this.lineNumber = lineNumber + this.token.newLineCount;

        while (this.token.tokenTag === "TokenTagEOL" || this.token.tokenTag == "TokenTagComment") {
            if (this.token.tokenTag === "TokenTagEOL") {
                ++this.lineNumber;
            }
            this.token = this.lex.getToken();
            if (this.isVerbose) {
                console.log("token", this.token);
            }
        }
        this.incrTagCount();
    }

    this.isOpenTag = function (tagName) {
        return(this.token.tagType == "TagTypeOpen" && this.token.tokenTag === tagName);
    }

    this.incrTagCount = function() {
        ++this.tagCount;
    }
    this.moreTokens = function() {
        return(this.lex.moreTokens());
    }
}

XMLLex = function() {
    this.test = function() {
        var limit = 100;  // sanity
        var i = 0;
        var token = this.getToken();
        while (token.tokenTag != "TokenTagEndOfTokens" && i++ < limit) {
            console.log("token", token);
            token = this.getToken();
        }
        //console.log("Token Count", this.tagCount)
    }

    this.init = function (inXml) {
        this.tagCount = 0;
        this.keywords = {
            "name": "TokenTagName",
            "?xml": "TokenTagQuestionMark",
            "!--": "TokenTagComment"
        };

        var testXml = typeof inXml != "undefined" ? inXml : '<Quota async="false" continueOnError="false" enabled="true" name="Quota-11076350647579356"><DisplayName>Quota Policy</DisplayName><FaultRules/><Properties/><Allow count="2000"/><Interval ref="request.header.quota_count">1</Interval><Distributed>false</Distributed><Synchronous>false</Synchronous><TimeUnit ref="request.header.quota_timeout">month</TimeUnit></Quota>';
        this.stream = new IoStream(testXml);
    }

    this.initToken = function() {
        var token = {
            tokenTag: 0,
            tagType: "",
            size: 0,
            intValue: 0, // IntegerLiteral and HexLiteral values
            newLineCount: 0,
            lexime: {length: 0, strVal: ""},
            attributes: [] // nameValue Vector
        }
        return(token);
    }

    this.makeTagToken = function(token)
    {
        var word = "";
        var len = 0;
        var stream = this.stream;

        token.tokenTag = "TokenTagElementTag";
        token.tagType = "TagTypeOpen";

        var c = stream.readChar();
        if (c == '/') {
            token.tagType = "TagTypeClose";  // DWIT: really "Empty tag?
            this.decrTagCount();
            c = stream.readChar();
        }

        var isOk = true;
        var isEnd = false;
        var isCdata = false;
        while (!stream.endOfStream() && !isEnd && isOk) {
            if (!isCdata && !this.validTokenChar(c)) {
                if (c == '\r') {
                    token.newLineCount++;
                }
                if (word === "!--") { // comment?
                    word = "";
                    token.tokenTag = "TokenTagComment";
                    while (!stream.endOfStream() && !isEnd) {
                        if (c == '-') {
                            c = stream.readChar();
                            if (c == '-') {
                                c = stream.readChar();
                                if (c == '>') {
                                    isEnd = true;
                                }
                                else {
                                    word += '--' + c;
                                }
                            }
                            else {
                                word += '-' + c;
                            }
                        }
                        else {
                            word += c;
                        }
                        c = stream.readChar();

                    }
                }
                else {
                    termination = this.getattributes(token);
                    if (termination === "OptionTerminationNormalClose") {
                        isEnd = true;
                    }
                    else if (termination === "OptionTerminationEmptyClose") {
                        isEnd = true;
                        token.tagType = "TagTypeEmpty";
                    }
                }
            }
            else {
                ++len;
                word += c;
                if (c == '\r') {
                    token.newLineCount++;
                }

                if (!isCdata  && len == 8 && word.substring(0,8) === "![CDATA[") {
                    token.tagType = "";
                    isCdata = true;
                    word = ""; // start over
                    len = 0;
                }
                c = stream.readChar();
                if (isCdata) { //look for "]]>"
                    if (c == ']') {
                        var c2 = c = stream.readChar();
                        if (c2 == ']') {
                            var c3 = stream.readChar();
                            if (c3 == '>') {
                                isEnd = true;
                            }
                            else {
                                word += c2 + c3;
                            }
                        }
                        else {
                            word += c;
                            c = c2;
                            ++len;
                        }
                    }
                }
                else {
                    isEnd = c == '>';
                }
            }

        }
        token.lexime.strVal = word;
        token.lexime.length = len;


        if (!isEnd) {
            token.tokenTag = "TokenTagUnterminatedTag";
        }
        else {
            if (isCdata) {
                token.tokenTag = "TokenTagCharData";
                this.incrTagCount();
            }
            else {

                if (len > 0 && word.substring(word.length-1, word.length) == '/') { // last char
                    --len;
                    word = word.substring(0, word.length-1); // remove ending slash
                    token.tagType = "TagTypeEmpty";
                    token.lexime.strVal = word;
                    token.lexime.length = len;
                }
                if (token.tokenTag == "TokenTagElementTag") {
                    this.incrTagCount();
                }
                var tokenTag = this.lookupKeyword(word);
                if (tokenTag != "TokenTagNoToken") {
                    token.tokenTag = tokenTag;
                }
            }
        }
        return(isOk);
    }

    this.getToken = function() {
        var token = this.initToken();
        var tokenTag = "TokenTagEndOfTokens";
        var len = 1;
        token.newLineCount = 0;

        var stream = this.stream;
        var c = stream.readChar();
        // skip leading whitespace
        while (!stream.endOfStream() && this.anyWhitespace(c))	{
            if (c == '\r') {
                token.newLineCount++;
            }
            c = this.stream.readChar();
        }
        if (!stream.endOfStream()) {
            switch (c) {
                case '\r':
                    c = this.stream.readChar();
                    if (c != '\n') {
                       this.stream.unreadChar();
                    }
                    tokenTag = "TokenTagEOL";
                    break;

                case '<':
                    this.makeTagToken(token);
                    tokenTag = token.tokenTag;
                    len = token.lexime.length;
                    break;

                // CDATA
                default:
                    word = "";

                    while (!stream.endOfStream() && c != '<') {
                        if (c == '\r') {
                            token.newLineCount++;
                        }
                        word += c;
                        c = stream.readChar();
                        ++len;
                    }

                    // trim trailing whitespace -->
                    while (this.anyWhitespace(word.substring(word.length-1, word.length)) && (len-1) >= 0) {
                        word = word.substring(0,word.length-1);
                        --len;
                    }
                    // <-- trim trailing whitespace

                    if (!stream.endOfStream()) {
                        stream.unreadChar();
                    }
                    tokenTag = "TokenTagCharData";

                    token.lexime.strVal = word;
            }
        }

        token.tokenTag = tokenTag;
        token.lexime.length = len;

        return(token);


    }

    this.lookupKeyword = function(word) {
        return ((typeof this.keywords[word] != "undefined") ? this.keywords[word] : "TokenTagNoToken");
    }

    this.getattributes = function(token) {
        var termination = "OptionTerminationNormalClose";
        var stream = this.stream;
        var word = "";
        var isOk = true;

        var c = stream.readChar();
        // skip white space
        while (!stream.endOfStream() && this.whitespace(c)) {
            c = stream.readChar();
        }

        while (!stream.endOfStream() && c != '>' && isOk) {
            if (c === '=') {
                var name = word;
                word = "";
                c = stream.readChar();
                // skip white space
                while (stream.endOfStream() && this.whitespace(c)) {
                    c = stream.readChar();
                }
                if (c == '"' || c == '\'') {
                    var strObject = {
                        value: ""
                    }
                    isOK = this.makeStringLiteral(strObject, c);
                    var value = strObject.value;
                    if (!isOK) {
                       termination = "OptionTerminationMissingEndQuote";
                    }
                    c = stream.readChar();
                    // skip white space
                    while (!stream.endOfStream() && this.whitespace(c)) {
                        c = stream.readChar();
                    }
                    var option = {
                        name: name,
                        value: value,
                        setValue: function() {
                            this.value = value; // set any dirty flags and/or notify listeners
                        }
                    };
                    this.addOption(token, option);

                    word = "";
                }
                else {
                    // make unquoted value token
                }
            }
            else if (this.whitespace(c)) {
                // new option begins here
            }
            if (c != '>') {
                if (c == '&') {
                    c = this.substituteCharacterEntityReference();
                }

                word += c;
                c = stream.readChar()
            }

        }
        if (isOK) {
            isOK = (c === '>');
            if (isOK) {
                if (word.substring(word.length-1, word.length) == '/') {
                    termination = "OptionTerminationEmptyClose";
                }
            }
            else {
                termination = "OptionTerminationMissingCloseTag";
            }
        }

        return(termination);

    }
    this.makeStringLiteral = function(strObject, c)
    {
    //--------------------------------------------------------------------------------
    // void makeStringLiteral(buf, c)
    //
    // Handles: 1) Double quoted strings
    //			2) Single quoted strings
    //			3) The following escape sequences:
    //				\'	single quote
    //				\"	double quote
    //				\\	backslash character
    //				\b	backspace
    //				\f	formfeed
    //				\n	linefeed
    //				\r	carriage return
    //				\t	tab
    //				\uhhhh	4 byte hex unicode sequence
    //				\xhh	2 byte hex sequnce
    //				\000	1-3 byte octal sequence
    //
    //--------------------------------------------------------------------------------
        var stream = this.stream;
        var word = "";
        var endChar = c;
        var len = 0;

        var c = stream.readChar();
        while (!stream.endOfStream() && c != endChar) {
            // handle all escape sequences
            if (c == '\\') {
                c = stream.readChar();
                switch (c) {
                    case '\'':	// single quote
                        word += c;
                        break;
                    case '"':	// double quote
                        word += c;
                        break;
                    case '\\':	// backslash char
                        word += c;
                        break;
                    case 'b':
                        word += '\b';
                        break;
                    case 'f':
                        word += '\f';
                        break;
                    case 'n':
                        word += '\n';
                        break;
                    case 'r':
                        word += '\r';
                        break;
                    case 't':
                        word += '\t';
                        break;
                    case 'u':	// unicode sequence
                        {
                            c = stream.readChar();
                            var val = 0;
                            var multiplier = 4096;
                            for (var i = 0; i < 4 && !stream.endOfStream(); ++i) {
                                val += (multiplier * this.hexCharVal(c));
                                multiplier /= 16;
                                if (i < 3) {
                                    c = stream.readChar();
                                }
                            }
                            word += val; // DWIT: unsigned val is desired
                        }
                        break;
                    case 'x':	// hex sequence
                        {
                            c = stream.readChar();
                            var val = 16 * this.hexCharVal(c);
                            if (!stream.endOfStream()) {
                                c = stream.readChar();
                                val += this.hexCharVal(c);
                            }
                            word += String.fromCharCode(val); // DWIT: want unsigned char
                        }
                        break;


                    default:
                        word += '\\';
                        stream.unreadChar();
                }
            }
            else {
                if (c == '&') {
                    c = this.substituteCharacterEntityReference();
                }
                word += c;
            }
            c = stream.readChar();
            ++len;
        }

        strObject.value = word;

        var isOk = (c == endChar);

        return(isOk);
    }

    this.addOption = function(token, option) {
       token.attributes.push(option);
    }

    this.substituteCharacterEntityReference = function()
    {
    //--------------------------------------------------------------------------------
    // substituteCharacterEntityReference()
    //
    // There are hundreds of these.  Here are the four most common:
    //
    // "&lt;" represents the < sign.
    // "&gt;" represents the > sign.
    // "&amp;" represents the & sign.
    // "&quot; represents the " mark.
    //
    //--------------------------------------------------------------------------------
        var stream = this.stream;
        var c = stream.readChar();
        value = 0;

        if (c == '#') { // numeric ?
            var len = 0;
            word = "";
            c = stream.readChar();
            if (c == 'x' || c == 'X') { // hex ?
                c = stream.readChar();
                value = this.getHexDigits(c);
            }
            else {
                value = this.getDecimalDigits(c);
            }
        }
        else {
            var entity = "";
            var limit = 255; // arbitrary
            var i = 0;
            while (!stream.endOfStream() && c != ';' && i++ < limit) {
                entity += c;
                c = stream.readChar();
            }
            if (c == ';') {
                var entities = [
                    {name: "lt", val: 60},
                    {name: "gt", val: 62},
                    {name: "amp", val: 38},
                    {name: "quot", val: 34}
                    ];

                for (var i = 0; i < entities.length && value == 0; ++i) {
                    if (entity === entities[i].name) {
                        value = entities[i].val;
                    }
                }
            }
        }
        return(String.fromCharCode(value));

    }

    this.getHexDigits = function(c) {
    //--------------------------------------------------------------------------------
    // getHexDigits()
    //
    // Lexes a string of hex digits up to maxHexDigits bytes, calculates the integer
    // value of the hex string, and returns that value.
    //
    //--------------------------------------------------------------------------------
        var digitsVals = [];
        var digitCount = 0;
        var word = "";
        var maxHexDigits = 8;

        var stream = this.stream;
        while (!stream.endOfStream() && this.isHexDigit(c) && digitCount < maxHexDigits) {
            word += c;
            digitsVals[digitCount++] = this.hexCharVal(c);
            c = stream.readChar();
        }

        var val = 0;
        var multiplier = 1;
        for (var i = digitCount - 1; i >= 0; --i) {
            val += digitsVals[i] * multiplier;
            multiplier *= 16;
        }

        return(val);

    }

    this.hexCharVal = function(c)  {
    //--------------------------------------------------------------------------------
    // int HexCharVal(c)
    //
    // Calculates the integer value of the character hex digit.
    //
    //--------------------------------------------------------------------------------
        return(parseInt(c, 16));
    }

    this.getDecimalDigits = function(c)
    {
        var stream = this.stream;
        var word = "";
        while (!stream.endOfStream() && this.isDigit(c)) {
            word += c;
            c = stream.readChar();
        }
        return(word - 0); // cast into a number

    }

    this.isDigit = function(c)
    {
        var code = c.charCodeAt(0);
        return((code > 47) && (code <  58));
    }

    this.isHexDigit = function(c)
    {
        var re = new RegExp("[0-9]|[A-F]","i");
        return(re.test(c));
    }

    this.whitespace = function(c) {
        return(c == '\t' || c == ' ');
    }

    this.lineTerminator = function(c) {
        return(c == '\n' || c == '\r');
    }

    this.anyWhitespace = function(c) {
      return(this.whitespace(c) || this.lineTerminator(c));
    }

    this.validTokenChar = function(c) {
        return(!this.anyWhitespace(c));
    }

    this.incrTagCount = function() {
        ++this.tagCount;
    }

    this.decrTagCount = function() {
        --this.tagCount;
    }
    this.moreTokens = function() {
        return(!this.stream.endOfStream());
    }

}

IoStream = function(stream) {
    var stream = stream;
    var streamPos = 0;

    this.readChar = function() {
        return(streamPos < stream.length ? stream[streamPos++] : '');
    }
    this.unreadChar = function() {
        if (streamPos > 0) {
            --streamPos;
        }
    }

    this.endOfStream = function() {
        return(streamPos >= stream.length);
    }
}