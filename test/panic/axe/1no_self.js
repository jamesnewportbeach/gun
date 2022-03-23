/*

*/

var config = {
	IP: require('ip').address(),
	port: 8765,
	servers: 1
}

var panic = require('panic-server');
panic.server().on('request', function(req, res){
	//config.route[req.url] && require('fs').createReadStream(config.route[req.url]).pipe(res);
}).listen(config.port);

var clients = panic.clients;
var manager = require('panic-manager')();

manager.start({
    clients: Array(config.servers).fill().map(function(u, i){
			return {
				type: 'node',
				port: config.port + (i + 1)
			}
    }),
    panic: 'http://' + config.IP + ':' + config.port
});

var servers = clients.filter('Node.js');
var alice = servers.pluck(1);


describe("Do not connect to self", function(){
	//this.timeout(5 * 60 * 1000);
	this.timeout(10 * 60 * 1000);

	it("Servers have joined!", function(){
		return servers.atLeast(config.servers);
	});

	it("GUN started!", function(){
		var tests = [], i = 0;
		servers.each(function(client){
			tests.push(client.run(function(test){
				var env = test.props;
				test.async();
				try{ require('fs').unlinkSync(env.i+'data') }catch(e){}
  				try{ require('gun/lib/fsrm')(env.i+'data') }catch(e){}
				var server = require('http').createServer(function(req, res){
					res.end("I am "+ env.i +"!");
				});
				var port = env.config.port + env.i;
				var Gun = require('gun');

				var peers = [], i = env.config.servers;
				global.self_url = 'http://'+ env.config.IP + ':' + port + '/gun';
				peers.push(self_url);
				console.log(port, " connect to ", peers);
				var gun = Gun({file: env.i+'data', peers: peers, web: server, multicast: false});
				global.gun = gun;
				server.listen(port, function(){
					test.done();
				});
			}, {i: i += 1, config: config})); 
		});
		return Promise.all(tests);
	});

	it("Drop self", function(){
		var tests = [], i = 0;
		servers.each(function(client){
			tests.push(client.run(function(test){
				var env = test.props;
				test.async();
				var peers = gun.back('opt.peers');
				var peer = peers[self_url];

				gun.get('test').on(function(a){ });

				setTimeout(function(){
					if(peers[self_url] || peer.wire){
						console.log("FAIL: should_not_have_self_anymore");
						should_not_have_self_anymore;
						return;
					}
					test.done();
				},99);
			}, {i: i += 1, config: config})); 
		});
		return Promise.all(tests);
	});

	it("All finished!", function(done){
		console.log("Done! Cleaning things up...");
		setTimeout(function(){
			done();
		},1);
	});

	after("Everything shut down.", function(){
		require('../util/open').cleanup();
		return servers.run(function(){
			process.exit();
		});
	});
});