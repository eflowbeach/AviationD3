/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A vertical box layout.
 *
 * The vertical box layout lays out widgets in a vertical column, from top
 * to bottom.
 *
 * *Features*
 *
 * * Minimum and maximum dimensions
 * * Prioritized growing/shrinking (flex)
 * * Margins (with vertical collapsing)
 * * Auto sizing (ignoring percent values)
 * * Percent heights (not relevant for size hint)
 * * Alignment (child property {@link qx.ui.core.LayoutItem#alignY} is ignored)
 * * Vertical spacing (collapsed with margins)
 * * Reversed children layout (from last to first)
 * * Horizontal children stretching (respecting size hints)
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>flex</strong> <em>(Integer)</em>: The flexibility of a layout item determines how the container
 *   distributes remaining empty space among its children. If items are made
 *   flexible, they can grow or shrink accordingly. Their relative flex values
 *   determine how the items are being resized, i.e. the larger the flex ratio
 *   of two items, the larger the resizing of the first item compared to the
 *   second.
 *
 *   If there is only one flex item in a layout container, its actual flex
 *   value is not relevant. To disallow items to become flexible, set the
 *   flex value to zero.
 * </li>
 * <li><strong>height</strong> <em>(String)</em>: Allows to define a percent
 *   height for the item. The height in percent, if specified, is used instead
 *   of the height defined by the size hint. The minimum and maximum height still
 *   takes care of the element's limits. It has no influence on the layout's
 *   size hint. Percent values are mostly useful for widgets which are sized by
 *   the outer hierarchy.
 * </li>
 * </ul>
 *
 * *Example*
 *
 * Here is a little example of how to use the vertical box layout.
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.VBox();
 * layout.setSpacing(4); // apply spacing
 *
 * var container = new qx.ui.container.Composite(layout);
 *
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * </pre>
 *
 * *External Documentation*
 *
 * See <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/box.html'>extended documentation</a>
 * and links to demos for this layout.
 *
 */
qx.Class.define("qx.ui.layout.VBox",
{
  extend : qx.ui.layout.Abstract,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param spacing {Integer?0} The spacing between child widgets {@link #spacing}.
   * @param alignY {String?"top"} Vertical alignment of the whole children
   *     block {@link #alignY}.
   * @param separator {String|qx.ui.decoration.IDecorator} A separator to render between the items
   */
  construct : function(spacing, alignY, separator)
  {
    this.base(arguments);

    if (spacing) {
      this.setSpacing(spacing);
    }

    if (alignY) {
      this.setAlignY(alignY);
    }

    if (separator) {
      this.setSeparator(separator);
    }
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Vertical alignment of the whole children block. The vertical
     * alignment of the child is completely ignored in VBoxes (
     * {@link qx.ui.core.LayoutItem#alignY}).
     */
    alignY :
    {
      check : [ "top", "middle", "bottom" ],
      init : "top",
      apply : "_applyLayoutChange"
    },


    /**
     * Horizontal alignment of each child. Can be overridden through
     * {@link qx.ui.core.LayoutItem#alignX}.
     */
    alignX :
    {
      check : [ "left", "center", "right" ],
      init : "left",
      apply : "_applyLayoutChange"
    },


    /** Vertical spacing between two children */
    spacing :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    },


    /** Separator lines to use between the objects */
    separator :
    {
      check : "Decorator",
      nullable : true,
      apply : "_applyLayoutChange"
    },


    /** Whether the actual children list should be laid out in reversed order. */
    reversed :
    {
      check : "Boolean",
      init : false,
      apply : "_applyReversed"
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __heights : null,
    __flexs : null,
    __enableFlex : null,
    __children : null,


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyReversed : function()
    {
      // easiest way is to invalidate the cache
      this._invalidChildrenCache = true;

      // call normal layout change
      this._applyLayoutChange();
    },


    /**
     * Rebuilds caches for flex and percent layout properties
     */
    __rebuildCache : function()
    {
      var children = this._getLayoutChildren();
      var length = children.length;
      var enableFlex = false;
      var reuse = this.__heights && this.__heights.length != length && this.__flexs && this.__heights;
      var props;

      // Sparse array (keep old one if lengths has not been modified)
      var heights = reuse ? this.__heights : new Array(length);
      var flexs = reuse ? this.__flexs : new Array(length);

      // Reverse support
      if (this.getReversed()) {
        children = children.concat().reverse();
      }

      // Loop through children to preparse values
      for (var i=0; i<length; i++)
      {
        props = children[i].getLayoutProperties();

        if (props.height != null) {
          heights[i] = parseFloat(props.height) / 100;
        }

        if (props.flex != null)
        {
          flexs[i] = props.flex;
          enableFlex = true;
        } else {
          // reset (in case the index of the children changed: BUG #3131)
          flexs[i] = 0;
        }
      }

      // Store data
      if (!reuse)
      {
        this.__heights = heights;
        this.__flexs = flexs;
      }

      this.__enableFlex = enableFlex
      this.__children = children;

      // Clear invalidation marker
      delete this._invalidChildrenCache;
    },





    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        this.assert(name === "flex" || name === "height", "The property '"+name+"' is not supported by the VBox layout!");

        if (name =="height")
        {
          this.assertMatch(value, qx.ui.layout.Util.PERCENT_VALUE);
        }
        else
        {
          // flex
          this.assertNumber(value);
          this.assert(value >= 0);
        }
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      // Rebuild flex/height caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      // Cache children
      var children = this.__children;
      var length = children.length;
      var util = qx.ui.layout.Util;


      // Compute gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeVerticalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeVerticalGaps(children, spacing, true);
      }


      // First run to cache children data and compute allocated height
      var i, child, height, percent;
      var heights = [];
      var allocatedHeight = gaps;

      for (i=0; i<length; i+=1)
      {
        percent = this.__heights[i];

        height = percent != null ?
          Math.floor((availHeight - gaps) * percent) :
          children[i].getSizeHint().height;

        heights.push(height);
        allocatedHeight += height;
      }


      // Flex support (growing/shrinking)
      if (this.__enableFlex && allocatedHeight != availHeight)
      {
        var flexibles = {};
        var flex, offset;

        for (i=0; i<length; i+=1)
        {
          flex = this.__flexs[i];

          if (flex > 0)
          {
            hint = children[i].getSizeHint();

            flexibles[i]=
            {
              min : hint.minHeight,
              value : heights[i],
              max : hint.maxHeight,
              flex : flex
            };
          }
        }

        var result = util.computeFlexOffsets(flexibles, availHeight, allocatedHeight);

        for (i in result)
        {
          offset = result[i].offset;

          heights[i] += offset;
          allocatedHeight += offset;
        }
      }


      // Start with top coordinate
      var top = children[0].getMarginTop();

      // Alignment support
      if (allocatedHeight < availHeight && this.getAlignY() != "top")
      {
        top = availHeight - allocatedHeight;

        if (this.getAlignY() === "middle") {
          top = Math.round(top / 2);
        }
      }


      // Layouting children
      var hint, left, width, height, marginBottom, marginLeft, marginRight;

      // Pre configure separators
      this._clearSeparators();

      // Compute separator height
      if (separator)
      {
        var separatorInsets = qx.theme.manager.Decoration.getInstance().resolve(separator).getInsets();
        var separatorHeight = separatorInsets.top + separatorInsets.bottom;
      }

      // Render children and separators
      for (i=0; i<length; i+=1)
      {
        child = children[i];
        height = heights[i];
        hint = child.getSizeHint();

        marginLeft = child.getMarginLeft();
        marginRight = child.getMarginRight();

        // Find usable width
        width = Math.max(hint.minWidth, Math.min(availWidth-marginLeft-marginRight, hint.maxWidth));

        // Respect horizontal alignment
        left = util.computeHorizontalAlignOffset(child.getAlignX()||this.getAlignX(), width, availWidth, marginLeft, marginRight);

        // Add collapsed margin
        if (i > 0)
        {
          // Whether a separator has been configured
          if (separator)
          {
            // add margin of last child and spacing
            top += marginBottom + spacing;

            // then render the separator at this position
            this._renderSeparator(separator, {
              top : top + padding.top,
              left : padding.left,
              height : separatorHeight,
              width : availWidth
            });

            // and finally add the size of the separator, the spacing (again) and the top margin
            top += separatorHeight + spacing + child.getMarginTop();
          }
          else
          {
            // Support margin collapsing when no separator is defined
            top += util.collapseMargins(spacing, marginBottom, child.getMarginTop());
          }
        }

        // Layout child
        child.renderLayout(left + padding.left, top + padding.top, width, height);

        // Add height
        top += height;

        // Remember bottom margin (for collapsing)
        marginBottom = child.getMarginBottom();
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      // Rebuild flex/height caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      var util = qx.ui.layout.Util;
      var children = this.__children;

      // Initialize
      var minHeight=0, height=0, percentMinHeight=0;
      var minWidth=0, width=0;
      var child, hint, margin;

      // Iterate over children
      for (var i=0, l=children.length; i<l; i+=1)
      {
        child = children[i];
        hint = child.getSizeHint();

        // Sum up heights
        height += hint.height;

        // Detect if child is shrinkable or has percent height and update minHeight
        var flex = this.__flexs[i];
        var percent = this.__heights[i];
        if (flex) {
          minHeight += hint.minHeight;
        } else if (percent) {
          percentMinHeight = Math.max(percentMinHeight, Math.round(hint.minHeight/percent));
        } else {
          minHeight += hint.height;
        }

        // Build horizontal margin sum
        margin = child.getMarginLeft() + child.getMarginRight();

        // Find biggest width
        if ((hint.width+margin) > width) {
          width = hint.width + margin;
        }

        // Find biggest minWidth
        if ((hint.minWidth+margin) > minWidth) {
          minWidth = hint.minWidth + margin;
        }
      }

      minHeight += percentMinHeight;

      // Respect gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeVerticalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeVerticalGaps(children, spacing, true);
      }

      // Return hint
      return {
        minHeight : minHeight + gaps,
        height : height + gaps,
        minWidth : minWidth,
        width : width
      };
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__heights = this.__flexs = this.__children = null;
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
 * The grow layout stretches all children to the full available size
 * but still respects limits configured by min/max values.
 *
 * It will place all children over each other with the top and left coordinates
 * set to <code>0</code>. The {@link qx.ui.container.Stack} and the
 * {@link qx.ui.core.scroll.ScrollPane} are using this layout.
 *
 * *Features*
 *
 * * Auto-sizing
 * * Respects minimum and maximum child dimensions
 *
 * *Item Properties*
 *
 * None
 *
 * *Example*
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.Grow();
 *
 * var w1 = new qx.ui.core.Widget();
 * var w2 = new qx.ui.core.Widget();
 * var w3 = new qx.ui.core.Widget();
 *
 * var container = new qx.ui.container.Composite(layout);
 * container.add(w1);
 * container.add(w2);
 * container.add(w3);
 * </pre>
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/grow.html'>
 * Extended documentation</a> and links to demos of this layout in the qooxdoo manual.
 */
qx.Class.define("qx.ui.layout.Grow",
{
  extend : qx.ui.layout.Abstract,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value) {
        this.assert(false, "The property '"+name+"' is not supported by the Grow layout!");
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      var children = this._getLayoutChildren();
      var child, size, width, height;

      // Render children
      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        size = child.getSizeHint();

        width = availWidth;
        if (width < size.minWidth) {
          width = size.minWidth;
        } else if (width > size.maxWidth) {
          width = size.maxWidth;
        }

        height = availHeight;
        if (height < size.minHeight) {
          height = size.minHeight;
        } else if (height > size.maxHeight) {
          height = size.maxHeight;
        }

        child.renderLayout(padding.left, padding.top, width, height);
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      var children = this._getLayoutChildren();
      var child, size;
      var neededWidth=0, neededHeight=0;
      var minWidth=0, minHeight=0;
      var maxWidth=Infinity, maxHeight=Infinity;

      // Iterate over children
      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        size = child.getSizeHint();

        neededWidth = Math.max(neededWidth, size.width);
        neededHeight = Math.max(neededHeight, size.height);

        minWidth = Math.max(minWidth, size.minWidth);
        minHeight = Math.max(minHeight, size.minHeight);

        maxWidth = Math.min(maxWidth, size.maxWidth);
        maxHeight = Math.min(maxHeight, size.maxHeight);
      }


      // Return hint
      return {
        width : neededWidth,
        height : neededHeight,

        minWidth : minWidth,
        minHeight : minHeight,

        maxWidth : maxWidth,
        maxHeight : maxHeight
      };
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
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This mixin is included by all widgets which supports native overflowing.
 */
qx.Mixin.define("qx.ui.core.MNativeOverflow",
{
  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Whether the widget should have horizontal scrollbars.
     */
    overflowX :
    {
      check : ["hidden", "visible", "scroll", "auto"],
      nullable : true,
      apply : "_applyOverflowX"
    },

    /**
     * Whether the widget should have vertical scrollbars.
     */
    overflowY :
    {
      check : ["hidden", "visible", "scroll", "auto"],
      nullable : true,
      apply : "_applyOverflowY"
    },

    /**
     * Overflow group property
     */
    overflow : {
      group : [ "overflowX", "overflowY" ]
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // property apply
    _applyOverflowX : function(value) {
      this.getContentElement().setStyle("overflowX", value);
    },


    // property apply
    _applyOverflowY : function(value) {
      this.getContentElement().setStyle("overflowY", value);
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
     * Andreas Ecker (ecker)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The Html widget embeds plain HTML code into the application
 *
 * *Example*
 *
 * Here is a little example of how to use the canvas widget.
 *
 * <pre class='javascript'>
 * var html = new qx.ui.embed.Html();
 * html.setHtml("<h1>Hello World</h1>");
 * </pre>
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/html.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.embed.Html",
{
  extend : qx.ui.core.Widget,
  include : [qx.ui.core.MNativeOverflow],



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param html {String} Initial HTML content
   */
  construct : function(html)
  {
    this.base(arguments);

    if (html != null) {
      this.setHtml(html);
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Any text string which can contain HTML, too */
    html :
    {
      check : "String",
      apply : "_applyHtml",
      event : "changeHtml",
      nullable : true
    },


    /**
     * The css classname for the html embed.
     * <b>IMPORTANT</b> Paddings and borders does not work
     * in the css class. These styles cause conflicts with
     * the layout engine.
     */
    cssClass :
    {
      check : "String",
      init : "",
      apply : "_applyCssClass"
    },


    // overridden
    selectable :
    {
      refine : true,
      init : true
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
    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    getFocusElement : function() {
      return this.getContentElement();
    },




    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyHtml : function(value, old)
    {
      var elem = this.getContentElement();
      // Workaround for http://bugzilla.qooxdoo.org/show_bug.cgi?id=7679
      if (qx.core.Environment.get("engine.name") == "mshtml" &&
        qx.core.Environment.get("browser.documentmode") == 9)
      {
        elem.setStyle("position", "relative");
      }

      // Insert HTML content
      elem.setAttribute("html", value||"");
    },


    // property apply
    _applyCssClass : function (value, old) {
      this.getContentElement().removeClass(old);
      this.getContentElement().addClass(value);
    },


    // overridden
    _applySelectable : function(value)
    {
      this.base(arguments, value);

      /*
       * We have to set the value to "text" in Webkit for the content element
       */
      if ((qx.core.Environment.get("engine.name") == "webkit"))
      {
        this.getContentElement().setStyle("userSelect", value ? "text" : "none");
      }
    },


    /*
    ---------------------------------------------------------------------------
      FONT SUPPORT
    ---------------------------------------------------------------------------
    */

    // overridden
    _applyFont : function(value, old)
    {
      var styles = value ? qx.theme.manager.Font.getInstance().resolve(value).getStyles() : qx.bom.Font.getDefaultStyles();

      // check if text color already set - if so this local value has higher priority
      if (this.getTextColor() != null) {
        delete styles["color"];
      }

      this.getContentElement().setStyles(styles);
    },




    /*
    ---------------------------------------------------------------------------
      TEXT COLOR SUPPORT
    ---------------------------------------------------------------------------
    */

    // overridden
    _applyTextColor : function(value, old)
    {
      if (value) {
        this.getContentElement().setStyle("color", qx.theme.manager.Color.getInstance().resolve(value));
      } else {
        this.getContentElement().removeStyle("color");
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
