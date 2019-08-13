// create new diagram to show data flow of the data exchange platform
var graph = new joint.dia.Graph();
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 300,
    height: 550,
    gridSize: 10,
    defaultAnchor: { name: 'perpendicular' },
    defaultConnectionPoint: { name: 'boundary' },
    model: graph
});

var pn = joint.shapes.pn;

// create a node as LTA
var pLta = new pn.Place({
    position: { x: 100, y: 100 },
    attrs: {
        '.label': {
            'text': 'LTA',
            'fill': '#F37021' },
        '.root': {
            'stroke': '#F37021',
            'stroke-width': 3
        },
        '.tokens > circle': {
            'fill': '#F37021'
        }
    },
    tokens: 20
});

// duplicate LTA node to other node and set position
var pNea = pLta.clone()
    .attr('.label/text', 'NEA')
    .position(180, 100)
    .set('tokens', 0);

var pMHA = pLta.clone()
    .attr('.label/text', 'MHA')
    .position(100, 400)
    .set('tokens', 0);

var pMOH = pLta.clone()
    .attr('.label/text', 'MOH')
    .position(180, 400)
    .set('tokens', 0);

var pCentral = pLta.clone()
    .attr('.label/text', 'Central Broker')
    .position(100, 250)
    .set('tokens', 0);

var pAnalytics = new pn.Transition({
    position: { x: 230, y: 250 },
    attrs: {
        '.label': {
            'text': 'Analytics',
            'fill': '#F37021'
        },
        '.root': {
            'fill': '#F37021',
            'stroke': '#F37021'
        }
    },
    tokens: 0
});

var pPublish = new pn.Transition({
    position: { x: 50, y: 50 },
    attrs: {
        '.label': {
            'text': 'Publish',
            'fill': '#009193'
        },
        '.root': {
            'fill': '#009193',
            'stroke': '#009193'
        }
    }
});

var pSubscribe = pPublish.clone()
    .attr('.label/text', 'Subscribe')
    .position(50, 150);

var pPublish2 = pPublish.clone()
    .attr('.label/text', 'Publish')
    .position(260, 50);

var pSubscribe2 = pPublish.clone()
    .attr('.label/text', 'Subscribe')
    .position(260, 150);

var pPublish3 = pPublish.clone()
    .attr('.label/text', 'Publish')
    .position(50, 350);

var pSubscribe3 = pPublish.clone()
    .attr('.label/text', 'Subscribe')
    .position(50, 450);

var pPublish4 = pPublish.clone()
    .attr('.label/text', 'Publish')
    .position(260, 350);

var pSubscribe4 = pPublish.clone()
    .attr('.label/text', 'Subscribe')
    .position(260, 450);

var pSubscribe5 = pPublish.clone()
    .attr('.label/text', 'Publish')
    .position(30, 250);

function link(a, b) {

    return new pn.Link({
        source: { id: a.id, selector: '.root' },
        target: { id: b.id, selector: '.root' },
        attrs: {
            '.connection': {
                'fill': 'none',
                'stroke-linejoin': 'round',
                'stroke-width': '2',
                'stroke': '#474747'
            }
        }
    });
}

graph.addCell([pPublish, pSubscribe, pPublish2, pSubscribe2, pPublish3, pSubscribe3, pPublish4, pSubscribe4, pLta, pNea, pMHA, pMOH, pCentral, pSubscribe5, pAnalytics]);
// link all the nodes together in a graph
graph.addCell([
    link(pPublish, pLta),
    link(pPublish2, pNea),
    link(pPublish3, pMHA),
    link(pPublish4, pMOH),
    link(pLta, pCentral),
    link(pNea, pCentral),
    link(pMHA, pCentral),
    link(pMOH, pCentral),
    link(pCentral, pAnalytics),
    link(pCentral, pLta),
    link(pCentral, pMHA),
    link(pCentral, pMOH),
    link(pCentral, pSubscribe5),
    link(pAnalytics, pCentral),
    link(pLta, pSubscribe),
    link(pNea, pSubscribe2),
    link(pMHA, pSubscribe3),
    link(pMOH, pSubscribe4)
]);


function fireTransition(t, sec) {

    var inbound = graph.getConnectedLinks(t, { inbound: true });
    var outbound = graph.getConnectedLinks(t, { outbound: true });

    var placesBefore = inbound.map(function(link) {
        return link.getSourceElement();
    });
    var placesAfter = outbound.map(function(link) {
        return link.getTargetElement();
    });

    var isFirable = true;
    placesBefore.forEach(function(p) {
        if (p.get('tokens') === 0) {
            isFirable = false;
        }
    });

    if (isFirable) {

        placesBefore.forEach(function(p) {
            // Let the execution finish before adjusting the value of tokens. So that we can loop over all transitions
            // and call fireTransition() on the original number of tokens.
            setTimeout(function() {
                p.set('tokens', p.get('tokens') - 1);
            }, 0);

            var links = inbound.filter(function(l) {
                return l.getSourceElement() === p;
            });

            links.forEach(function(l) {
                var token = V('circle', { r: 5, fill: '#009193' });
                l.findView(paper).sendToken(token, sec * 1000);
            });
        });

        placesAfter.forEach(function(p) {

            var links = outbound.filter(function(l) {
                return l.getTargetElement() === p;
            });

            links.forEach(function(l) {
                var token = V('circle', { r: 5, fill: '#F37021' });
                l.findView(paper).sendToken(token, sec * 1000, function() {
                    p.set('tokens', p.get('tokens') + 1);
                });
            });
        });
    }
}

function simulate() {

    var transitions = [pCentral, pLta, pNea, pMHA, pMOH, pAnalytics, pCentral, pSubscribe5];

    setInterval(function() {
        transitions.forEach(function(t) {

            if (Math.random() < 1) {
                if (t == pAnalytics){
                } else {
                    fireTransition(t, 1);
                }
            }
        });
    }, 700);
    setInterval(function() {
        transitions.forEach(function(t) {
            if (Math.random() < 1) {
                if (t == pAnalytics){
                    fireTransition(t, 0.4);
                } else {
                }
            }
        });
    }, 300);
}

var simulationId = simulate();

function stopSimulation(simulationId) {
    clearInterval(simulationId);
}
