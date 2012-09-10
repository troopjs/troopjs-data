buster.testCase("troopjs-ef/data/query", function (run) {
    var assert = buster.assert;

    require( [ "troopjs-ef/data/query", "troopjs-ef/data/cache" ] , function (Query, Cache) {
        run({
            "parse" : {
                "test!123" : function () {
                    var ast = Query("test!123").ast();

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!123"
                    }]);
                },

                "test!123|xxx!321" : function () {
                    var ast = Query("test!123|xxx!321").ast();

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!123"
                    }, {
                        "op" : "!",
                        "text" : "xxx!321"
                    }]);
                },

                "test!123.p1" : function () {
                    var ast = Query("test!123.p1").ast();

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!123"
                    }, {
                        "op" : ".",
                        "text" : "p1"
                    }]);
                },

                "test!123.p1.p2" : function () {
                    var ast = Query("test!123.p1.p2").ast();

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

                "test!123.p1,.p2" : function () {
                    var ast = Query("test!123.p1,.p2").ast();

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!123"
                    }, {
                        "op" : ".",
                        "text" : "p1"
                    }, {
                        "op" : ",",
                        "text" : ""
                    }, {
                        "op" : ".",
                        "text" : "p2"
                    }]);
                },

                "test!123.p1,.p2|xxx!321.p3.p4,.p5" : function () {
                    var ast = Query("test!123.p1,.p2|xxx!321.p3.p4,.p5").ast();

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!123"
                    }, {
                        "op" : ".",
                        "text" : "p1"
                    }, {
                        "op" : ",",
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
                        "op" : ",",
                        "text" : ""
                    }, {
                        "op" : ".",
                        "text" : "p5"
                    }]);
                },

                "test!123 .p1,   .p2|xxx!321 .p3  .p4   , .p5" : function () {
                    var ast = Query("test!123 .p1,   .p2|xxx!321 .p3  .p4   , .p5").ast();

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!123"
                    }, {
                        "op" : ".",
                        "text" : "p1"
                    }, {
                        "op" : ",",
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
                        "op" : ",",
                        "text" : ""
                    }, {
                        "op" : ".",
                        "text" : "p5"
                    }]);
                },

                "test!'123 321'" : function () {
                    var ast = Query("test!'123 321'").ast();

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!'123 321'"
                    }]);
                },

                "test!'123 321'.p1,.'p2 asd'" : function () {
                    var ast = Query("test!'123 321'.p1,.'p2 asd'").ast();

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!'123 321'"
                    }, {
                        "op" : ".",
                        "text" : "p1"
                    }, {
                        "op" : ",",
                        "text" : ""
                    }, {
                        "op" : ".",
                        "text" : "'p2 asd'"
                    }]);
                }
            },

            "reduce" : {
                "setUp" : function () {
                    this.cache = Cache();
                },

                "tearDown" : function () {
                    delete this.cache;
                },

                "with static data" : {
                    "setUp" : function () {
                        this.cache.put([{
                            "id" : "test!123",
                            "p1" : {
                                "id" : "test!321",
                                "collapsed" : true
                            },
                            "p3" : {
                                "id" : "test!xxx",
                                "collapsed" : true
                            }
                        }, {
                            "id" : "test!321",
                            "collapsed" : false,
                            "p2" : {
                                "id" : "test!yyy",
                                "collapsed" : true
                            }
                        }, {
                            "id" : "test!yyy",
                            "collapsed" : false
                        }]);
                    },

                    "test!123" : function () {
                        var ast = Query("test!123").reduce(this.cache).ast();

                        assert.equals(ast, []);
                    },

                    "test!1234" : function () {
                        var ast = Query("test!1234").reduce(this.cache).ast();

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!1234",
                            "resolved" : false
                        }]);
                    },

                    "test!123.p1" : function () {
                        var ast = Query("test!123.p1").reduce(this.cache).ast();

                        assert.equals(ast, []);
                    },

                    "test!123.p2" : function () {
                        var ast = Query("test!123.p2").reduce(this.cache).ast();

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "resolved" : true
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "resolved" : false
                        }]);
                    },

                    "test!123.p1.p2" : function () {
                        var ast = Query("test!123.p1.p2").reduce(this.cache).ast();

                        assert.equals(ast, []);
                    },

                    "test!123.p1,.p3" : function () {
                        var ast = Query("test!123.p1,.p3").reduce(this.cache).ast();

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!xxx",
                            "resolved" : false
                        }]);
                    },

                    "test!123.p1,.p2" : function () {
                        var ast = Query("test!123.p1,.p2").reduce(this.cache).ast();

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "resolved" : true
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "resolved" : false
                        }]);
                    },

                    "test!123.p1.p3.p4,.p2" : function () {
                        var ast = Query("test!123.p1.p3.p4,.p2").reduce(this.cache).ast();

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!321",
                            "resolved" : true
                        }, {
                            "op" : ".",
                            "text" : "p3",
                            "resolved" : false
                        }, {
                            "op" : ".",
                            "text" : "p4",
                            "resolved" : false
                        }, {
                            "op" : "!",
                            "text" : "test!123",
                            "resolved" : true
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "resolved" : false
                        }]);
                    },

                    "test!123|test!321" : function () {
                        var ast = Query("test!123|test!321").reduce(this.cache).ast();

                        assert.equals(ast, []);
                    },

                    "test!123.p1,.p2,.p3|test!321.p2" : function () {
                        var ast = Query("test!123.p1,.p2,.p3|test!321.p2").reduce(this.cache).ast();

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "resolved" : true
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "resolved" : false
                        }, {
                            "op" : "!",
                            "text" : "test!xxx",
                            "resolved" : false
                        }]);
                    }
                },

                "with maxAged data" : {
                    "setUp" : function () {
                        this.cache.start().put([{
                            "id" : "test!123",
                            "maxAge" : 2,
                            "p1" : {
                                "id" : "test!321",
                                "collapsed" : true
                            },
                            "p3" : {
                                "id" : "test!xxx",
                                "collapsed" : true
                            }
                        }, {
                            "id" : "test!321",
                            "maxAge" : 1,
                            "p2" : {
                                "id" : "test!xxx",
                                "collapsed" : true
                            }
                        }]);
                    },

                    "tearDown" : function () {
                        this.cache.stop();
                    },

                    "test!123|test!321" : function (done) {
                        var cache = this.cache;

                        setTimeout(function () {
                            var ast = Query("test!123|test!321").reduce(cache).ast();

                            assert.equals(ast, [{
                                "op" : "!",
                                "text" : "test!321",
                                "resolved" : false
                            }]);

                            done();
                        }, 1000);

                        this.timeout = 1100;
                    }
                }
            },

            "rewrite" : {
                "setUp" : function () {
                    var cache = this.cache = Cache();

                    cache.put([{
                        "id" : "test!123",
                        "collapsed" : false,
                        "p1" : {
                            "id" : "test!321",
                            "collapsed" : true
                        },
                        "p3" : {
                            "id" : "test!xxx",
                            "collapsed" : true
                        }
                    }, {
                        "id" : "test!321",
                        "collapsed" : false,
                        "p2" : {
                            "id" : "test!yyy",
                            "collapsed" : true
                        }
                    }, {
                        "id" : "test!yyy",
                        "collapsed" : false
                    }]);
                },

                "tearDown" : function () {
                    delete this.cache;
                },

                "test!123" : function () {
                    var rewrite = Query("test!123").reduce(this.cache).rewrite();

                    assert.equals(rewrite, "");
                },

                "test!123.p1,.p3" : function () {
                    var rewrite = Query("test!123.p1,.p3").reduce(this.cache).rewrite();

                    assert.equals(rewrite, "test!xxx");
                },

                "test!123.p1.p2.p3,.p3" : function () {
                    var rewrite = Query("test!123.p1.p2.p3,.p3").reduce(this.cache).rewrite();

                    assert.equals(rewrite, "test!yyy.p3|test!xxx");
                },

                "test!123.p1,.p2,.p3|test!321.p2" : function () {
                    var rewrite = Query("test!123.p1,.p2,.p3|test!321.p1,.p2").reduce(this.cache).rewrite();

                    assert.equals(rewrite, "test!123.p2|test!xxx|test!321.p1");
                }
            }
        });
    });
});