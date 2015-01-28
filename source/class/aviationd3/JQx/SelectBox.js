/**
A class that extends the default SelectBox with the pre Qx 4.0 ability to use the mousewheel to scroll the selections.
*/
qx.Class.define("aviationd3.JQx.SelectBox",
{
  extend : qx.ui.form.SelectBox,
  properties : {
    wheelDirection :
    {
      init : null,
      nullable : true
    }
  },
  construct : function()
  {
    var me = this;
    me.base(arguments);

    // Added a timer - since the mousewheel event would fire many events in rapid succession skipping selections.
    var timer = new qx.event.Timer(0);
    timer.addListener("interval", function(e)
    {
      var selection = me.getSelection();
      var curSelIndex = 0;
      me.getSelectables().forEach(function(obj, index) {
        if (selection[0] == obj) {
          curSelIndex = index;
        }
      })
      if (me.getWheelDirection() > 0) {
        if (typeof (me.getSelectables()[curSelIndex + 1]) !== "undefined") {
          me.setSelection([me.getSelectables()[curSelIndex + 1]]);
        }
      } else {
        if (typeof (me.getSelectables()[curSelIndex - 1]) !== "undefined") {
          me.setSelection([me.getSelectables()[curSelIndex - 1]]);
        }
      }
      timer.stop();
    });

    //me.addListener("mousewheel", function(e) {
    me.addListener("roll", function(e) {
      me.getSelectables().forEach(function(obj, index) {
        if (me.getSelection()[0] == obj)
        {
          // me.setWheelDirection(e.getWheelDelta());
          me.setWheelDirection(e.getDelta().y);
          timer.restart();
        }
      });
    });
  }
});
