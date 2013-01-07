(function() {
    var XMLEdit = {};
    window.XMLEdit = XMLEdit;

    var template = function(name) {
        return Mustache.compile($('#'+name+'-template').html());
    };

    XMLEdit.XML = Backbone.Model.extend({
        localStorage: new Store("xmlItem"),
        name: "n",
        value: "v",
        parsedRoot: "",
        source: ""
    });

    XMLEdit.Index = Backbone.View.extend({
        el: '#index',
        initialize: function() {
            this.xml = new XMLEdit.XML();
            this.xml.on('change:parsedRoot', this.renderParsedOut, this);
            //this.xml.on('all', function() {
            //  console.log("On All", arguments, this);
            //});

            this.xml.fetch();

            this.xmlIn = new XMLEdit.Index.XmlIn({model: this.xml});
            this.inspector = new XMLEdit.Index.Inspector({model: this.xml});
            this.inspectorOutXml = new XMLEdit.Index.InspectorOutXml({model: this.xml});

            this.inspector.on('inspector:save', this.renderInspectorOut, this);
        },
        render: function() {
            this.$("#loading").hide();
            this.$("#content1").append(this.xmlIn.render().el);
            return this;
        },
        renderParsedOut: function() {
            var $content2 = this.$("#content2");
            $content2.append(this.inspector.render().el);
        },
        renderInspectorOut: function() {
            var $content3 = this.$("#content3");
            $content3.append(this.inspectorOutXml.render().el);
            $content3.append(this.inspectorOutObject.render().el);
        }
    });

    XMLEdit.Index.XmlIn = Backbone.View.extend({
        tagName: 'form',
        template: template('xml-in'),
        events: {
            'submit': 'parse'
        },
        initialize: function() {
        },
        render: function() {
            this.model.on('change:source', this.renderSource, this);

            this.$el.html(this.template(this));
            return this;
        },
        renderSource: function() {
            $("#xml-in").val(this.model.get("source"));
        },
        parse: function(event) {
            //console.log(this.el);
            //console.log("hello(" + event + ")");
            //console.log(this.$('#xml-in').val());
            event.preventDefault();
            this.model.set({
                name: 'xml',
                value: this.$('#xml-in').val()
            });
            var xmlParser = new XMLParser();
            xmlParser.init(this.model.get("value"));
            xmlParser.addSchemaDefinition(Schemas.quota);
            this.model.set({ parsedRoot: xmlParser.parse()});
            xmlParser.addEventNotificationListener(function(event) {
                this.model.set({source: event.xml});
                console.log("Notified", event, this);
            }, this);
        }
    });


    XMLEdit.Index.InspectorOutXml = Backbone.View.extend({
        tagName: 'form',
        template: template('inspector-out-xml'),
        events: {
            'submit': 'copy'
        },
        render: function() {
            this.$el.html(this.template(this));
            return this;
        },
        copy: function(event) {
            event.preventDefault();
        }
    });

    XMLEdit.Index.InspectorOutObject = Backbone.View.extend({
        template: template('inspector-out-object'),
        render: function() {
            this.$el.html(this.template(this));
            return this;
        }
    });

    XMLEdit.Router = Backbone.Router.extend({
        initialize: function(options) {
        },
        routes: {
            "": "index"
        },
        index: function() {
            var index = new XMLEdit.Index();
            index.render();
        }
    });

    XMLEdit.boot = function() {
        var router = new XMLEdit.Router();
        Backbone.history.start();
    }
})()
