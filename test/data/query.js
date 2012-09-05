buster.testCase("troopjs-ef/data/query", function (run) {
    var assert = buster.assert;
    var refute = buster.assertions.refute;

    require( [ "troopjs-ef/data/query" ] , function (Query) {
        run({
            "test!123" : function () {
                var ast = Query("test!123").ast;

                assert.equals(ast, [{
                    "op" : "!",
                    "text" : "test!123"
                }]);
            },

            "test!123|xxx!321" : function () {
                var ast = Query("test!123|xxx!321").ast;

                assert.equals(ast, [{
                    "op" : "!",
                    "text" : "test!123"
                }, {
                    "op" : "!",
                    "text" : "xxx!321"
                }]);
            },

            "test!123.p1" : function () {
                var ast = Query("test!123.p1").ast;

                assert.equals(ast, [{
                    "op" : "!",
                    "text" : "test!123"
                }, {
                    "op" : ".",
                    "text" : "p1"
                }]);
            },

            "test!123.p1.p2" : function () {
                var ast = Query("test!123.p1.p2").ast;

                assert.equals(ast, [{
                    "op" : "!",
                    "text" : "test!123"
                }, {
                    "op" : ".",
                    "text" : "p1"
                }, {
                    "op" : ".",
                    "text" : "p2"
                }]);
            },

            "test!123.p1;.p2" : function () {
                var ast = Query("test!123.p1;.p2").ast;

                assert.equals(ast, [{
                    "op" : "!",
                    "text" : "test!123"
                }, {
                    "op" : ".",
                    "text" : "p1"
                }, {
                    "op" : ";",
                    "text" : ""
                }, {
                    "op" : ".",
                    "text" : "p2"
                }]);
            },

            "test!123.p1;.p2|xxx!321.p3.p4;.p5" : function () {
                var ast = Query("test!123.p1;.p2|xxx!321.p3.p4;.p5").ast;

                assert.equals(ast, [{
                    "op" : "!",
                    "text" : "test!123"
                }, {
                    "op" : ".",
                    "text" : "p1"
                }, {
                    "op" : ";",
                    "text" : ""
                }, {
                    "op" : ".",
                    "text" : "p2"
                }, {
                    "op" : "!",
                    "text" : "xxx!321"
                }, {
                    "op" : ".",
                    "text" : "p3"
                }, {
                    "op" : ".",
                    "text" : "p4"
                }, {
                    "op" : ";",
                    "text" : ""
                }, {
                    "op" : ".",
                    "text" : "p5"
                }]);
            },

            "test!123 .p1;   .p2|xxx!321 .p3  .p4   ; .p5" : function () {
                var ast = Query("test!123 .p1;   .p2|xxx!321 .p3  .p4   ; .p5").ast;

                assert.equals(ast, [{
                    "op" : "!",
                    "text" : "test!123"
                }, {
                    "op" : ".",
                    "text" : "p1"
                }, {
                    "op" : ";",
                    "text" : ""
                }, {
                    "op" : ".",
                    "text" : "p2"
                }, {
                    "op" : "!",
                    "text" : "xxx!321"
                }, {
                    "op" : ".",
                    "text" : "p3"
                }, {
                    "op" : ".",
                    "text" : "p4"
                }, {
                    "op" : ";",
                    "text" : ""
                }, {
                    "op" : ".",
                    "text" : "p5"
                }]);
            },

            "test!'123 321'" : function () {
                var ast = Query("test!'123 321'").ast;

                assert.equals(ast, [{
                    "op" : "!",
                    "text" : "test!'123 321'"
                }]);
            },

            "test!'123 321'.p1;.'p2 asd'" : function () {
                var ast = Query("test!'123 321'.p1;.'p2 asd'").ast;

                assert.equals(ast, [{
                    "op" : "!",
                    "text" : "test!'123 321'"
                }, {
                    "op" : ".",
                    "text" : "p1"
                }, {
                    "op" : ";",
                    "text" : ""
                }, {
                    "op" : ".",
                    "text" : "'p2 asd'"
                }]);
            }
        });
    });
});