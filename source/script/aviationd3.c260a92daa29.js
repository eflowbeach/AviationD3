/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Contains some common methods available to all log appenders.
 */
qx.Bootstrap.define("qx.log.appender.Util",
{
  statics :
  {
    /**
     * Converts a single log entry to HTML
     *
     * @signature function(entry)
     * @param entry {Map} The entry to process
     */
    toHtml : function(entry)
    {
      var output = [];
      var item, msg, sub, list;

      output.push("<span class='offset'>", this.formatOffset(entry.offset, 6), "</span> ");

      if (entry.object)
      {
        var obj = entry.win.qx.core.ObjectRegistry.fromHashCode(entry.object);
        if (obj) {
          output.push("<span class='object' title='Object instance with hash code: " + obj.$$hash + "'>", obj.classname, "[" , obj.$$hash, "]</span>: ");
        }
      }
      else if (entry.clazz)
      {
        output.push("<span class='object'>" + entry.clazz.classname, "</span>: ");
      }

      var items = entry.items;
      for (var i=0, il=items.length; i<il; i++)
      {
        item = items[i];
        msg = item.text;

        if (msg instanceof Array)
        {
          var list = [];

          for (var j=0, jl=msg.length; j<jl; j++)
          {
            sub = msg[j];
            if (typeof sub === "string") {
              list.push("<span>" + this.escapeHTML(sub) + "</span>");
            } else if (sub.key) {
              list.push("<span class='type-key'>" + sub.key + "</span>:<span class='type-" + sub.type + "'>" + this.escapeHTML(sub.text) + "</span>");
            } else {
              list.push("<span class='type-" + sub.type + "'>" + this.escapeHTML(sub.text) + "</span>");
            }
          }

          output.push("<span class='type-" + item.type + "'>");

          if (item.type === "map") {
            output.push("{", list.join(", "), "}");
          } else {
            output.push("[", list.join(", "), "]");
          }

          output.push("</span>");
        }
        else
        {
          output.push("<span class='type-" + item.type + "'>" + this.escapeHTML(msg) + "</span> ");
        }
      }

      var wrapper = document.createElement("DIV");
      wrapper.innerHTML = output.join("");
      wrapper.className = "level-" + entry.level;

      return wrapper;
    },


    /**
     * Formats a numeric time offset to 6 characters.
     *
     * @param offset {Integer} Current offset value
     * @param length {Integer?6} Refine the length
     * @return {String} Padded string
     */
    formatOffset : function(offset, length)
    {
      var str = offset.toString();
      var diff = (length||6) - str.length;
      var pad = "";

      for (var i=0; i<diff; i++) {
        pad += "0";
      }

      return pad+str;
    },


    /**
     * Escapes the HTML in the given value
     *
     * @param value {String} value to escape
     * @return {String} escaped value
     */
    escapeHTML : function(value) {
      return String(value).replace(/[<>&"']/g, this.__escapeHTMLReplace);
    },


    /**
     * Internal replacement helper for HTML escape.
     *
     * @param ch {String} Single item to replace.
     * @return {String} Replaced item
     */
    __escapeHTMLReplace : function(ch)
    {
      var map =
      {
        "<" : "&lt;",
        ">" : "&gt;",
        "&" : "&amp;",
        "'" : "&#39;",
        '"' : "&quot;"
      };

      return map[ch] || "?";
    },


    /**
     * Converts a single log entry to plain text
     *
     * @param entry {Map} The entry to process
     * @return {String} the formatted log entry
     */
    toText : function(entry) {
      return this.toTextArray(entry).join(" ");
    },


    /**
     * Converts a single log entry to an array of plain text
     *
     * @param entry {Map} The entry to process
     * @return {Array} Argument list ready message array.
     */
    toTextArray : function(entry)
    {
      var output = [];

      output.push(this.formatOffset(entry.offset, 6));

      if (entry.object)
      {
        var obj = entry.win.qx.core.ObjectRegistry.fromHashCode(entry.object);
        if (obj) {
          output.push(obj.classname + "[" + obj.$$hash + "]:");
        }
      }
      else if (entry.clazz) {
        output.push(entry.clazz.classname + ":");
      }

      var items = entry.items;
      var item, msg;
      for (var i=0, il=items.length; i<il; i++)
      {
        item = items[i];
        msg = item.text;

        if (item.trace && item.trace.length > 0) {
          if (typeof(this.FORMAT_STACK) == "function") {
            qx.log.Logger.deprecatedConstantWarning(qx.log.appender.Util,
              "FORMAT_STACK",
              "Use qx.dev.StackTrace.FORMAT_STACKTRACE instead");
            msg += "\n" + this.FORMAT_STACK(item.trace);
          } else {
            msg += "\n" + item.trace;
          }
        }

        if (msg instanceof Array)
        {
          var list = [];
          for (var j=0, jl=msg.length; j<jl; j++) {
            list.push(msg[j].text);
          }

          if (item.type === "map") {
            output.push("{", list.join(", "), "}");
          } else {
            output.push("[", list.join(", "), "]");
          }
        }
        else
        {
          output.push(msg);
        }
      }

      return output;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Processes the incoming log entry and displays it by means of the native
 * logging capabilities of the client.
 *
 * Supported browsers:
 * * Firefox <4 using FireBug (if available).
 * * Firefox >=4 using the Web Console.
 * * WebKit browsers using the Web Inspector/Developer Tools.
 * * Internet Explorer 8+ using the F12 Developer Tools.
 * * Opera >=10.60 using either the Error Console or Dragonfly
 *
 * Currently unsupported browsers:
 * * Opera <10.60
 *
 * @require(qx.log.appender.Util)
 * @require(qx.bom.client.Html)
 */
qx.Bootstrap.define("qx.log.appender.Native",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Processes a single log entry
     *
     * @param entry {Map} The entry to process
     */
    process : function(entry)
    {
      if (qx.core.Environment.get("html.console")) {
        // Firefox 4's Web Console doesn't support "debug"
        var level = console[entry.level] ? entry.level : "log";
        if (console[level]) {
          var args = qx.log.appender.Util.toText(entry);
          console[level](args);
        }
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.log.Logger.register(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Feature-rich console appender for the qooxdoo logging system.
 *
 * Creates a small inline element which is placed in the top-right corner
 * of the window. Prints all messages with a nice color highlighting.
 *
 * * Allows user command inputs.
 * * Command history enabled by default (Keyboard up/down arrows).
 * * Lazy creation on first open.
 * * Clearing the console using a button.
 * * Display of offset (time after loading) of each message
 * * Supports keyboard shortcuts F7 or Ctrl+D to toggle the visibility
 *
 * @require(qx.event.handler.Window)
 * @require(qx.event.handler.Keyboard)
 * @require(qx.event.handler.Gesture)
 */
qx.Class.define("qx.log.appender.Console",
{
  statics :
  {
    /*
    ---------------------------------------------------------------------------
      INITIALIZATION AND SHUTDOWN
    ---------------------------------------------------------------------------
    */

   __main : null,

   __log : null,

   __cmd : null,

   __lastCommand : null,

    /**
     * Initializes the console, building HTML and pushing last
     * log messages to the output window.
     *
     */
    init : function()
    {
      // Build style sheet content
      var style =
      [
        '.qxconsole{z-index:10000;width:600px;height:300px;top:0px;right:0px;position:absolute;border-left:1px solid black;color:black;border-bottom:1px solid black;color:black;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.2;}',

        '.qxconsole .control{background:#cdcdcd;border-bottom:1px solid black;padding:4px 8px;}',
        '.qxconsole .control a{text-decoration:none;color:black;}',

        '.qxconsole .messages{background:white;height:100%;width:100%;overflow:auto;}',
        '.qxconsole .messages div{padding:0px 4px;}',

        '.qxconsole .messages .user-command{color:blue}',
        '.qxconsole .messages .user-result{background:white}',
        '.qxconsole .messages .user-error{background:#FFE2D5}',
        '.qxconsole .messages .level-debug{background:white}',
        '.qxconsole .messages .level-info{background:#DEEDFA}',
        '.qxconsole .messages .level-warn{background:#FFF7D5}',
        '.qxconsole .messages .level-error{background:#FFE2D5}',
        '.qxconsole .messages .level-user{background:#E3EFE9}',
        '.qxconsole .messages .type-string{color:black;font-weight:normal;}',
        '.qxconsole .messages .type-number{color:#155791;font-weight:normal;}',
        '.qxconsole .messages .type-boolean{color:#15BC91;font-weight:normal;}',
        '.qxconsole .messages .type-array{color:#CC3E8A;font-weight:bold;}',
        '.qxconsole .messages .type-map{color:#CC3E8A;font-weight:bold;}',
        '.qxconsole .messages .type-key{color:#565656;font-style:italic}',
        '.qxconsole .messages .type-class{color:#5F3E8A;font-weight:bold}',
        '.qxconsole .messages .type-instance{color:#565656;font-weight:bold}',
        '.qxconsole .messages .type-stringify{color:#565656;font-weight:bold}',

        '.qxconsole .command{background:white;padding:2px 4px;border-top:1px solid black;}',
        '.qxconsole .command input{width:100%;border:0 none;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.2;}',
        '.qxconsole .command input:focus{outline:none;}'
      ];

      // Include stylesheet
      qx.bom.Stylesheet.createElement(style.join(""));

      // Build markup
      var markup =
      [
        '<div class="qxconsole">',
        '<div class="control"><a href="javascript:qx.log.appender.Console.clear()">Clear</a> | <a href="javascript:qx.log.appender.Console.toggle()">Hide</a></div>',
        '<div class="messages">',
        '</div>',
        '<div class="command">',
        '<input type="text"/>',
        '</div>',
        '</div>'
      ];

      // Insert HTML to access DOM node
      var wrapper = document.createElement("DIV");
      wrapper.innerHTML = markup.join("");
      var main = wrapper.firstChild;
      document.body.appendChild(wrapper.firstChild);

      // Make important DOM nodes available
      this.__main = main;
      this.__log = main.childNodes[1];
      this.__cmd = main.childNodes[2].firstChild;

      // Correct height of messages frame
      this.__onResize();

      // Finally register to log engine
      qx.log.Logger.register(this);

      // Register to object manager
      qx.core.ObjectRegistry.register(this);
    },


    /**
     * Used by the object registry to dispose this instance e.g. remove listeners etc.
     *
     */
    dispose : function()
    {
      qx.event.Registration.removeListener(document.documentElement, "keypress", this.__onKeyPress, this);
      qx.log.Logger.unregister(this);
    },





    /*
    ---------------------------------------------------------------------------
      INSERT & CLEAR
    ---------------------------------------------------------------------------
    */

    /**
     * Clears the current console output.
     *
     */
    clear : function()
    {
      // Remove all messages
      this.__log.innerHTML = "";
    },


    /**
     * Processes a single log entry
     *
     * @signature function(entry)
     * @param entry {Map} The entry to process
     */
    process : function(entry)
    {
      // Append new content
      this.__log.appendChild(qx.log.appender.Util.toHtml(entry));

      // Scroll down
      this.__scrollDown();
    },


    /**
     * Automatically scroll down to the last line
     */
    __scrollDown : function() {
      this.__log.scrollTop = this.__log.scrollHeight;
    },





    /*
    ---------------------------------------------------------------------------
      VISIBILITY TOGGLING
    ---------------------------------------------------------------------------
    */

    /** @type {Boolean} Flag to store last visibility status */
    __visible : true,


    /**
     * Toggles the visibility of the console between visible and hidden.
     *
     */
    toggle : function()
    {
      if (!this.__main)
      {
        this.init();
      }
      else if (this.__main.style.display == "none")
      {
        this.show();
      }
      else
      {
        this.__main.style.display = "none";
      }
    },


    /**
     * Shows the console.
     *
     */
    show : function()
    {
      if (!this.__main) {
        this.init();
      } else {
        this.__main.style.display = "block";
        this.__log.scrollTop = this.__log.scrollHeight;
      }
    },


    /*
    ---------------------------------------------------------------------------
      COMMAND LINE SUPPORT
    ---------------------------------------------------------------------------
    */

    /** @type {Array} List of all previous commands. */
    __history : [],


    /**
     * Executes the currently given command
     *
     */
    execute : function()
    {
      var value = this.__cmd.value;
      if (value == "") {
        return;
      }

      if (value == "clear") {
        this.clear();
        return;
      }

      var command = document.createElement("div");
      command.innerHTML = qx.log.appender.Util.escapeHTML(">>> " + value);
      command.className = "user-command";

      this.__history.push(value);
      this.__lastCommand = this.__history.length;
      this.__log.appendChild(command);
      this.__scrollDown();

      try {
        var ret = window.eval(value);
      }
      catch (ex) {
        qx.log.Logger.error(ex);
      }

      if (ret !== undefined) {
        qx.log.Logger.debug(ret);
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Event handler for resize listener
     *
     * @param e {Event} Event object
     */
    __onResize : function(e) {
      this.__log.style.height = (this.__main.clientHeight - this.__main.firstChild.offsetHeight - this.__main.lastChild.offsetHeight) + "px";
    },


    /**
     * Event handler for keydown listener
     *
     * @param e {Event} Event object
     */
    __onKeyPress : function(e)
    {
      if (e instanceof qx.event.type.Tap || e instanceof qx.event.type.Pointer) {
        var target = e.getTarget();
        if (target && target.className && target.className.indexOf && target.className.indexOf("navigationbar") != -1) {
          this.toggle();
        }
        return;
      }

      var iden = e.getKeyIdentifier();

      // Console toggling
      if ((iden == "F7") || (iden == "D" && e.isCtrlPressed()))
      {
        this.toggle();
        e.preventDefault();
      }

      // Not yet created
      if (!this.__main) {
        return;
      }

      // Active element not in console
      if (!qx.dom.Hierarchy.contains(this.__main, e.getTarget())) {
        return;
      }

      // Command execution
      if (iden == "Enter" && this.__cmd.value != "")
      {
        this.execute();
        this.__cmd.value = "";
      }

      // History managment
      if (iden == "Up" || iden == "Down")
      {
        this.__lastCommand += iden == "Up" ? -1 : 1;
        this.__lastCommand = Math.min(Math.max(0, this.__lastCommand), this.__history.length);

        var entry = this.__history[this.__lastCommand];
        this.__cmd.value = entry || "";
        this.__cmd.select();
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addListener(document.documentElement, "keypress", statics.__onKeyPress, statics);
    qx.event.Registration.addListener(document.documentElement, "longtap", statics.__onKeyPress, statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This mixin is included by all widgets, which support an 'execute' like
 * buttons or menu entries.
 */
qx.Mixin.define("qx.ui.core.MExecutable",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired if the {@link #execute} method is invoked.*/
    "execute" : "qx.event.type.Event"
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * A command called if the {@link #execute} method is called, e.g. on a
     * button tap.
     */
    command :
    {
      check : function(value) {
        return value instanceof qx.ui.core.Command || value instanceof qx.ui.command.Command;
      },
      apply : "_applyCommand",
      event : "changeCommand",
      nullable : true
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __executableBindingIds : null,
    __semaphore : false,
    __executeListenerId : null,


    /**
     * @type {Map} Set of properties, which will by synced from the command to the
     *    including widget
     *
     * @lint ignoreReferenceField(_bindableProperties)
     */
    _bindableProperties :
    [
      "enabled",
      "label",
      "icon",
      "toolTipText",
      "value",
      "menu"
    ],


    /**
     * Initiate the execute action.
     */
    execute : function()
    {
      var cmd = this.getCommand();

      if (cmd) {
        if (this.__semaphore) {
          this.__semaphore = false;
        } else {
          this.__semaphore = true;
          cmd.execute(this);
        }
      }

      this.fireEvent("execute");
    },


    /**
     * Handler for the execute event of the command.
     *
     * @param e {qx.event.type.Event} The execute event of the command.
     */
    __onCommandExecute : function(e) {
      if (this.__semaphore) {
        this.__semaphore = false;
        return;
      }
      this.__semaphore = true;
      this.execute();
    },


    // property apply
    _applyCommand : function(value, old)
    {
      // execute forwarding
      if (old != null) {
        old.removeListenerById(this.__executeListenerId);
      }
      if (value != null) {
        this.__executeListenerId = value.addListener(
          "execute", this.__onCommandExecute, this
        );
      }

      // binding stuff
      var ids = this.__executableBindingIds;
      if (ids == null) {
        this.__executableBindingIds = ids = {};
      }

      var selfPropertyValue;
      for (var i = 0; i < this._bindableProperties.length; i++) {
        var property = this._bindableProperties[i];

        // remove the old binding
        if (old != null && !old.isDisposed() && ids[property] != null)
        {
          old.removeBinding(ids[property]);
          ids[property] = null;
        }

        // add the new binding
        if (value != null && qx.Class.hasProperty(this.constructor, property)) {
          // handle the init value (dont sync the initial null)
          var cmdPropertyValue = value.get(property);
          if (cmdPropertyValue == null) {
            selfPropertyValue = this.get(property);
            // check also for themed values [BUG #5906]
            if (selfPropertyValue == null) {
              // update the appearance to make sure every themed property is up to date
              this.syncAppearance();
              selfPropertyValue = qx.util.PropertyUtil.getThemeValue(
                this, property
              );
            }
          } else {
            // Reset the self property value [BUG #4534]
            selfPropertyValue = null;
          }
          // set up the binding
          ids[property] = value.bind(property, this, property);
          // reapply the former value
          if (selfPropertyValue) {
            this.set(property, selfPropertyValue);
          }
        }
      }
    }
  },


  destruct : function() {
    this._applyCommand(null, this.getCommand());
    this.__executableBindingIds = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2014 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)
     * Mustafa Sak (msak)

************************************************************************ */
/**
 * Commands can be used to globally define keyboard shortcuts. They could
 * also be used to assign an execution of a command sequence to multiple
 * widgets. It is possible to use the same Command in a MenuButton and
 * ToolBarButton for example.
 */
qx.Class.define("qx.ui.command.Command",
{
  extend : qx.core.Object,


  /**
   * @param shortcut {String} Shortcuts can be composed of optional modifier
   *    keys Control, Alt, Shift, Meta and a non modifier key.
   *    If no non modifier key is specified, the second paramater is evaluated.
   *    The key must be separated by a <code>+</code> or <code>-</code> character.
   *    Examples: Alt+F1, Control+C, Control+Alt+Delete
   */
  construct : function(shortcut)
  {
    this.base(arguments);
    this._shortcut = new qx.bom.Shortcut(shortcut);
    this._shortcut.addListener("execute", this.execute, this);

    if (shortcut !== undefined) {
      this.setShortcut(shortcut);
    }
  },


  events :
  {
    /**
     * Fired when the command is executed. Sets the "data" property of the
     * event to the object that issued the command.
     */
    "execute" : "qx.event.type.Data"
  },


  properties :
  {
    /** Whether the command should be activated. If 'false' execute event
     * wouldn't fire. This proprty will be used by command groups when
     * activating/deactivating all commands of the group.*/
    active :
    {
      init : true,
      check : "Boolean",
      event : "changeActive",
      apply : "_applyActive"
    },


    /** Whether the command should be respected/enabled. If 'false' execute event
     * wouldn't fire. If value of property {@link qx.ui.command.Command#active}
     * is 'false', enabled value can be set but has no effect until
     * {@link qx.ui.command.Command#active} will be set to 'true'.*/
    enabled :
    {
      init : true,
      check : "Boolean",
      event : "changeEnabled",
      apply : "_applyEnabled"
    },


    /** The command shortcut as a string */
    shortcut :
    {
      check : "String",
      apply : "_applyShortcut",
      nullable : true
    },


    /** The label, which will be set in all connected widgets (if available) */
    label :
    {
      check : "String",
      nullable : true,
      event : "changeLabel"
    },


    /** The icon, which will be set in all connected widgets (if available) */
    icon :
    {
      check : "String",
      nullable : true,
      event : "changeIcon"
    },


    /**
     * The tooltip text, which will be set in all connected
     * widgets (if available)
     */
    toolTipText :
    {
      check : "String",
      nullable : true,
      event : "changeToolTipText"
    },


    /** The value of the connected widgets */
    value :
    {
      nullable : true,
      event : "changeValue"
    },


    /** The menu, which will be set in all connected widgets (if available) */
    menu :
    {
      check : "qx.ui.menu.Menu",
      nullable : true,
      event : "changeMenu"
    }
  },


  members :
  {
    _shortcut : null,


    // property apply
    _applyActive : function(value)
    {
      if (value === false) {
        this._shortcut.setEnabled(false);
      } else {
        // syncronize value with current "enabled" value of this command
        this._shortcut.setEnabled(this.getEnabled());
      }
    },


    // property apply
    _applyEnabled : function(value)
    {
      if (this.getActive()) {
        this._shortcut.setEnabled(value);
      }
    },


    // property apply
    _applyShortcut : function(value) {
      this._shortcut.setShortcut(value);
    },


    /**
     * Fire the "execute" event on this command. If property
     * <code>active</code> and <code>enabled</code> set to
     * <code>true</code>.
     * @param target {Object?} Object which issued the execute event
     */
    execute : function(target)
    {
      if (this.getActive() && this.getEnabled()) {
        this.fireDataEvent("execute", target);
      }
    },


    /**
     * Returns the used shortcut as string using the currently selected locale.
     *
     * @return {String} shortcut
     */
    toString : function()
    {
      return this._shortcut.toString();
    }
  },


  destruct : function()
  {
    this._shortcut.removeListener("execute", this.execute, this);
    this._disposeObjects("_shortcut");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Shortcuts can be used to globally define keyboard shortcuts.
 */
qx.Class.define("qx.bom.Shortcut",
{
  extend : qx.core.Object,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a new instance of Command
   *
   * @param shortcut {String} shortcuts can be composed of optional modifier
   *    keys Control, Alt, Shift, Meta and a non modifier key.
   *    If no non modifier key is specified, the second paramater is evaluated.
   *    The key must be separated by a <code>+</code> or <code>-</code> character.
   *    Examples: Alt+F1, Control+C, Control+Alt+Delete
   */
  construct : function(shortcut)
  {
    this.base(arguments);

    this.__modifier = {};
    this.__key = null;

    if (shortcut != null) {
      this.setShortcut(shortcut);
    }

    this.initEnabled();
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the command is executed. Sets the "data" property of the event to
     * the object that issued the command.
     */
    "execute" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** whether the command should be respected/enabled */
    enabled :
    {
      init : true,
      check : "Boolean",
      event : "changeEnabled",
      apply : "_applyEnabled"
    },


    /** The command shortcut */
    shortcut :
    {
      check : "String",
      apply : "_applyShortcut",
      nullable : true
    },


    /**
     * Whether the execute event should be fired repeatedly if the user keep
     * the keys pressed.
     */
    autoRepeat :
    {
      check : "Boolean",
      init : false
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __modifier : "",
    __key : "",


    /*
    ---------------------------------------------------------------------------
      USER METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Fire the "execute" event on this shortcut.
     *
     * @param target {Object} Object which issued the execute event
     */
    execute : function(target) {
      this.fireDataEvent("execute", target);
    },


    /**
     * Key down event handler.
     *
     * @param event {qx.event.type.KeySequence} The key event object
     */
    __onKeyDown : function(event)
    {
      if (this.getEnabled() && this.__matchesKeyEvent(event))
      {
        if (!this.isAutoRepeat()) {
          this.execute(event.getTarget());
        }
        event.stop();
      }
    },


    /**
     * Key press event handler.
     *
     * @param event {qx.event.type.KeySequence} The key event object
     */
    __onKeyPress : function(event)
    {
      if (this.getEnabled() && this.__matchesKeyEvent(event))
      {
        if (this.isAutoRepeat()) {
          this.execute(event.getTarget());
        }
        event.stop();
      }
    },



    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */


    // property apply
    _applyEnabled : function(value, old)
    {
      if (value) {
        qx.event.Registration.addListener(document.documentElement, "keydown", this.__onKeyDown, this);
        qx.event.Registration.addListener(document.documentElement, "keypress", this.__onKeyPress, this);
      } else {
        qx.event.Registration.removeListener(document.documentElement, "keydown", this.__onKeyDown, this);
        qx.event.Registration.removeListener(document.documentElement, "keypress", this.__onKeyPress, this);
      }
    },


    // property apply
    _applyShortcut : function(value, old)
    {
      if (value)
      {
        // do not allow whitespaces within shortcuts
        if (value.search(/[\s]+/) != -1)
        {
          var msg = "Whitespaces are not allowed within shortcuts";
          this.error(msg);
          throw new Error(msg);
        }

        this.__modifier = { "Control" : false,
                            "Shift"   : false,
                            "Meta"    : false,
                            "Alt"     : false };
        this.__key = null;

        // To support shortcuts with "+" and "-" as keys it is necessary
        // to split the given value in a different way to determine the
        // several keyIdentifiers
        var index;
        var a = [];
        while (value.length > 0 && index != -1)
        {
          // search for delimiters "+" and "-"
          index = value.search(/[-+]+/);

          // add identifiers - take value if no separator was found or
          // only one char is left (second part of shortcut)
          a.push((value.length == 1 || index == -1) ? value : value.substring(0, index));

          // extract the already detected identifier
          value = value.substring(index + 1);
        }
        var al = a.length;

        for (var i=0; i<al; i++)
        {
          var identifier = this.__normalizeKeyIdentifier(a[i]);

          switch(identifier)
          {
            case "Control":
            case "Shift":
            case "Meta":
            case "Alt":
              this.__modifier[identifier] = true;
              break;

            case "Unidentified":
              var msg = "Not a valid key name for a shortcut: " + a[i];
              this.error(msg);
              throw msg;

            default:
              if (this.__key)
              {
                var msg = "You can only specify one non modifier key!";
                this.error(msg);
                throw msg;
              }

              this.__key = identifier;
          }
        }
      }

      return true;
    },




    /*
    --------------------------------------------------------------------------
      INTERNAL MATCHING LOGIC
    ---------------------------------------------------------------------------
    */

    /**
     * Checks whether the given key event matches the shortcut's shortcut
     *
     * @param e {qx.event.type.KeySequence} the key event object
     * @return {Boolean} whether the shortcuts shortcut matches the key event
     */
    __matchesKeyEvent : function(e)
    {
      var key = this.__key;

      if (!key)
      {
        // no shortcut defined.
        return false;
      }

      // for check special keys
      // and check if a shortcut is a single char and special keys are pressed
      if (
        (!this.__modifier.Shift && e.isShiftPressed()) ||
        (this.__modifier.Shift && !e.isShiftPressed()) ||
        (!this.__modifier.Control && e.isCtrlPressed()) ||
        (this.__modifier.Control && !e.isCtrlPressed()) ||
        (!this.__modifier.Meta && e.isMetaPressed()) ||
        (this.__modifier.Meta && !e.isMetaPressed()) ||
        (!this.__modifier.Alt && e.isAltPressed()) ||
        (this.__modifier.Alt && !e.isAltPressed())
      ) {
        return false;
      }

      if (key == e.getKeyIdentifier()) {
        return true;
      }

      return false;
    },


    /*
    ---------------------------------------------------------------------------
      COMPATIBILITY TO COMMAND
    ---------------------------------------------------------------------------
    */

    /**
     * @lint ignoreReferenceField(__oldKeyNameToKeyIdentifierMap)
     */
    __oldKeyNameToKeyIdentifierMap :
    {
      // all other keys are converted by converting the first letter to uppercase
      esc             : "Escape",
      ctrl            : "Control",
      print           : "PrintScreen",
      del             : "Delete",
      pageup          : "PageUp",
      pagedown        : "PageDown",
      numlock         : "NumLock",
      numpad_0        : "0",
      numpad_1        : "1",
      numpad_2        : "2",
      numpad_3        : "3",
      numpad_4        : "4",
      numpad_5        : "5",
      numpad_6        : "6",
      numpad_7        : "7",
      numpad_8        : "8",
      numpad_9        : "9",
      numpad_divide   : "/",
      numpad_multiply : "*",
      numpad_minus    : "-",
      numpad_plus     : "+"
    },


    /**
     * Checks and normalizes the key identifier.
     *
     * @param keyName {String} name of the key.
     * @return {String} normalized keyIdentifier or "Unidentified" if a conversion was not possible
     */
    __normalizeKeyIdentifier : function(keyName)
    {
      var kbUtil = qx.event.util.Keyboard;
      var keyIdentifier = "Unidentified";

      if (kbUtil.isValidKeyIdentifier(keyName)) {
        return keyName;
      }

      if (keyName.length == 1 && keyName >= "a" && keyName <= "z") {
        return keyName.toUpperCase();
      }

      keyName = keyName.toLowerCase();
      var keyIdentifier = this.__oldKeyNameToKeyIdentifierMap[keyName] || qx.lang.String.firstUp(keyName);

      if (kbUtil.isValidKeyIdentifier(keyIdentifier)) {
        return keyIdentifier;
      } else {
        return "Unidentified";
      }
    },




    /*
    ---------------------------------------------------------------------------
      STRING CONVERSION
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the shortcut as string using the currently selected locale.
     *
     * @return {String} shortcut
     */
    toString : function()
    {
      var key = this.__key;

      var str = [];

      for (var modifier in this.__modifier) {
        // this.__modifier holds a map with shortcut combination keys
        // like "Control", "Alt", "Meta" and "Shift" as keys with
        // Boolean values
        if (this.__modifier[modifier])
        {
          str.push(qx.locale.Key.getKeyName("short", modifier));
        }
      }

      if (key) {
        str.push(qx.locale.Key.getKeyName("short", key));
      }

      return str.join("+");
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    // this will remove the event listener
    this.setEnabled(false);

    this.__modifier = this.__key = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Static class, which contains functionality to localize the names of keyboard keys.
 */

qx.Class.define("qx.locale.Key",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Return localized name of a key identifier
     * {@link qx.event.type.KeySequence}
     *
     * @param size {String} format of the key identifier.
     *       Possible values: "short", "full"
     * @param keyIdentifier {String} key identifier to translate {@link qx.event.type.KeySequence}
     * @param locale {String} optional locale to be used
     * @return {String} localized key name
     */
    getKeyName : function(size, keyIdentifier, locale)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertInArray(size, ["short", "full"]);
      }

      var key = "key_" + size + "_" + keyIdentifier;
      // Control is alsways named control on a mac and not Strg in German e.g.
      if (qx.core.Environment.get("os.name") == "osx" && keyIdentifier == "Control") {
        key += "_Mac";
      }
      var localizedKey = qx.locale.Manager.getInstance().translate(key, [], locale);

      if (localizedKey == key) {
        return qx.locale.Key._keyNames[key] || keyIdentifier;
      } else {
        return localizedKey;
      }
    }
  },


  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics)
  {
    var keyNames = {};
    var Manager = qx.locale.Manager;

    // TRANSLATION: short representation of key names
    keyNames[Manager.marktr("key_short_Backspace")] = "Backspace";
    keyNames[Manager.marktr("key_short_Tab")] = "Tab";
    keyNames[Manager.marktr("key_short_Space")] = "Space";
    keyNames[Manager.marktr("key_short_Enter")] = "Enter";
    keyNames[Manager.marktr("key_short_Shift")] = "Shift";
    keyNames[Manager.marktr("key_short_Control")] = "Ctrl";
    keyNames[Manager.marktr("key_short_Control_Mac")] = "Ctrl";
    keyNames[Manager.marktr("key_short_Alt")] = "Alt";
    keyNames[Manager.marktr("key_short_CapsLock")] = "Caps";
    keyNames[Manager.marktr("key_short_Meta")] = "Meta";
    keyNames[Manager.marktr("key_short_Escape")] = "Esc";
    keyNames[Manager.marktr("key_short_Left")] = "Left";
    keyNames[Manager.marktr("key_short_Up")] = "Up";
    keyNames[Manager.marktr("key_short_Right")] = "Right";
    keyNames[Manager.marktr("key_short_Down")] = "Down";
    keyNames[Manager.marktr("key_short_PageUp")] = "PgUp";
    keyNames[Manager.marktr("key_short_PageDown")] = "PgDn";
    keyNames[Manager.marktr("key_short_End")] = "End";
    keyNames[Manager.marktr("key_short_Home")] = "Home";
    keyNames[Manager.marktr("key_short_Insert")] = "Ins";
    keyNames[Manager.marktr("key_short_Delete")] = "Del";
    keyNames[Manager.marktr("key_short_NumLock")] = "Num";
    keyNames[Manager.marktr("key_short_PrintScreen")] = "Print";
    keyNames[Manager.marktr("key_short_Scroll")] = "Scroll";
    keyNames[Manager.marktr("key_short_Pause")] = "Pause";
    keyNames[Manager.marktr("key_short_Win")] = "Win";
    keyNames[Manager.marktr("key_short_Apps")] = "Apps";

    // TRANSLATION: full/long representation of key names
    keyNames[Manager.marktr("key_full_Backspace")] = "Backspace";
    keyNames[Manager.marktr("key_full_Tab")] = "Tabulator";
    keyNames[Manager.marktr("key_full_Space")] = "Space";
    keyNames[Manager.marktr("key_full_Enter")] = "Enter";
    keyNames[Manager.marktr("key_full_Shift")] = "Shift";
    keyNames[Manager.marktr("key_full_Control")] = "Control";
    keyNames[Manager.marktr("key_full_Control_Mac")] = "Control";
    keyNames[Manager.marktr("key_full_Alt")] = "Alt";
    keyNames[Manager.marktr("key_full_CapsLock")] = "CapsLock";
    keyNames[Manager.marktr("key_full_Meta")] = "Meta";
    keyNames[Manager.marktr("key_full_Escape")] = "Escape";
    keyNames[Manager.marktr("key_full_Left")] = "Left";
    keyNames[Manager.marktr("key_full_Up")] = "Up";
    keyNames[Manager.marktr("key_full_Right")] = "Right";
    keyNames[Manager.marktr("key_full_Down")] = "Down";
    keyNames[Manager.marktr("key_full_PageUp")] = "PageUp";
    keyNames[Manager.marktr("key_full_PageDown")] = "PageDown";
    keyNames[Manager.marktr("key_full_End")] = "End";
    keyNames[Manager.marktr("key_full_Home")] = "Home";
    keyNames[Manager.marktr("key_full_Insert")] = "Insert";
    keyNames[Manager.marktr("key_full_Delete")] = "Delete";
    keyNames[Manager.marktr("key_full_NumLock")] = "NumLock";
    keyNames[Manager.marktr("key_full_PrintScreen")] = "PrintScreen";
    keyNames[Manager.marktr("key_full_Scroll")] = "Scroll";
    keyNames[Manager.marktr("key_full_Pause")] = "Pause";
    keyNames[Manager.marktr("key_full_Win")] = "Win";
    keyNames[Manager.marktr("key_full_Apps")] = "Apps";

    // Save
    statics._keyNames = keyNames;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Commands can be used to globally define keyboard shortcuts. They could
 * also be used to assign an execution of a command sequence to multiple
 * widgets. It is possible to use the same Command in a MenuButton and
 * ToolBarButton for example.
 *
 * @deprecated {4.1} Please use qx.ui.command.Command instead.
 */
qx.Class.define("qx.ui.core.Command",
{
  extend : qx.ui.command.Command,


  // overridden
  construct : function(shortcut)
  {
    qx.log.Logger.deprecatedMethodWarning (
      arguments.callee, "Please use qx.ui.command.Command instead."
    );
    this.base(arguments, shortcut);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which are executable in some way. This
 * could be a button for example.
 */
qx.Interface.define("qx.ui.form.IExecutable",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the widget is executed. Sets the "data" property of the
     * event to the object that issued the command.
     */
    "execute" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      COMMAND PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Set the command of this executable.
     *
     * @param command {qx.ui.command.Command} The command.
     */
    setCommand : function(command) {
      return arguments.length == 1;
    },


    /**
     * Return the current set command of this executable.
     *
     * @return {qx.ui.command.Command} The current set command.
     */
    getCommand : function() {},


    /**
     * Fire the "execute" event on the command.
     */
    execute: function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A Button widget which supports various states and allows it to be used
 * via the mouse, touch, pen and the keyboard.
 *
 * If the user presses the button by clicking on it, or the <code>Enter</code> or
 * <code>Space</code> keys, the button fires an {@link qx.ui.core.MExecutable#execute} event.
 *
 * If the {@link qx.ui.core.MExecutable#command} property is set, the
 * command is executed as well.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var button = new qx.ui.form.Button("Hello World");
 *
 *   button.addListener("execute", function(e) {
 *     alert("Button was clicked");
 *   }, this);
 *
 *   this.getRoot().add(button);
 * </pre>
 *
 * This example creates a button with the label "Hello World" and attaches an
 * event listener to the {@link #execute} event.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/button.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.form.Button",
{
  extend : qx.ui.basic.Atom,
  include : [qx.ui.core.MExecutable],
  implement : [qx.ui.form.IExecutable],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String} label of the atom
   * @param icon {String?null} Icon URL of the atom
   * @param command {qx.ui.command.Command?null} Command instance to connect with
   */
  construct : function(label, icon, command)
  {
    this.base(arguments, label, icon);

    if (command != null) {
      this.setCommand(command);
    }

    // Add listeners
    this.addListener("pointerover", this._onPointerOver);
    this.addListener("pointerout", this._onPointerOut);
    this.addListener("pointerdown", this._onPointerDown);
    this.addListener("pointerup", this._onPointerUp);
    this.addListener("tap", this._onTap);

    this.addListener("keydown", this._onKeyDown);
    this.addListener("keyup", this._onKeyUp);

    // Stop events
    this.addListener("dbltap", this._onStopEvent);
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "button"
    },

    // overridden
    focusable :
    {
      refine : true,
      init : true
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      focused : true,
      hovered : true,
      pressed : true,
      disabled : true
    },


    /*
    ---------------------------------------------------------------------------
      USER API
    ---------------------------------------------------------------------------
    */

    /**
     * Manually press the button
     */
    press : function()
    {
      if (this.hasState("abandoned")) {
        return;
      }

      this.addState("pressed");
    },


    /**
     * Manually release the button
     */
    release : function()
    {
      if (this.hasState("pressed")) {
        this.removeState("pressed");
      }
    },


    /**
     * Completely reset the button (remove all states)
     */
    reset : function()
    {
      this.removeState("pressed");
      this.removeState("abandoned");
      this.removeState("hovered");
    },



    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Listener method for "pointerover" event
     * <ul>
     * <li>Adds state "hovered"</li>
     * <li>Removes "abandoned" and adds "pressed" state (if "abandoned" state is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerOver : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      if (this.hasState("abandoned"))
      {
        this.removeState("abandoned");
        this.addState("pressed");
      }

      this.addState("hovered");
    },


    /**
     * Listener method for "pointerout" event
     * <ul>
     * <li>Removes "hovered" state</li>
     * <li>Adds "abandoned" and removes "pressed" state (if "pressed" state is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerOut : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      this.removeState("hovered");

      if (this.hasState("pressed"))
      {
        this.removeState("pressed");
        this.addState("abandoned");
      }
    },


    /**
     * Listener method for "pointerdown" event
     * <ul>
     * <li>Removes "abandoned" state</li>
     * <li>Adds "pressed" state</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerDown : function(e)
    {
      if (!e.isLeftPressed()) {
        return;
      }

      e.stopPropagation();

      // Activate capturing if the button get a pointerout while
      // the button is pressed.
      this.capture();

      this.removeState("abandoned");
      this.addState("pressed");
    },


    /**
     * Listener method for "pointerup" event
     * <ul>
     * <li>Removes "pressed" state (if set)</li>
     * <li>Removes "abandoned" state (if set)</li>
     * <li>Adds "hovered" state (if "abandoned" state is not set)</li>
     *</ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerUp : function(e)
    {
      this.releaseCapture();

      // We must remove the states before executing the command
      // because in cases were the window lost the focus while
      // executing we get the capture phase back (mouseout).
      var hasPressed = this.hasState("pressed");
      var hasAbandoned = this.hasState("abandoned");

      if (hasPressed) {
        this.removeState("pressed");
      }

      if (hasAbandoned) {
        this.removeState("abandoned");
      }

      e.stopPropagation();
    },


    /**
     * Listener method for "tap" event which stops the propagation.
     *
     * @param e {qx.event.type.Pointer} Pointer event
     */
    _onTap : function(e) {
      // "execute" is fired here so that the button can be dragged
      // without executing it (e.g. in a TabBar with overflow)
      this.execute();
      e.stopPropagation();
    },


    /**
     * Listener method for "keydown" event.<br/>
     * Removes "abandoned" and adds "pressed" state
     * for the keys "Enter" or "Space"
     *
     * @param e {Event} Key event
     */
    _onKeyDown : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          this.removeState("abandoned");
          this.addState("pressed");
          e.stopPropagation();
      }
    },


    /**
     * Listener method for "keyup" event.<br/>
     * Removes "abandoned" and "pressed" state (if "pressed" state is set)
     * for the keys "Enter" or "Space"
     *
     * @param e {Event} Key event
     */
    _onKeyUp : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          if (this.hasState("pressed"))
          {
            this.removeState("abandoned");
            this.removeState("pressed");
            this.execute();
            e.stopPropagation();
          }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de
     2006 STZ-IDA, Germany, http://www.stz-ida.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
   * Fabian Jakobs (fjakobs)
   * Sebastian Werner (wpbasti)
   * Andreas Ecker (ecker)
   * Alexander Steitz (aback)
   * Martin Wittemann (martinwittemann)

************************************************************************* */

/* ************************************************************************


************************************************************************ */

/**
 * The modern decoration theme.
 *
 * @asset(qx/decoration/Modern/toolbar/toolbar-part.gif)
 */
qx.Theme.define("qx.theme.modern.Decoration",
{
  aliases : {
    decoration : "qx/decoration/Modern"
  },

  decorations :
  {
    /*
    ---------------------------------------------------------------------------
      CORE
    ---------------------------------------------------------------------------
    */

    "main" :
    {
      style :
      {
        width : 1,
        color : "border-main"
      }
    },

    "selected" :
    {
      style :
      {
        startColorPosition : 0,
        endColorPosition : 100,
        startColor : "selected-start",
        endColor : "selected-end"
      }
    },

    "dragover" :
    {
      style :
      {
        bottom: [2, "solid", "border-dragover"]
      }
    },

    "pane" : {
      style : {
        width: 1,
        color: "tabview-background",
        radius : 3,
        shadowColor : "shadow",
        shadowBlurRadius : 2,
        shadowLength : 0,
        gradientStart : ["pane-start", 0],
        gradientEnd : ["pane-end", 100]
      }
    },

    "group" :
    {
      style : {
        backgroundColor : "group-background",
        radius : 4,
        color : "group-border",
        width: 1
      }
    },


    "keyboard-focus" :
    {
      style :
      {
        width : 1,
        color : "keyboard-focus",
        style : "dotted"
      }
    },

    /*
    ---------------------------------------------------------------------------
      RADIO BUTTON
    ---------------------------------------------------------------------------
    */
    "radiobutton" : {
      style : {
        backgroundColor : "radiobutton-background",
        radius : 5,
        width: 1,
        innerWidth : 2,
        color : "checkbox-border",
        innerColor : "radiobutton-background",
        shadowLength : 0,
        shadowBlurRadius : 0,
        shadowColor : "checkbox-focus"
      }
    },

    "radiobutton-checked" : {
      include : "radiobutton",
      style : {
        backgroundColor : "radiobutton-checked"
      }
    },

    "radiobutton-checked-focused" : {
      include  : "radiobutton-checked",
      style : {
        shadowBlurRadius : 4
      }
    },

    "radiobutton-checked-hovered" : {
      include : "radiobutton-checked",
      style : {
        innerColor : "checkbox-hovered"
      }
    },

    "radiobutton-focused" : {
      include : "radiobutton",
      style : {
        shadowBlurRadius : 4
      }
    },

    "radiobutton-hovered" : {
      include : "radiobutton",
      style : {
        backgroundColor : "checkbox-hovered",
        innerColor : "checkbox-hovered"
      }
    },

    "radiobutton-disabled" : {
      include : "radiobutton",
      style : {
        innerColor : "radiobutton-disabled",
        backgroundColor : "radiobutton-disabled",
        color : "checkbox-disabled-border"
      }
    },

    "radiobutton-checked-disabled" : {
      include : "radiobutton-disabled",
      style : {
        backgroundColor : "radiobutton-checked-disabled"
      }
    },

    "radiobutton-invalid" : {
      include : "radiobutton",
      style : {
        color : "invalid"
      }
    },

    "radiobutton-checked-invalid" : {
      include : "radiobutton-checked",
      style : {
        color : "invalid"
      }
    },

    "radiobutton-checked-focused-invalid" : {
      include  : "radiobutton-checked-focused",
      style : {
        color : "invalid",
        shadowColor : "invalid"
      }
    },

    "radiobutton-checked-hovered-invalid" : {
      include : "radiobutton-checked-hovered",
      style : {
        color : "invalid",
        innerColor : "radiobutton-hovered-invalid"
      }
    },

    "radiobutton-focused-invalid" : {
      include : "radiobutton-focused",
      style : {
        color : "invalid",
        shadowColor : "invalid"
      }
    },

    "radiobutton-hovered-invalid" : {
      include : "radiobutton-hovered",
      style : {
        color : "invalid",
        innerColor : "radiobutton-hovered-invalid",
        backgroundColor : "radiobutton-hovered-invalid"
      }
    },


    /*
    ---------------------------------------------------------------------------
      SEPARATOR
    ---------------------------------------------------------------------------
    */

    "separator-horizontal" :
    {
      style :
      {
        widthLeft : 1,
        colorLeft : "border-separator"
      }
    },

    "separator-vertical" :
    {
      style :
      {
        widthTop : 1,
        colorTop : "border-separator"
      }
    },



    /*
    ---------------------------------------------------------------------------
      TOOLTIP
    ---------------------------------------------------------------------------
    */
    "tooltip-error" :
    {
      style : {
        backgroundColor : "tooltip-error",
        radius : 4,
        shadowColor : "shadow",
        shadowBlurRadius : 2,
        shadowLength : 1
      }
    },


    /*
    ---------------------------------------------------------------------------
      POPUP
    ---------------------------------------------------------------------------
    */

    "popup" :
    {
      style :
      {
        width : 1,
        color : "border-main",
        shadowColor : "shadow",
        shadowBlurRadius : 3,
        shadowLength : 1
      }
    },



    /*
    ---------------------------------------------------------------------------
      SCROLLBAR
    ---------------------------------------------------------------------------
    */
    "scrollbar-horizontal" :
    {
      style : {
        gradientStart : ["scrollbar-start", 0],
        gradientEnd : ["scrollbar-end", 100]
      }
    },

    "scrollbar-vertical" : {
      include : "scrollbar-horizontal",
      style : {
        orientation : "horizontal"
      }
    },

    "scrollbar-slider-horizontal" :
    {
      style : {
        gradientStart : ["scrollbar-slider-start", 0],
        gradientEnd : ["scrollbar-slider-end", 100],

        color : "border-main",
        width: 1,
        radius: 3
      }
    },

    "scrollbar-slider-vertical" :
    {
      include : "scrollbar-slider-horizontal",
      style : {
        orientation : "horizontal"
      }
    },

    "scrollbar-slider-horizontal-disabled" :
    {
      include : "scrollbar-slider-horizontal",
      style : {
        color : "button-border-disabled"
      }
    },

    "scrollbar-slider-vertical-disabled" :
    {
      include : "scrollbar-slider-vertical",
      style : {
        color : "button-border-disabled"
      }
    },



    /*
    ---------------------------------------------------------------------------
      BUTTON
    ---------------------------------------------------------------------------
    */
    "button" :
    {
      style :
      {
        radius: 3,
        color: "border-button",
        width: 1,
        startColor: "button-start",
        endColor: "button-end",
        startColorPosition: 35,
        endColorPosition: 100
      }
    },

    "button-disabled" :
    {
      include : "button",
      style : {
        color : "button-border-disabled",
        startColor: "button-disabled-start",
        endColor: "button-disabled-end"
      }
    },

    "button-hovered" :
    {
      include : "button",
      style : {
        startColor : "button-hovered-start",
        endColor : "button-hovered-end"
      }
    },

    "button-checked" :
    {
      include : "button",
      style : {
        endColor: "button-start",
        startColor: "button-end"
      }
    },

    "button-pressed" :
    {
      include : "button",
      style : {
        endColor : "button-hovered-start",
        startColor : "button-hovered-end"
      }
    },

    "button-focused" : {
      style :
      {
        radius: 3,
        color: "border-button",
        width: 1,
        innerColor: "button-focused",
        innerWidth: 2,
        startColor: "button-start",
        endColor: "button-end",
        startColorPosition: 30,
        endColorPosition: 100
      }
    },

    "button-checked-focused" : {
      include : "button-focused",
      style : {
        endColor: "button-start",
        startColor: "button-end"
      }
    },

    // invalid
    "button-invalid" : {
      include : "button",
      style : {
        color: "border-invalid"
      }
    },

    "button-disabled-invalid" :
    {
      include : "button-disabled",
      style : {
        color : "border-invalid"
      }
    },

    "button-hovered-invalid" :
    {
      include : "button-hovered",
      style : {
        color : "border-invalid"
      }
    },

    "button-checked-invalid" :
    {
      include : "button-checked",
      style : {
        color : "border-invalid"
      }
    },

    "button-pressed-invalid" :
    {
      include : "button-pressed",
      style : {
        color : "border-invalid"
      }
    },

    "button-focused-invalid" : {
      include : "button-focused",
      style : {
        color : "border-invalid"
      }
    },

    "button-checked-focused-invalid" : {
      include : "button-checked-focused",
      style : {
        color : "border-invalid"
      }
    },


    /*
    ---------------------------------------------------------------------------
      CHECK BOX
    ---------------------------------------------------------------------------
    */
    "checkbox" : {
      style : {
        width: 1,
        color: "checkbox-border",
        innerWidth : 1,
        innerColor : "checkbox-inner",

        backgroundColor: "checkbox-end",

        shadowLength : 0,
        shadowBlurRadius : 0,
        shadowColor : "checkbox-focus"
      }
    },

    "checkbox-hovered" : {
      include : "checkbox",
      style : {
        innerColor : "checkbox-hovered-inner",
        backgroundColor: "checkbox-hovered"
      }
    },

    "checkbox-focused" : {
      include : "checkbox",
      style : {
        shadowBlurRadius : 4
      }
    },

    "checkbox-disabled" : {
      include : "checkbox",
      style : {
        color : "checkbox-disabled-border",
        innerColor : "checkbox-disabled-inner",
        backgroundColor : "checkbox-disabled-end"
      }
    },

    "checkbox-invalid" : {
      include : "checkbox",
      style : {
        color : "invalid"
      }
    },

    "checkbox-hovered-invalid" : {
      include : "checkbox-hovered",
      style : {
        color : "invalid",
        innerColor : "checkbox-hovered-inner-invalid",
        backgroundColor: "checkbox-hovered-invalid"
      }
    },

    "checkbox-focused-invalid" : {
      include : "checkbox-focused",
      style : {
        color : "invalid",
        shadowColor : "invalid"
      }
    },



    /*
    ---------------------------------------------------------------------------
      TEXT FIELD
    ---------------------------------------------------------------------------
    */

    "input" :
    {
      style :
      {
        color : "border-input",
        innerColor : "border-inner-input",
        innerWidth: 1,
        width : 1,
        backgroundColor : "background-light",
        startColor : "input-start",
        endColor : "input-end",
        startColorPosition : 0,
        endColorPosition : 12,
        colorPositionUnit : "px"
      }
    },

    "border-invalid" : {
      include : "input",
      style : {
        color : "border-invalid"
      }
    },

    "input-focused" : {
      include : "input",
      style : {
        startColor : "input-focused-start",
        innerColor : "input-focused-end",
        endColorPosition : 4
      }
    },

    "input-focused-invalid" : {
      include : "input-focused",
      style : {
        innerColor : "input-focused-inner-invalid",
        color : "border-invalid"
      }
    },

    "input-disabled" : {
      include : "input",
      style : {
        color: "input-border-disabled"
      }
    },



    /*
    ---------------------------------------------------------------------------
      TOOLBAR
    ---------------------------------------------------------------------------
    */

    "toolbar" :
    {
      style : {
        startColorPosition : 40,
        endColorPosition : 60,
        startColor : "toolbar-start",
        endColor : "toolbar-end"
      }
    },

    "toolbar-button-hovered" :
    {
      style :
      {
        color : "border-toolbar-button-outer",
        width: 1,
        innerWidth: 1,
        innerColor : "border-toolbar-border-inner",
        radius : 2,
        gradientStart : ["button-start", 30],
        gradientEnd : ["button-end", 100]
      }
    },

    "toolbar-button-checked" :
    {
      include : "toolbar-button-hovered",

      style :
      {
        gradientStart : ["button-end", 30],
        gradientEnd : ["button-start", 100]
      }
    },

    "toolbar-separator" :
    {
      style :
      {
        widthLeft : 1,
        widthRight : 1,

        colorLeft : "border-toolbar-separator-left",
        colorRight : "border-toolbar-separator-right",

        styleLeft : "solid",
        styleRight : "solid"
      }
    },

    "toolbar-part" :
    {
      style :
      {
        backgroundImage  : "decoration/toolbar/toolbar-part.gif",
        backgroundRepeat : "repeat-y"
      }
    },




    /*
    ---------------------------------------------------------------------------
      TABVIEW
    ---------------------------------------------------------------------------
    */

    "tabview-pane" :
    {
      style : {
        width: 1,
        color: "window-border",
        radius : 3,
        gradientStart : ["tabview-start", 90],
        gradientEnd : ["tabview-end", 100]
      }
    },

    "tabview-page-button-top-active" :
    {
      style : {
        radius : [3, 3, 0, 0],
        width: [1, 1, 0, 1],
        color: "tabview-background",
        backgroundColor : "tabview-start",
        shadowLength: 1,
        shadowColor: "shadow",
        shadowBlurRadius: 2
      }
    },

    "tabview-page-button-top-inactive" :
    {
      style : {
        radius : [3, 3, 0, 0],
        color: "tabview-inactive",
        colorBottom : "tabview-background",
        width: 1,
        gradientStart : ["tabview-inactive-start", 0],
        gradientEnd : ["tabview-inactive-end", 100]
      }
    },

    "tabview-page-button-bottom-active" :
    {
      include : "tabview-page-button-top-active",

      style : {
        radius : [0, 0, 3, 3],
        width: [0, 1, 1, 1],
        backgroundColor : "tabview-inactive-start",
        shadowLength: 0,
        shadowBlurRadius: 0
      }
    },

    "tabview-page-button-bottom-inactive" :
    {
      include : "tabview-page-button-top-inactive",

      style : {
        radius : [0, 0, 3, 3],
        width: [0, 1, 1, 1],
        colorBottom : "tabview-inactive",
        colorTop : "tabview-background"
      }
    },

    "tabview-page-button-left-active" :
    {
      include : "tabview-page-button-top-active",

      style : {
        radius : [3, 0, 0, 3],
        width: [1, 0, 1, 1],
        shadowLength: 0,
        shadowBlurRadius: 0
      }
    },

    "tabview-page-button-left-inactive" :
    {
      include : "tabview-page-button-top-inactive",

      style : {
        radius : [3, 0, 0, 3],
        width: [1, 0, 1, 1],
        colorBottom : "tabview-inactive",
        colorRight : "tabview-background"
      }
    },

    "tabview-page-button-right-active" :
    {
      include : "tabview-page-button-top-active",

      style : {
        radius : [0, 3, 3, 0],
        width: [1, 1, 1, 0],
        shadowLength: 0,
        shadowBlurRadius: 0
      }
    },

    "tabview-page-button-right-inactive" :
    {
      include : "tabview-page-button-top-inactive",

      style : {
        radius : [0, 3, 3, 0],
        width: [1, 1, 1, 0],
        colorBottom : "tabview-inactive",
        colorLeft : "tabview-background"
      }
    },





    /*
    ---------------------------------------------------------------------------
      SPLITPANE
    ---------------------------------------------------------------------------
    */

    "splitpane" :
    {
      style :
      {
        backgroundColor : "background-pane",

        width : 3,
        color : "background-splitpane",
        style : "solid"
      }
    },





    /*
    ---------------------------------------------------------------------------
      WINDOW
    ---------------------------------------------------------------------------
    */
    "window" :
    {
      style : {
        radius : [5, 5, 0, 0],
        shadowBlurRadius : 4,
        shadowLength : 2,
        shadowColor : "shadow"
      }
    },

    "window-incl-statusbar" : {
       include : "window",
       style : {
         radius : [5, 5, 5, 5]
       }
    },

    "window-resize-frame" :
    {
      style : {
        radius : [5, 5, 0, 0],
        width : 1,
        color : "border-main"
      }
    },

    "window-resize-frame-incl-statusbar" :
    {
       include : "window-resize-frame",
       style : {
         radius : [5, 5, 5, 5]
       }
    },

    "window-captionbar-active" :
    {
      style : {
        width : 1,
        color : "window-border",
        colorBottom : "window-border-caption",
        radius : [5, 5, 0, 0],
        gradientStart : ["window-caption-active-start", 30],
        gradientEnd : ["window-caption-active-end", 70]
      }
    },

    "window-captionbar-inactive" :
    {
      include : "window-captionbar-active",
      style : {
        gradientStart : ["window-caption-inactive-start", 30],
        gradientEnd : ["window-caption-inactive-end", 70]
      }
    },

    "window-statusbar" :
    {
      style : {
        backgroundColor : "window-statusbar-background",
        width: [0, 1, 1, 1],
        color: "window-border",
        radius : [0, 0, 5, 5]
      }
    },

    "window-pane" :
    {
      style :
      {
        backgroundColor : "background-pane",
        width : 1,
        color : "window-border",
        widthTop : 0
      }
    },



    /*
    ---------------------------------------------------------------------------
      TABLE
    ---------------------------------------------------------------------------
    */

    "table" :
    {
      style :
      {
        width : 1,
        color : "border-main",
        style : "solid"
      }
    },

    "table-statusbar" :
    {
      style :
      {
        widthTop : 1,
        colorTop : "border-main",
        style    : "solid"
      }
    },

    "table-scroller-header" :
    {
      style :
      {
        gradientStart : ["table-header-start", 10],
        gradientEnd : ["table-header-end", 90],

        widthBottom : 1,
        colorBottom : "border-main"
      }
    },

    "table-header-cell" :
    {
      style :
      {
        widthRight : 1,
        colorRight : "border-separator",
        styleRight : "solid"
      }
    },


    "table-header-cell-hovered" :
    {
      style :
      {
        widthRight : 1,
        colorRight : "border-separator",
        styleRight : "solid",

        widthBottom : 1,
        colorBottom : "table-header-hovered",
        styleBottom : "solid"
      }
    },

    "table-scroller-focus-indicator" :
    {
      style :
      {
        width : 2,
        color : "table-focus-indicator",
        style : "solid"
      }
    },





    /*
    ---------------------------------------------------------------------------
      PROGRESSIVE
    ---------------------------------------------------------------------------
    */

    "progressive-table-header" :
    {
       style :
       {
         width       : 1,
         color       : "border-main",
         style       : "solid"
       }
    },

    "progressive-table-header-cell" :
    {
      style :
      {
        gradientStart : ["table-header-start", 10],
        gradientEnd : ["table-header-end", 90],

        widthRight : 1,
        colorRight : "progressive-table-header-border-right"
      }
    },


    /*
    ---------------------------------------------------------------------------
      MENU
    ---------------------------------------------------------------------------
    */

    "menu" :
    {
      style : {
        gradientStart : ["menu-start", 0],
        gradientEnd : ["menu-end", 100],
        shadowColor : "shadow",
        shadowBlurRadius : 2,
        shadowLength : 1,
        width : 1,
        color : "border-main"
      }
    },

    "menu-separator" :
    {
      style :
      {
        widthTop    : 1,
        colorTop    : "menu-separator-top",

        widthBottom : 1,
        colorBottom : "menu-separator-bottom"
      }
    },


    /*
    ---------------------------------------------------------------------------
      MENU BAR
    ---------------------------------------------------------------------------
    */

    "menubar" :
    {
      style :
      {
        gradientStart : ["menubar-start", 0],
        gradientEnd : ["menu-end", 100],

        width : 1,
        color : "border-separator"
      }
    },

    /*
    ---------------------------------------------------------------------------
      APPLICATION
    ---------------------------------------------------------------------------
    */

    "app-header":
    {
      style :
      {
        gradientStart : ["#243B58", 0],
        gradientEnd : ["#1D2D45", 100]
      }

    },

    /*
    ---------------------------------------------------------------------------
      PROGRESSBAR
    ---------------------------------------------------------------------------
    */

    "progressbar" :
    {

      style:
      {
        width: 1,
        color: "border-input"
      }
    },

    /*
    ---------------------------------------------------------------------------
      VIRTUAL WIDGETS
    ---------------------------------------------------------------------------
    */

    "group-item" :
    {
      style :
      {
        startColorPosition : 0,
        endColorPosition : 100,
        startColor : "groupitem-start",
        endColor : "groupitem-end"
      }
    }
  }
});
