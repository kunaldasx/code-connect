import { Server, type DefaultEventsMap } from "socket.io";

export function checkForInactivity(
	io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
	io.fetchSockets().then((sockets) => {
		if (sockets.length === 0) {
			console.log("No users have been connected for 15 seconds");
		}
	});
}
