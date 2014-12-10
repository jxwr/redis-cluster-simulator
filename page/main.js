$(function(){

  var pingColor = '#8B008B';
  var failColor = 'red';
  var pfailColor = 'yellow';

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
      })
      .selector('.edge-mark-fail')
      .css({
        'target-arrow-color': failColor,
        'line-color': failColor
      })
      .selector('.edge-mark-pfail')
      .css({
        'target-arrow-color': pfailColor,
        'line-color': pfailColor
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

  function simSendPing(from, to) {
    N(from).addClass('node-ping');
    E(from, to).addClass('edge-send-ping');
  }

  function simRecvPing(from, to) {
    N(from).removeClass('node-ping');
    E(from, to).removeClass('edge-send-ping');
    N(to).flashClass('node-ping', 100);
    E(from, to).flashClass('edge-recv-ping', 200);
  }

  function simSendFail(from, to) {
  }

  function simRecvFail(from, to) {
  }

  function simMarkFail(from, to) {
    E(from, to).removeClass('edge-mark-pfail');
    E(from, to).addClass('edge-mark-fail');
  }

  function simMarkPFail(from, to) {
    E(from, to).removeClass('edge-mark-pfail');
    E(from, to).addClass('edge-mark-pfail');
  }

  function handleEvent(e) {
    addEdge(e.id, e.tid);

    switch (e.type) {
    case 'PING':
    case 'PONG':
      if (e.dir == 'S') simSendPing(e.id, e.tid);
      if (e.dir == 'R') simRecvPing(e.tid, e.id);
      break;
    case 'PFAIL':
      simMarkPFail(e.id, e.tid);
      break;
    case 'FAIL':
      console.log(e);
      if (e.dir == 'U') simMarkFail(e.id, e.tid);
      if (e.dir == 'R') simRecvFail(e.id, e.extra);
      break;
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

  $.getJSON("events.json", function(events){
    handleEvents(events);
  });
});
