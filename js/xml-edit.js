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
    //template: template('index'),
    //el: '#index',
    x: 1,
    initialize: function() {
      this.xml = new XMLEdit.XML();
      //this.xml.on('all', this.render, this);
      //this.xml.on('all', function() {
      	//console.log("On All", arguments, this);
      //});
      this.xml.fetch();      
      this.form = new XMLEdit.Index.Form({model: this.xml});
      this.parsedOutTokens = new XMLEdit.Index.ParsedOutTokens({model: this.xml});      
    },
    render: function() {
     console.log("hi", this.x++);
      //this.$el.html(this.template(this));
      this.$el.append(this.form.render().el);
      this.$el.append(this.parsedOutTokens.render().el)
      return this;
    }
  });
  
  XMLEdit.Index.ParsedOutput = Backbone.View.extend({
	//className: 'well',
    template: template('parsed-output'),
    render: function() {
      this.$el.html(this.template(this));
      return this;
    },
    name:  function() { return this.model.get('name'); },
    value: function() { return this.model.get('value'); }
  });
  
  XMLEdit.Index.ParsedOutTokens = Backbone.View.extend({
	//className: 'well',
    template: template('parsed-out-tokens'),
    render: function() {
      this.$el.html(this.template(this));
      return this;
    }
  });

  XMLEdit.Index.Form = Backbone.View.extend({
    tagName: 'form',
    className: 'form-horizontal',
    template: template('form'),
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
      console.log(this.$('#xml').val());
      event.preventDefault();
	  this.model.set({
        name: 'xml',
        value: this.$('#xml').val()
      });

      var view = new XMLEdit.Index.ParsedOutput({ model: this.model});
      $('#output').append(view.render().el);
      console.log("View:", view.el);
      this.render();
    }
  });

  XMLEdit.Router = Backbone.Router.extend({
    initialize: function(options) {
      this.el = options.el
    },
    routes: {
      "": "index"
    },
    index: function() {
      var index = new XMLEdit.Index({el: '#index'});
      this.el.empty();
      index.render();
      console.log("index", index.el);
      //this.el.append(index.el);
    }
  });

  XMLEdit.boot = function(container) {
    container = $(container);
    var router = new XMLEdit.Router({el: container})
    Backbone.history.start();
  }
})()
