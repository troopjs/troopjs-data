define( [ "troopjs-core/component/base" ], function QueryModule(Component) {
    var UNDEFINED;
    var OP = "op";
    var OP_ID = "!";
    var OP_PROPERTY = ".";
    var OP_PATH = ";"
    var OP_QUERY = "|";
    var TEXT = "text";
    var REDUCED = "reduced";
    var EXPIRES = "expires";

    return Component.extend({
        parse : function parse(query) {
            var l;      // Length
            var c;      // Current character
            var i;      // Current index
            var m;      // Current mark
            var q;      // Current quote
            var o;      // Current op
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

            var i;
            var l;
            var o;
            var t;
            var r;
            var c;
            var a = me.parse(query);

            for (i = 0, l = a.length; i < l; i++) {
                var o = a[i];

                switch (o[OP]) {
                    case OP_ID :
                        t = o[TEXT];

                        if (t in cache) {
                            r = c = cache[t];
                            o[REDUCED] = !(EXPIRES in c) || c[EXPIRES] > now;
                        }
                        else {
                            r = c = UNDEFINED;
                            o[REDUCED] = false;
                        }
                        break;

                    case OP_PROPERTY :
                        t = o[TEXT];

                        if (c && t in c) {
                            c = c[t];
                            o[REDUCED] = true;
                        }
                        else {
                            c = UNDEFINED;
                            o[REDUCED] = false;
                        }
                        break;

                    case OP_PATH :
                        o[REDUCED] = c !== UNDEFINED;
                        c = r;
                        break;
                }
            }

            return a;
        }
    });
});