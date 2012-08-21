buster.testCase("troopjs-ef/data/query", function (run) {
    require( [ "troopjs-ef/data/query" ] , function (Query) {
        run({
            "true" : function () {
                buster.assert(true);
            }
        });
    });
});