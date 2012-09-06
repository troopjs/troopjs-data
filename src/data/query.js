define( [ "troopjs-core/component/base" ], function QueryModule(Component) {
    var UNDEFINED;
    var TRUE = true;
    var FALSE = false;

    var OP = "op";
    var OP_ID = "!";
    var OP_PROPERTY = ".";
    var OP_PATH = ",";
    var OP_QUERY = "|";
    var TEXT = "text";
    var RESOLVED = "resolved";
    var _ID = "id";
    var _EXPIRES = "expires";
    var _COLLAPSED = "collapsed";
    var _AST = "_ast";
    var _QUERY = "_query";

    return Component.extend(function Query(query) {
       var me = this;

       if (query !== UNDEFINED) {
           me[_QUERY] = query;
       }
    }, {
        parse : function parse(query) {
            var me = this;

            // Reset _AST
            delete me[_AST];

            // Set _QUERY
            if (query !== UNDEFINED) {
                me[_QUERY] = query;
            }
            else {
                query = me[_QUERY];
            }

            var i;          // Index
            var l;          // Length
            var c;          // Current character
            var m;          // Current mark
            var q;          // Current quote
            var o;          // Current operation
            var ast = [];   // _AST

            // Step through the query
            for (i = m = 0, l = query.length; i < l; i++) {
                c = query.charAt(i);

                switch (c) {
                    case "\"" : // Double quote
                    case "'" :  // Single quote
                        // Set / unset quote char
                        q = q === c
                            ? UNDEFINED
                            : c;
                        break;

                    case OP_ID :
                        // Break fast if we're quoted
                        if (q !== UNDEFINED) {
                            break;
                        }

                        // Init new op
                        o = {};
                        o[OP] = c;
                        break;

                    case OP_PROPERTY :
                    case OP_PATH :
                        // Break fast if we're quoted
                        if (q !== UNDEFINED) {
                            break;
                        }

                        // If there's an active op, store TEXT and push on _AST
                        if (o !== UNDEFINED) {
                            o[TEXT] = query.substring(m, i);
                            ast.push(o);
                        }

                        // Init new op
                        o = {};
                        o[OP] = c;

                        // Set mark
                        m = i + 1;
                        break;

                    case OP_QUERY :
                    case " " :  // Space
                    case "\t" : // Horizontal tab
                    case "\r" : // Carriage return
                    case "\n" : // Newline
                        // Break fast if we're quoted
                        if (q !== UNDEFINED) {
                            break;
                        }

                        // If there's an active op, store TEXT and push on _AST
                        if (o !== UNDEFINED) {
                            o[TEXT] = query.substring(m, i);
                            ast.push(o);
                        }

                        // Reset op
                        o = UNDEFINED;

                        // Set mark
                        m = i + 1;
                        break;
                }
            }

            // If there's an active op, store TEXT and push on _AST
            if (o !== UNDEFINED) {
                o[TEXT] = query.substring(m, l);
                ast.push(o);
            }

            // Set _AST
            me[_AST] = ast;

            return me;
       },

        reduce : function reduce(cache) {
            var me = this;
            var now = 0 | new Date().getTime() / 1000;

            // If we're not parsed - parse
            if (!(_AST in me)) {
                me.parse();
            }

            var ast = me[_AST];  // _AST
            var result = [];    // Result
            var i;              // Index
            var l;              // Length
            var o;              // Current operation
            var t;              // Current text
            var r;              // Current root
            var n;              // Current node
            var k = FALSE;      // Keep flag

            // First step is to resolve what we can from the _AST
            for (i = 0, l = ast.length; i < l; i++) {
                o = ast[i];

                switch (o[OP]) {
                    case OP_ID :
                        // Set root
                        r = o;

                        // Get t from o
                        t = o[TEXT];

                        // Do we have this item in cache
                        if (t in cache) {
                            // Set current node
                            n = cache[t];
                            // Set RESOLVED if we're not collapsed or expired
                            o[RESOLVED] = n[_COLLAPSED] !== TRUE && !(_EXPIRES in n) || n[_EXPIRES] > now;
                        }
                        else {
                            // Reset current root and node
                            n = UNDEFINED;
                            // Reset RESOLVED
                            o[RESOLVED] = FALSE;
                        }
                        break;

                    case OP_PROPERTY :
                        // Get t from o
                        t = o[TEXT];

                        // Do we have a node and this item in the node
                        if (n && t in n) {
                            // Set current node
                            n = n[t];
                            // Change OP to OP_ID
                            o[OP] = OP_ID;
                            // Update TEXT to _ID
                            o[TEXT] = n[_ID];
                            // Set RESOLVED if we're not collapsed or expired
                            o[RESOLVED] = n[_COLLAPSED] !== TRUE && !(_EXPIRES in n) || n[_EXPIRES] > now;
                        }
                        else {
                            // Reset current node and RESOLVED
                            n = UNDEFINED;
                            o[RESOLVED] = FALSE;
                        }
                        break;

                    case OP_PATH :
                        // Get t from r
                        t = r[TEXT];

                        // Set current node
                        n = cache[t];

                        // Change OP to OP_ID
                        o[OP] = OP_ID;
                        // Update TEXT to t
                        o[TEXT] = t;
                        // Copy RESOLVED from r
                        o[RESOLVED] = r[RESOLVED];
                        break;
                }
            }

            // After that we want to reduce 'dead' operations from the _AST
            while (l-- > 0) {
                o = ast[l];

                switch(o[OP]) {
                    case OP_ID :
                        // If the keep flag is set, or the op is not RESOLVED
                        if (k || o[RESOLVED] !== TRUE) {
                            result.unshift(o);
                        }

                        // Reset keep flag
                        k = FALSE;
                        break;

                    case OP_PROPERTY :
                        result.unshift(o);

                        // Set keep flag
                        k = TRUE;
                        break;
                }
            }

            // Update _AST
            me[_AST] = result;

            return me;
        },

        ast : function ast() {
            var me = this;

            // If we're not parsed - parse
            if (!(_AST in me)) {
                me.parse();
            }

            return me[_AST];
        },

        rewrite : function rewrite() {
            var me = this;

            // If we're not parsed - parse
            if (!(_AST in me)) {
                me.parse();
            }

            var ast = me[_AST]; // AST
            var result = "";    // Result
            var l;              // Current length
            var i;              // Current index
            var o;              // Current operation

            // Step through AST
            for (i = 0, l = ast.length; i < l; i++) {
                o = ast[i];

                switch(o[OP]) {
                    case OP_ID :
                        // If this is the first OP_ID, there's no need to add OP_QUERY
                        result += i === 0
                            ? o[TEXT]
                            : OP_QUERY + o[TEXT];
                        break;

                    case OP_PROPERTY :
                        result += OP_PROPERTY + o[TEXT];
                        break;
                }
            }

            return result;
        }
    });
});