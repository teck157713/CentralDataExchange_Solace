
    function init() {
      var $ = go.GraphObject.make;  // for conciseness in defining templates

      myDiagram =
        $(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
          {
            initialAutoScale: go.Diagram.Uniform,  // an initial automatic zoom-to-fit
            contentAlignment: go.Spot.Center,  // align document to the center of the viewport
            layout:
              $(go.ForceDirectedLayout,  // automatically spread nodes apart
                { defaultSpringLength: 20, defaultElectricalCharge: 10 }),
            "undoManager.isEnabled": true
          });

      // define each Node's appearance
      myDiagram.nodeTemplate =
        $(go.Node, "Auto",  // the whole node panel
          { locationSpot: go.Spot.Center },
          // define the node's outer shape, which will surround the TextBlock
          $(go.Shape, "Rectangle",
            { fill: $(go.Brush, "Linear", { 0: "rgb(254, 201, 0)", 1: "rgb(254, 162, 0)" }), stroke: "black" }),
          $(go.TextBlock,
            { font: "bold 10pt helvetica, bold arial, sans-serif", margin: new go.Margin(4, 4, 3, 20) },
            new go.Binding("text", "text"))
        );

      // replace the default Link template in the linkTemplateMap
      myDiagram.linkTemplate =
        $(go.Link,  // the whole link panel
          // path animation works with these kinds of links too:
          //{ routing: go.Link.AvoidsNodes },
          //{ curve: go.Link.Bezier },
          $(go.Shape,  // the link shape
            { stroke: "black" }),
          $(go.Shape,  // the arrowhead
            { toArrow: "standard", stroke: null }),
          $(go.Panel, "Auto",
            $(go.Shape,  // the label background, which becomes transparent around the edges
              {
                fill: $(go.Brush, "Radial", { 0: "rgb(240, 240, 240)", 0.3: "rgb(240, 240, 240)", 1: "rgba(240, 240, 240, 0)" }),
                stroke: null
              }),
            $(go.TextBlock,  // the label text
              {
                textAlign: "center",
                font: "10pt helvetica, arial, sans-serif",
                stroke: "#555555",
                margin: 4
              },
              new go.Binding("text", "text"))
          )
        );

      myDiagram.nodeTemplateMap.add("token",
        $(go.Part,
          { locationSpot: go.Spot.Center, layerName: "Foreground" },
          $(go.Shape, "Circle",
            { width: 12, height: 12, fill: "green", strokeWidth: 0 },
            new go.Binding("fill", "color"))
        ));

      // create the model for the concept map
      var nodeDataArray = [
        { key: 1, text: "LTA" },
        { key: 2, text: "Queue" },
        { key: 4, text: "Queue" },
        { key: 3, text: "Hospital 2" },
        { key: 5, text: "Hospital 1" }
      ];
      var linkDataArray = [
        { from: 1, to: 2, text: "publishing\nsensors to" },
        { from: 2, to: 3, text: "pushing\nto" },
        { from: 1, to: 4, text: "publishing\nsensors to" },
        { from: 4, to: 5, text: "pushing\nto" }
      ];
      myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);

      initTokens();
    }

    function initTokens() {
      var oldskips = myDiagram.skipsUndoManager;
      myDiagram.skipsUndoManager = true;
      myDiagram.model.addNodeDataCollection([
        { category: "token", at: 1, color: "green" }
      ]);
      myDiagram.skipsUndoManager = oldskips;
      window.requestAnimationFrame(updateTokens);
    }

    function updateTokens() {
      var oldskips = myDiagram.skipsUndoManager;
      myDiagram.skipsUndoManager = true;  // don't record these changes in the UndoManager!
      var temp = new go.Point();
      myDiagram.parts.each(function(token) {
        var data = token.data;
        if (!data) return;
        var at = data.at;
        if (at === undefined) return;
        var from = myDiagram.findNodeForKey(at);
        if (from === null) return;
        var frac = data.frac;
        if (frac === undefined) frac = 0.0;
        var next = data.next;
        var to = myDiagram.findNodeForKey(next);
        if (to === null) {  // nowhere to go?
          positionTokenAtNode(token, from);  // temporarily stay at the current node
          data.next = chooseDestination(token, from);  // and decide where to go next
        } else {  // proceed toward the "to" port
          var link = from.findLinksTo(to).first();
          if (link !== null) {
            token.location = link.path.getDocumentPoint(link.path.geometry.getPointAlongPath(frac, temp));
          } else {  // stay at the current node
            positionTokenAtNode(token, from);
          }
          if (frac >= 1.0) {  // if beyond the end, it's "AT" the NEXT node
            data.frac = 0.0;
            data.at = next;
            data.next = undefined;  // don't know where to go next
          } else {  // otherwise, move fractionally closer to the NEXT node
            data.frac = frac + 0.01;
          }
        }
      });
      myDiagram.skipsUndoManager = oldskips;
      window.requestAnimationFrame(updateTokens);
    }

    // determine where to position a token when it is resting at a node
    function positionTokenAtNode(token, node) {
      // these details depend on the node template
      token.location = node.position.copy().offset(4 + 6, 5 + 6);
    }

    function chooseDestination(token, node) {
      var dests = new go.List().addAll(node.findNodesOutOf());
      if (dests.count > 0) {
        var dest = dests.elt(Math.floor(Math.random() * dests.count));
        return dest.data.key;
      }
      var arr = myDiagram.model.nodeDataArray;
      // choose a random next data object that is not a token and is not the current Node
      var data = null;
      while (data = arr[Math.floor(Math.random() * arr.length)],
        data.category === "token" || data === node.data) { }
      return data.key;
    }