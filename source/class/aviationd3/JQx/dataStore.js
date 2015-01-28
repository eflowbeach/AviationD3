/**
   Program Name: dataStore.js
   Author: jwolfe
   Date: 1/23/15
*/
qx.Class.define("aviationd3.JQx.dataStore",
{
  extend : qx.core.Object,
  type : "singleton",
  properties : {
    sites : {
      init : ["KCRW"]
    }
  },
  construct : function() {
    this.base(arguments);
  },
  members : {

  }
});
