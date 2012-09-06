buster.testCase("troopjs-ef/data/query", function (run) {
    var assert = buster.assert;
    var refute = buster.assertions.refute;

    require( [ "troopjs-ef/data/query", "troopjs-ef/data/cache" ] , function (Query, Cache) {
        run({
            "parse" : {
                "test!123" : function () {
                    var ast = Query().parse("test!123");

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!123"
                    }]);
                },

                "test!123|xxx!321" : function () {
                    var ast = Query().parse("test!123|xxx!321");

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!123"
                    }, {
                        "op" : "!",
                        "text" : "xxx!321"
                    }]);
                },

                "test!123.p1" : function () {
                    var ast = Query().parse("test!123.p1");

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!123"
                    }, {
                        "op" : ".",
                        "text" : "p1"
                    }]);
                },

                "test!123.p1.p2" : function () {
                    var ast = Query().parse("test!123.p1.p2");

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
                    var ast = Query().parse("test!123.p1;.p2");

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
                    var ast = Query().parse("test!123.p1;.p2|xxx!321.p3.p4;.p5");

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
                    var ast = Query().parse("test!123 .p1;   .p2|xxx!321 .p3  .p4   ; .p5");

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
                    var ast = Query().parse("test!'123 321'");

                    assert.equals(ast, [{
                        "op" : "!",
                        "text" : "test!'123 321'"
                    }]);
                },

                "test!'123 321'.p1;.'p2 asd'" : function () {
                    var ast = Query().parse("test!'123 321'.p1;.'p2 asd'");

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
            },

            "reduce" : {
                "setUp" : function () {
                    var cache = this.cache = Cache();
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
                        var ast = Query().reduce("test!123", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "reduced" : true
                        }]);
                    },

                    "test!1234" : function () {
                        var ast = Query().reduce("test!1234", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!1234",
                            "reduced" : false
                        }]);
                    },

                    "test!123.p1" : function () {
                        var ast = Query().reduce("test!123.p1", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p1",
                            "reduced" : true
                        }]);
                    },

                    "test!123.p2" : function () {
                        var ast = Query().reduce("test!123.p2", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "reduced" : false
                        }]);
                    },

                    "test!123.p1.p2" : function () {
                        var ast = Query().reduce("test!123.p1.p2", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p1",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "reduced" : true
                        }]);
                    },

                    "test!123.p1;.p3" : function () {
                        var ast = Query().reduce("test!123.p1;.p3", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p1",
                            "reduced" : true
                        }, {
                            "op" : ";",
                            "text" : "",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p3",
                            "reduced" : false
                        }]);
                    },

                    "test!123.p1;.p2" : function () {
                        var ast = Query().reduce("test!123.p1;.p2", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p1",
                            "reduced" : true
                        }, {
                            "op" : ";",
                            "text" : "",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "reduced" : false
                        }]);
                    },

                    "test!123.p1.p3.p4;.p2" : function () {
                        var ast = Query().reduce("test!123.p1.p3.p4;.p2", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p1",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p3",
                            "reduced" : false
                        }, {
                            "op" : ".",
                            "text" : "p4",
                            "reduced" : false
                        }, {
                            "op" : ";",
                            "text" : "",
                            "reduced" : false
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "reduced" : false
                        }]);
                    },

                    "test!123|test!321" : function () {
                        var ast = Query().reduce("test!123|test!321", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "reduced" : true
                        }, {
                            "op" : "!",
                            "text" : "test!321",
                            "reduced" : true
                        }]);
                    },

                    "test!123.p1;.p2|test!321.p2" : function () {
                        var ast = Query().reduce("test!123.p1;.p2|test!321.p2", this.cache);

                        assert.equals(ast, [{
                            "op" : "!",
                            "text" : "test!123",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p1",
                            "reduced" : true
                        }, {
                            "op" : ";",
                            "text" : "",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "reduced" : false
                        }, {
                            "op" : "!",
                            "text" : "test!321",
                            "reduced" : true
                        }, {
                            "op" : ".",
                            "text" : "p2",
                            "reduced" : true
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
                            var ast = Query().reduce("test!123|test!321", cache);

                            assert.equals(ast, [{
                                "op" : "!",
                                "text" : "test!123",
                                "reduced" : true
                            }, {
                                "op" : "!",
                                "text" : "test!321",
                                "reduced" : false
                            }]);

                            done();
                        }, 1000);

                        this.timeout = 1100;
                    }
                }
            }
        });
    });
});