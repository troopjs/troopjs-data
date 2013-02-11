/**
 * TroopJS data/component/widget
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
/*global define:false */
define([ "troopjs-browser/component/widget", "troopjs-core/pubsub/topic" ], function WidgetModule(Widget, Topic) {

	var ARRAY_PUSH = Array.prototype.push;

	return Widget.extend({
		"displayName" : "data/component/widget",

		/**
		 * Issues publish on query topic
		 * @returns {Promise} of query result(s)
		 */
		"query" : function query() {
			var self = this;
			var args = [ Topic("query", this) ];

			ARRAY_PUSH.apply(args, arguments);

			return self.publish.apply(self, args);
		}
	});
});
