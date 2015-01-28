/**
   Program Name: D3.js
   Author: jwolfe
   Date: 1/28/15
*/
qx.Class.define("aviationd3.D3",
{
  extend : qx.ui.container.Composite,
  type : "singleton",
  properties :
  {
    ready :
    {
      init : false,
      check : "Boolean"
    },
    site :
    {
      init : "KCRW",
      apply : "_changeSite"
    }
  },
  construct : function()
  {
    this.base(arguments);
    this.setLayout(new qx.ui.layout.VBox(5));
    var me = this;
    var canvas = new qx.ui.container.Composite(new qx.ui.layout.Grow());
    me.xScale = {

    };
    me.yScale = {

    };
    me.line = {

    };

    //    var updateButton = new qx.ui.form.Button("Update");

    //    updateButton.addListener("execute", function()

    //    {

    //

    //

    //      //      me.updateGraphs();

    //    })
    var html = new qx.ui.embed.Html('<div id="PredHgt"></div><div id="Vsby"></div>').set(
    {
      minHeight : 400,
      minWidth : 800
    });
    canvas.add(html);

    //    this.add(updateButton);
    this.add(canvas);
    html.addListener("appear", function()
    {
      //      updateButton.execute();
    }, this);
  },
  members :
  {
    _changeSite : function(value, old, name)
    {
      var me = this;
      console.log(value);
      d3.json("resource/aviationd3/getNdfdTaf.php?site=" + value, function(error, json)
      {
        if (error)return console.warn(error);

        if (me.getReady())
        {
          me.updateGraphs(json, "PredHgt");
          me.updateGraphs(json, "Vsby");
        } else
        {
          me.setupSvg(json, "PredHgt", "Ceiling (ft x 100)");
          me.setupSvg(json, "Vsby", "Visibility (nmi.)");
          me.setReady(true);
        }
      });
    },

    /**
    Set up the Svg
    */
    setupSvg : function(data, field, yAxisLabel)
    {
      var me = this;

      //Width and height
      var width = 700;
      var height = 150;
      var margin =
      {
        top : 20,
        right : 10,
        bottom : 0,
        left : 60
      };

      //Create scale functions
      me.xScale[field] = d3.time.scale.utc().domain([d3.min(data[field], function(d) {
        return new Date(d[0] * 1000);
      }), d3.max(data[field], function(d) {
        return new Date(d[0] * 1000);
      })]).range([margin.left, width + margin.left]);
      if (field == "Vsby") {
        me.yScale[field] = d3.scale.linear().domain([0, 10]).range([height + margin.bottom, margin.top]);
      } else {
        me.yScale[field] = d3.scale.log().domain([1, 250]).nice().range([height + margin.bottom, margin.top]);
      }

      //Define X axis
      var xAxis = d3.svg.axis().scale(me.xScale[field]).orient("bottom").ticks(5);

      //Define Y axis
      var yAxis = d3.svg.axis().scale(me.yScale[field]).orient("left").ticks(11).tickFormat(function(d) {
        return me.yScale[field].tickFormat(4, d3.format(",d"))(d)
      });

      //Create SVG element
      var svg = d3.select("#" + field).append("svg").attr("id", field).attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
      me.line[field] = d3.svg.line().defined(function(d) {
        return d[1] != null;
      }).x(function(d) {
        return me.xScale[field](d[0] * 1000);
      }).y(function(d) {
        return me.yScale[field](d[1]);
      }).interpolate('linear');

      // Draw Flight Cat Rectangles
      if (field == "Vsby") {
        var categories = [10.0001, 5, 3, 1, 0];
      } else {
        var categories = [1000, 30, 10, 5, 1];
      }
      var colors = ['#a1ffa4', 'rgb(255,255,179)', '#ffb175', '#c59dd8'];
      categories.forEach(function(e, index) {
        if (index + 1 < categories.length) {
          var rectangle = svg.append('rect').attr("x", margin.left).attr("y", me.yScale[field](categories[index])).attr("width", width).attr("height", me.yScale[field](categories[index + 1]) - me.yScale[field](categories[index])).attr("fill", colors[index]).attr("stroke", "#8a8a8a")
        }
      });

      // Grid lines
      svg.selectAll("line.horizontalGrid").data(me.yScale[field].ticks(4)).enter().append("line").attr(
      {
        "class" : "horizontalGrid",
        "x1" : margin.left,
        "x2" : margin.left + width,
        "y1" : function(d) {
          return me.yScale[field](d);
        },
        "y2" : function(d) {
          return me.yScale[field](d);
        },
        "fill" : "none",
        "shape-rendering" : "crispEdges",
        "stroke" : "rgba(0,0,0,0.2)",
        "stroke-width" : "1px"
      });

      //Create X axis
      svg.append("g").attr("class", "axis").attr("transform", "translate(0," + (height - margin.bottom) + ")").call(xAxis);

      //Create Y axis
      svg.append("g").attr("class", "axis").attr("transform", "translate(" + margin.left + ",0)").call(yAxis);

      // Y-axis label
      svg.append("text").attr("transform", "rotate(-90)").attr("y", 0).attr("x", 0 - ((margin.top + height) / 2)).attr("dy", "1em").style("text-anchor", "middle").text(yAxisLabel);

      // Add Line
      svg.selectAll('.path').data([data[field]]).enter().append("svg:path").attr("d", me.line[field]).attr("stroke", "black").attr("stroke-width", 2).attr("fill", "none").attr("id", "mypath" + field);

      // Color categories have to be sorted ascending
      var colorCategories = categories.reverse();

      // Knock off the first value since that's the way the colors get properly mapped
      colorCategories.shift();
      var color = d3.scale.threshold().domain(colorCategories).range(colors.reverse());

      // Tooltip
      var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function(d) {
        return "<strong>Value:</strong> <span style='color:white'>" + new Date(d[0] * 1000) + ',' + d[1] + "</span>";
      })
      svg.call(tip);

      //Create circles
      svg.selectAll(".circle").data(data[field]).enter().append("circle").attr("fill", function(d) {
        return color(d[1]);
      }).attr("stroke", "black").attr("cx", function(d) {
        return me.xScale[field](d[0] * 1000);
      }).attr("cy", function(d) {
        return d[1] == null ? 100 : me.yScale[field](d[1]);
      }).attr("r", function(d) {
        return d[1] == null ? 0 : 5;
      }).on('mouseover', function(e)
      {
        tip.show(e);
        var circle = d3.select(this);
        circle.transition().duration(150).attr("r", circle.attr("r") * 1 + 5);
      }).on('mouseout', function(e)
      {
        tip.hide(e);
        var circle = d3.select(this);
        circle.transition().duration(50).attr("r", 5);
      });
    },

    /**
    Update the graphs
    */
    updateGraphs : function(data, field)
    {
      var me = this;
      d3.select("#mypath" + field).data([data[field]])  // set the new data
      .transition(1000).attr("d", me.line[field]);
      d3.select("#" + field).selectAll("circle").data(data[field]).transition().attr("cx", function(d) {
        return me.xScale[field](d[0] * 1000);
      }).attr("cy", function(d) {
        return d[1] == null ? 100 : me.yScale[field](d[1]);
      }).attr("r", function(d)
      {
        return d[1] == null ? 0 : 5;  //rScale(d[1]);
      });
    }
  }
});
