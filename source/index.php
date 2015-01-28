<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
  <title>AviationD3</title>

  <style type="text/css">

    .axis path,
    .axis line {
    fill: none;
    stroke: black;
    shape-rendering: crispEdges;
    }

    .axis text {
    font-family: sans-serif;
    font-size: 11px;
    }

    text.shadow {
    stroke: white;
    stroke-width: 2.5px;
    opacity: 0.9;
    }

    .circle:hover {
    fill: orangered ;
    }

    .d3-tip {
    line-height: 1;
    font-weight: bold;
    padding: 12px;
    background: rgba(33,166,255, 0.8);
    color: #fff;
    border-radius: 6px;
    z-index: 10000;
    }

    /* Creates a small triangle extender for the tooltip */
    .d3-tip:after {
    box-sizing: border-box;
    display: inline;
    font-size: 10px;
    width: 100%;
    line-height: 1;
    color: rgba(0, 0, 0, 0.8);
    content: "\25BC";
    position: absolute;
    text-align: center;
    }

    /* Style northward tooltips differently */
    .d3-tip.n:after {
    margin: -1px 0 0 0;
    top: 100%;
    left: 0;
    }


  </style>
  <script type="text/javascript" src="resource/aviationd3/d3.v3.min.js"></script>
  <script type="text/javascript" src="resource/aviationd3/d3-tip.js"></script>
  <script type="text/javascript" src="script/aviationd3.js"></script>
</head>
<body></body>

<!-- Get Sites -->
<script type="text/javascript">
                        <?php

                          $sites = $_REQUEST['sites'];
                          $radarId = $_REQUEST['radarid'];
                        	echo "var sites = \"$sites\";";
                        	echo "var radarId = \"$radarId\";";
                        	?>
      </script>
</html>
