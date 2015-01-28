/**
   Program Name: Lamp.js
   Author: jwolfe
   Date: 1/23/15
*/
qx.Class.define("aviationd3.Lamp",
{
  extend : qx.ui.container.Scroll,
  type : "singleton",
  properties : {
    site : {
      init : null
    }
  },
  construct : function()
  {
    this.base(arguments);
    var me = this;

    // Set the widths of the scroll container
    me.setWidth(qx.bom.Viewport.getWidth());
    me.setMinHeight(qx.bom.Viewport.getHeight() - 50);

    // Need this for scroll to work properly
    var mainContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox());
    var dataStore = aviationd3.JQx.dataStore.getInstance();
    var sites = dataStore.getSites();

    // Probability container
    var probContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox());

    // Meteogram container
    var meteoContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox());
    me.meteoImage = new qx.ui.basic.Image("http://www.nws.noaa.gov/mdl/gfslamp/meteo.php?BackHour=3&TempBox=N&DewBox=N&SkyBox=N&WindSpdBox=N&WindDirBox=N&WindGustBox=N&CigBox=Y&VisBox=Y&ObvBox=N&PtypeBox=Y&PopoBox=Y&LightningBox=Y&ConvBox=Y&sta=" + sites[0]).set( {
      scale : true
    });
    meteoContainer.add(me.meteoImage);
    mainContainer.add(probContainer);
    mainContainer.add(meteoContainer);
    me.add(mainContainer);

    // MVFR
    var mvfrContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox());
    me.mvfrCigImage = new qx.ui.basic.Image("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + sites[0] + "&elm=cig&flightcat=MVFR").set( {
      scale : true
    });
    me.mvfrVisImage = new qx.ui.basic.Image("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + sites[0] + "&elm=vis&flightcat=MVFR").set( {
      scale : true
    });
    mvfrContainer.add(me.mvfrCigImage);
    mvfrContainer.add(me.mvfrVisImage);
    probContainer.add(mvfrContainer);

    // IFR
    var ifrContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox());
    me.ifrCigImage = new qx.ui.basic.Image("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + sites[0] + "&elm=cig&flightcat=IFR").set( {
      scale : true
    });
    me.ifrVisImage = new qx.ui.basic.Image("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + sites[0] + "&elm=vis&flightcat=IFR").set( {
      scale : true
    });
    ifrContainer.add(me.ifrCigImage);
    ifrContainer.add(me.ifrVisImage);
    probContainer.add(ifrContainer);

    // LIFR
    var lifrContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox());
    me.lifrCigImage = new qx.ui.basic.Image("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + sites[0] + "&elm=cig&flightcat=LIFR").set( {
      scale : true
    });
    me.lifrVisImage = new qx.ui.basic.Image("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + sites[0] + "&elm=vis&flightcat=LIFR").set( {
      scale : true
    });
    lifrContainer.add(me.lifrCigImage);
    lifrContainer.add(me.lifrVisImage);
    probContainer.add(lifrContainer);

    /*
     TAF - get the taf from ADDS and then parse out the TAF portion
     */
    me.taf = new qx.ui.embed.Html('hi').set(
    {
      minHeight : 400,
      paddingTop : 20
    });
    probContainer.add(me.taf);
    me.req = new qx.io.request.Xhr("resource/aviationd3/getTaf.php?site=" + sites[0]);
    me.req.addListener("success", function(e)
    {
      var response = e.getTarget().getResponse();
      var print = false;
      var taf = '<b>TAF:</b><br>';
      me.lines = 0;

      // Parsing the TAF
      response.split('\n').forEach(function(obj)
      {
        if (obj.indexOf('<PRE><font face="Monospace,Courier" size="+1">') !== -1) {
          print = true;
        }
        if (obj.indexOf('</font></PRE>') !== -1) {
          print = false;
        }
        if (print)
        {
          taf += obj + '\n';
          me.lines++;
        }
      })
      me.taf.setHtml(taf);
      me.taf.setMinHeight(me.lines * 40);
    }, this);

    // Send request
    me.req.send();

    // Radar Image
    me.radar = new qx.ui.basic.Image("http://radar.weather.gov/lite/NCR/" + radarId + "_loop.gif").set(
    {
      scale : true,
      width : 300,
      height : 300
    });
    probContainer.add(me.radar);
    var timer = new qx.event.Timer(3600 * 3 * 1000);
    timer.addListener("interval", function(e)
    {
      me.radar.setSource("http://radar.weather.gov/lite/NCR/" + radarId + "_loop.gif?" + parseInt(Math.random() * 1000));
      me.changeSite(me.getSite(), true);
    });
    timer.start();
  },
  members :
  {
    /**
    Change the site
    */
    changeSite : function(site, force)
    {
      var me = this;
      var rand = '';
      if (typeof (force) !== "undefined")
      {
        rand = "&rand=" + parseInt(Math.random() * 1000);
        site = me.getSite();
      }
      me.mvfrCigImage.setSource("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + site + "&elm=cig&flightcat=MVFR" + rand);
      me.mvfrVisImage.setSource("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + site + "&elm=vis&flightcat=MVFR" + rand);
      me.ifrCigImage.setSource("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + site + "&elm=cig&flightcat=IFR" + rand);
      me.ifrVisImage.setSource("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + site + "&elm=vis&flightcat=IFR" + rand);
      me.lifrCigImage.setSource("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + site + "&elm=cig&flightcat=LIFR" + rand);
      me.lifrVisImage.setSource("http://www.nws.noaa.gov/mdl/gfslamp/makeuncertplot.php?&sta=" + site + "&elm=vis&flightcat=LIFR" + rand);
      me.meteoImage.setSource("http://www.nws.noaa.gov/mdl/gfslamp/meteo.php?BackHour=3&TempBox=N&DewBox=N&SkyBox=N&WindSpdBox=N&WindDirBox=N&WindGustBox=N&CigBox=Y&VisBox=Y&ObvBox=N&PtypeBox=Y&PopoBox=Y&LightningBox=Y&ConvBox=Y&sta=" + site + rand);
      me.req.setUrl("resource/aviationd3/getTaf.php?site=" + site);
      me.req.send();
      me.setSite(site);
    },

    /**
    Change the image size
    */
    changeImageSize : function(width)
    {
      var me = this;
      var width = parseInt(width);
      var height = parseInt(width * 0.4);
      me.mvfrCigImage.setWidth(width);
      me.mvfrVisImage.setWidth(width);
      me.ifrCigImage.setWidth(width);
      me.ifrVisImage.setWidth(width);
      me.lifrCigImage.setWidth(width);
      me.lifrVisImage.setWidth(width);
      me.mvfrCigImage.setHeight(height);
      me.mvfrVisImage.setHeight(height);
      me.ifrCigImage.setHeight(height);
      me.ifrVisImage.setHeight(height);
      me.lifrCigImage.setHeight(height);
      me.lifrVisImage.setHeight(height);

      // Meteograms

      //      me.meteoImage.setWidth(parseInt(width * 2));

      //      me.meteoImage.setHeight(parseInt(height * 6.5));
    }
  }
});
