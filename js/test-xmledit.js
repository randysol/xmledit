(function() {
    var XMLEdit = {};
    window.XMLEdit = XMLEdit;

    var template = function(name) {
        return Mustache.compile($('#'+name+'-template').html());
    };

    XMLEdit.XML = Backbone.Model.extend({
        localStorage: new Store("xmlItem"),
        name: "n",
        value: "v"
    });

    XMLEdit.Index = Backbone.View.extend({
        el: '#index',
        initialize: function() {
            this.xml = new XMLEdit.XML();
            this.xml.on('all', this.renderParsedOut, this);
            //this.xml.on('all', function() {
            //  console.log("On All", arguments, this);
            //});

            this.xml.fetch();

            this.xmlIn = new XMLEdit.Index.XmlIn({model: this.xml});
            this.inspector = new XMLEdit.Index.Inspector({model: this.xml});
            this.parsedOutObject = new XMLEdit.Index.ParsedOutObject({model: this.xml});
            this.parsedOutTokens = new XMLEdit.Index.ParsedOutTokens({model: this.xml});
            this.inspectorOutXml = new XMLEdit.Index.InspectorOutXml({model: this.xml});
            this.inspectorOutObject = new XMLEdit.Index.InspectorOutObject({model: this.xml});

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
            $content2.append(this.parsedOutObject.render().el);
            $content2.append(this.parsedOutTokens.render().el);
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
        render: function() {
            this.$el.html(this.template(this));
            return this;
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
        }
    });

    XMLEdit.Index.Inspector = Backbone.View.extend({
        tagName: 'form',
        template: template('inspector'),
        events: {
            'submit': 'save'
        },
        render: function() {
            this.$el.html(this.template(this));
            return this;
        },
        save: function(event) {
            event.preventDefault();
            this.trigger("inspector:save");
        }
    });

    XMLEdit.Index.ParsedOutObject = Backbone.View.extend({
        template: template('parsed-out-object'),
        render: function() {
            this.$el.html(this.template(this));
            return this;
        }
    });

    XMLEdit.Index.ParsedOutTokens = Backbone.View.extend({
        template: template('parsed-out-tokens'),
        render: function() {
            this.$el.html(this.template(this));
            return this;
        },
        name:  function() { return this.model.get('name'); },
        value: function() { return this.model.get('value'); }
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
