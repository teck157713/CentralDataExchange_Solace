var graph = new joint.dia.Graph();
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 350,
    height: 650,
    gridSize: 10,
    defaultAnchor: { name: 'perpendicular' },
    defaultConnectionPoint: { name: 'boundary' },
    model: graph
});

var pn = joint.shapes.pn;

var pPublisher = new pn.Place({
    position: { x: 130, y: 50 },
    attrs: {
        '.label': {
            'text': 'Publisher',
            'fill': '#7c68fc' },
        '.root': {
            'stroke': '#9586fd',
            'stroke-width': 3
        },
        '.tokens > circle': {
            'fill': '#7a7e9b'
        }
    },
    tokens: 20
});

var pQueue1 = pPublisher.clone()
    .attr('.label/text', 'Queue')
    .position(30, 350)
    .set('tokens', 0);

var pConsumer1 = pPublisher.clone()
    .attr('.label/text', 'Consumer')
    .position(30, 550)
    .set('tokens', 0);

var pConsumer2 = pPublisher.clone()
    .attr('.label/text', 'Consumer')
    .position(230, 550)
    .set('tokens', 0);

var pProduce = new pn.Transition({
    position: { x: 150, y: 150 },
    attrs: {
        '.label': {
            'text': 'Produce',
            'fill': '#fe854f'
        },
        '.root': {
            'fill': '#9586fd',
            'stroke': '#9586fd'
        }
    }
});

var pPublish1 = pProduce.clone()
    .attr('.label/text', 'Publish')
    .position(50, 250);

var pPublish2 = pProduce.clone()
    .attr('.label/text', 'Publish')
    .position(250, 250);

var pConsume1 = pProduce.clone()
    .attr('.label/text', 'Consume')
    .position(50, 450);

var pSubscribe = pProduce.clone()
    .attr('.label/text', 'Subscribe')
    .position(250, 450);


function link(a, b) {

    return new pn.Link({
        source: { id: a.id, selector: '.root' },
        target: { id: b.id, selector: '.root' },
        attrs: {
            '.connection': {
                'fill': 'none',
                'stroke-linejoin': 'round',
                'stroke-width': '2',
                'stroke': '#4b4a67'
            }
        }
    });
}

graph.addCell([pPublisher, pQueue1, pConsumer1, pConsumer2, pProduce, pPublish1, pPublish2, pConsume1, pSubscribe]);

graph.addCell([
    link(pPublisher, pProduce),
    link(pProduce, pPublish1),
    link(pPublish1, pQueue1),
    link(pQueue1, pConsume1),
    link(pConsume1, pConsumer1),
    link(pProduce, pPublish2),
    link(pPublish2, pSubscribe),
    link(pSubscribe, pConsumer2)
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
                var token = V('circle', { r: 5, fill: '#feb662' });
                l.findView(paper).sendToken(token, sec * 1000);
            });
        });

        placesAfter.forEach(function(p) {

            var links = outbound.filter(function(l) {
                return l.getTargetElement() === p;
            });

            links.forEach(function(l) {
                var token = V('circle', { r: 5, fill: '#feb662' });
                l.findView(paper).sendToken(token, sec * 1000, function() {
                    p.set('tokens', p.get('tokens') + 1);
                });
            });
        });
    }
}

function simulate() {

    var transitions = [pProduce, pPublish1, pPublish2, pConsume1, pSubscribe];
    transitions.forEach(function(t) {
        if (Math.random() < 1) {
            fireTransition(t, 1);
        }
    });

    return setInterval(function() {
        transitions.forEach(function(t) {
            if (Math.random() < 1) {
                fireTransition(t, 1);
            }
        });
    }, 2000);
}

var simulationId = simulate();

function stopSimulation(simulationId) {
    clearInterval(simulationId);
}
