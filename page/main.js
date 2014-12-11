$(function(){
  var timeScalar = 0.01;

  var pingColor = '#8B008B';
  var pfailColor = 'yellow';
  var failColor = 'red';
  var masterColor = '#CE767E';
  var slaveColor = '#FACDDF';

  var cy = cytoscape({
    container: document.getElementById('cy'),
    
    style: cytoscape.stylesheet()
      .selector('node').css({
        'content': 'data(id)',
        'border-width': 15,
        'background-color': '#eee',
      })
      .selector('.node-ping').css({
        'content': 'data(id)',
        'background-color': pingColor
      })
      .selector('edge').css({
        'source-arrow-shape': 'none',
        'target-arrow-shape': 'triangle',
        'line-color': '#eee',
        'width': 2,
      })
      .selector('.edge-send-ping').css({
        'source-arrow-color': pingColor
      })
      .selector('.edge-recv-ping').css({
        'target-arrow-color': pingColor,
        'line-color': pingColor
      })
      .selector('.edge-mark-fail').css({
        'line-color': failColor,
        'opacity': 0
      })
      .selector('.edge-mark-pfail').css({
        'target-arrow-color': pfailColor,
        'line-color': pfailColor
      })
  });

  function N(t)    { return cy.$('#' + t); }
  function E(f, t) { return cy.$('#' + f + '_to_' + t); }

  function makeNode(id) {
    var e = cy.getElementById(id);
    if (e.length > 0) return;
    
    cy.add({
      group: "nodes",
      data: {id: id}
    });
    cy.layout({name: 'circle'});
  }
  
  function updateNode(id, role) {
    var e = cy.getElementById(id);
    if (e.length == 0) return;

    e.css('border-color', role == 'M' ? masterColor : slaveColor);
  }

  function makeEdge(fid, tid) {
    var id = fid + '_to_' + tid;
    var e = cy.getElementById(id);
    if (e.length > 0) return;

    makeNode(fid);
    makeNode(tid);
    cy.add({
      group: "edges",
      data: {id: id, source: fid, target: tid}
    });
    cy.layout({name: 'circle'});
  }

  /// simulators

  function simSendPing(id, tid) {
//    N(id).addClass('node-ping');
//    E(id, tid).addClass('edge-send-ping');
  }

  function simRecvPing(id, tid) {
    N(id).removeClass('node-ping');
    E(id, tid).removeClass('edge-send-ping');
    N(tid).flashClass('node-ping', 100);
    E(id, tid).flashClass('edge-recv-ping', 80);
  }

  function simSendFail(id, tid) {
  }

  function simRecvFail(id, tid, failId) {
    E(id, failId).removeClass('edge-mark-pfail');
    E(id, failId).addClass('edge-mark-fail');
    E(failId, id).addClass('edge-mark-fail');
    N(tid).css('border-color', '#ccc');
  }

  function simMarkFail(id, tid) {
    E(id, tid).removeClass('edge-mark-pfail');
    E(id, tid).addClass('edge-mark-fail');
    E(tid, id).addClass('edge-mark-fail');
    N(tid).css('border-color', '#ccc');
  }

  function simMarkPFail(id, tid) {
    E(id, tid).removeClass('edge-mark-pfail');
    E(id, tid).addClass('edge-mark-pfail');
  }

  /// dispather

  function handleEvent(e) {
    makeEdge(e.id, e.tid);
    updateNode(e.id, e.role);

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
      if (e.dir == 'R') simRecvFail(e.id, e.tid, e.extra);
      break;
    }
  }

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
