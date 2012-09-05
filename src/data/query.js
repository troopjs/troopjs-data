define( [ "troopjs-core/component/base" ], function QueryModule(Component) {
    var UNDEFINED;
    var AST = "ast";
    var OP = "op";
    var TEXT = "text";

    return Component.extend(function Query(query) {
        if (query !== UNDEFINED) {
            this.parse(query);
        }
    }, {
        parse : function parse(query) {
            var me = this;

            var l;                  // Length
            var c;                  // Current character
            var i;                  // Current index
            var m;                  // Current mark
            var q;                  // Current quote
            var o;                  // Current op
            var a = me[AST] = [];   // AST

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

                    case "!" :  // ID operator
                        // Break fast if we're quoted
                        if (q !== UNDEFINED) {
                            break;
                        }

                        // Init new op
                        o = {};
                        o[OP] = c;
                        break;

                    case "." :  // Property operator
                    case ";" :  // Sub-query separator
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

                    case "|" :  // Query separator
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

            return me;
       }
    });
});