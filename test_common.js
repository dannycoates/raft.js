if (typeof module === 'undefined') {
    var test_common = {},
        exports = test_common;
}

serverMap = {};

function startServers (spool, serverOpts, klass) {
    for (var sid in serverOpts) {
        var addr = serverOpts[sid].listenAddress;
        serverMap[sid] = addr;
    }
    for (var sid in serverOpts) {
        // force debug so _self is exposed for get* functions
        serverOpts[sid].debug = true;
        serverOpts[sid].serverMap = serverMap;
        spool[sid] = new klass(sid.toString(), serverOpts[sid]);
    }
}

function addServer (spool, sid, opts, klass) {
    if (sid in serverMap) {
        throw new Error("Server " + sid + " already exists");
    }
    var lid = getLeaderId(spool);
    if (!lid) {
        throw new Error("Could not determine current leader");
    }
    var addr = opts.listenAddress;
    serverMap[sid] = addr;
    opts.serverMap = serverMap;
    spool[sid] = new klass(sid.toString(), opts);
    spool[lid].changeMembership(serverMap,
            function(res) {
                console.log("addServer result:", res);
            });
}

function removeServer(spool, sid) {
    if (!sid in serverMap) {
        throw new Error("Server " + sid + " does not exists");
    }
    var lid = getLeaderId(spool);
    if (!lid) {
        throw new Error("Could not determine current leader");
    }
    delete serverMap[sid];
    spool[lid].changeMembership(serverMap,
            function(res) {
                console.log("removeServer result:", res);
            });

}

function getAll(spool, attr) {
    var results = {};
    for (var i in spool) {
        if (!spool.hasOwnProperty(i)) { continue; }
        results[i] = spool[i]._self[attr];
    }
    return results;
}

function getLeaderId(spool) {
    for (var i in spool) {
        if (!spool.hasOwnProperty(i)) { continue; }
        if (spool[i]._self.state === 'leader') {
            return i;
        }
    }
    return null;
}

exports.startServers = startServers;
exports.addServer = addServer;
exports.getAll = getAll;
exports.getLeaderId = getLeaderId;
