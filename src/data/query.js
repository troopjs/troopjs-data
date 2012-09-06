define( [ "troopjs-core/component/base" ], function QueryModule(Component) {
    var UNDEFINED;
    var TRUE = true;
    var OP = "op";
    var OP_ID = "!";
    var OP_PROPERTY = ".";
    var OP_PATH = ";"
    var OP_QUERY = "|";
    var TEXT = "text";
    var REDUCED = "reduced";
    var _EXPIRES = "expires";
    var _COLLAPSED = "collapsed";

    return Component.extend({
        parse : function parse(query) {
            var i;      // Index
            var l;      // Length
            var c;      // Current character
            var m;      // Current mark
            var q;      // Current quote
            var o;      // Current operation
            var a = []; // AST

            // Step through the query character by character
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

                        // If there's an active op, store TEXT and push on AST
                        if (o !== UNDEFINED) {
                            o[TEXT] = query.substring(m, i);
                            a.push(o);
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

                        // If there's an active op, store TEXT and push on AST
                        if (o !== UNDEFINED) {
                            o[TEXT] = query.substring(m, i);
                            a.push(o);
                        }

                        // Reset op
                        o = UNDEFINED;

                        // Set mark
                        m = i + 1;
                        break;
                }
            }

            // If there's an active op, store TEXT and push on AST
            if (o !== UNDEFINED) {
                o[TEXT] = query.substring(m, l);
                a.push(o);
            }

            return a;
       },

        reduce : function reduce(query, cache) {
            var me = this;
            var now = 0 | new Date().getTime() / 1000;

            var i;                      // Index
            var l;                      // Length
            var o;                      // Current operation
            var t;                      // Current text
            var r;                      // Current root
            var n;                      // Current node
            var a = me.parse(query);    // AST

            // Step through AST
            for (i = 0, l = a.length; i < l; i++) {
                o = a[i];

                switch (o[OP]) {
                    case OP_ID :
                        t = o[TEXT];

                        // Do we have this item in cache
                        if (t in cache) {
                            // Set current root and node
                            r = n = cache[t];
                            // Set REDUCED if we're not collapsed or expired
                            o[REDUCED] = n[_COLLAPSED] !== TRUE && !(_EXPIRES in n) || n[_EXPIRES] > now;
                        }
                        else {
                            // Reset current root and node
                            r = n = UNDEFINED;
                            // Reset REDUCED
                            o[REDUCED] = false;
                        }
                        break;

                    case OP_PROPERTY :
                        t = o[TEXT];

                        // Do we have a node and this item in the node
                        if (n && t in n) {
                            // Set current node
                            n = n[t];
                            // Set REDUCED if we're not collapsed or expired
                            o[REDUCED] = n[_COLLAPSED] !== TRUE && !(_EXPIRES in n) || n[_EXPIRES] > now;
                        }
                        else {
                            // Reset current node and REDUCED
                            n = UNDEFINED;
                            o[REDUCED] = false;
                        }
                        break;

                    case OP_PATH :
                        // Set REDUCED if we have a current node
                        o[REDUCED] = n !== UNDEFINED;
                        // Set current node to current root
                        n = r;
                        break;
                }
            }

            return a;
        }
    });
});