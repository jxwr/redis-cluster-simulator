$(function(){

  var pingColor = '#8B008B';

  var cy = cytoscape({
    container: document.getElementById('cy'),
    
    style: cytoscape.stylesheet()
      .selector('node')
      .css({
        'content': 'data(id)',
        'background-color': '#6272A3',
      })
      .selector('.node-ping')
      .css({
        'content': 'data(id)',
        'background-color': pingColor
      })
      .selector('edge')
      .css({
        'source-arrow-shape': 'circle',
        'target-arrow-shape': 'triangle',
        'width': 2,
        'line-color': '#ddd',
      })
      .selector('.edge-send-ping')
      .css({
        'source-arrow-color': pingColor
      })
      .selector('.edge-recv-ping')
      .css({
        'target-arrow-color': pingColor,
        'line-color': pingColor
      }),

    layout: {
      name: 'circle',
      padding: 20
    }
  });

  function addNode(id) {
    var e = cy.getElementById(id);
    if (e.length > 0) return;
    
    cy.add({
      group: "nodes",
      data: {id: id}
    });
    cy.layout({name: 'circle'});
  }

  function addEdge(fid, tid) {
    var id = fid + '_to_' + tid;
    var e = cy.getElementById(id);
    if (e.length > 0) return;

    addNode(fid);
    addNode(tid);
    cy.add({
      group: "edges",
      data: {id: id, source: fid, target: tid}
    });
    cy.layout({name: 'circle'});
  }

  function N(t) { return cy.$('#' + t); }
  function E(f, t) { return cy.$('#' + f + '_to_' + t); }

  function simPingSend(from, to) {
    N(from).addClass('node-ping');
    E(from, to).addClass('edge-send-ping');
  }

  function simPingRecv(from, to) {
    N(from).removeClass('node-ping');
    E(from, to).removeClass('edge-send-ping');
    N(to).flashClass('node-ping', 100);
    E(from, to).flashClass('edge-recv-ping', 200);
  }

  function simSendFail(from, to) {
  }

  function handleEvent(event) {
    addEdge(event.id, event.tid);

    if (event.type == 'PING' && event.dir == 'S') {
      simPingSend(event.id, event.tid);
    }
    if (event.type == 'PING' && event.dir == 'R') {
      simPingRecv(event.tid, event.id);
    }
    if (event.type == 'PONG' && event.dir == 'S') {
      simPingSend(event.id, event.tid);
    }
    if (event.type == 'PONG' && event.dir == 'R') {
      simPingRecv(event.tid, event.id);
    }
  }

  var timeScalar = 1;
  function handleEvents(events) {
    var e = events.shift();
    if (!e) return;

    var ne = events[0];
    if (!ne) return;

    var t = parseInt(e.time);
    $('#time').text(t/1000);

    handleEvent(e);
    if (ne.time-e.time == 0) {
      handleEvents(events);
    } else {
      setTimeout(handleEvents, (ne.time - e.time) * timeScalar, events);
    }
  }

  $.getJSON("http://127.0.0.1:8080/events.json", function(events){
    handleEvents(events);
  });
});
