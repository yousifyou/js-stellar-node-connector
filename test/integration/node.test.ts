import { Node } from '../../src';
import { Connection } from '../../src';
import { xdr } from 'stellar-base';
import StellarMessage = xdr.StellarMessage;
import { getConfigFromEnv } from '../../src';

let nodeA: Node;
let nodeB: Node; //we don't want to connect the node to itself

let connectionToNodeA: Connection;

beforeAll(() => {
	nodeA = new Node(true, getConfigFromEnv()); //random public key
	nodeB = new Node(true, getConfigFromEnv()); //other random public key
	nodeA.acceptIncomingConnections(11623, '127.0.0.1');
	connectionToNodeA = nodeB.connectTo('127.0.0.1', 11623);
});

afterAll((done) => {
	connectionToNodeA.destroy();
	nodeA.stopAcceptingIncomingConnections(done);
});

test('connect', (done) => {
	let pingPongCounter = 0;
	nodeA.on('connection', (connectionToNodeB) => {
		connectionToNodeB.on('connect', () => {});
		connectionToNodeB.on('data', () => {
			//pong
			connectionToNodeB.sendStellarMessage(
				StellarMessage.getScpQuorumset(Buffer.alloc(32))
			);
		});
		connectionToNodeB.on('error', (error: Error) => console.log(error));
	});

	connectionToNodeA
		.on('connect', () => {
			//ping
			connectionToNodeA.sendStellarMessage(
				StellarMessage.getScpQuorumset(Buffer.alloc(32))
			);
		})
		.on('data', () => {
			pingPongCounter++;
			if (pingPongCounter > 100) done();
			else
				connectionToNodeA.sendStellarMessage(
					StellarMessage.getScpQuorumset(Buffer.alloc(32))
				);
		});
});
