import { Socket } from "socket.io";
import { v4 as UUIDv4 } from "uuid";
import IRoomParams from "../interfaces/IRoomParams";

// the below map stores for a room what all peers have joined
// {1: [i1,u2,u3], 2:[u4,u5,u6]}
const rooms: Record<string, string[]> = {};

const roomHandler = (socket: Socket) => {
  const createRoom = () => {
    const roomId = UUIDv4(); // this will be our unique room id in which multiple connections will exchange data
    socket.join(roomId); // we will make the socket connection enter a new room

    rooms[roomId] = []; // create a new array for the room

    socket.emit("room-created", { roomId }); // we will emit an event from server side that socket connection has been added to a room
    console.log("Room created with id", roomId);
  };

  // The below function is executed every time a user(creator or joinee) joins a new room
  const joinedRoom = ({ roomId, peerId }: IRoomParams) => {
    console.log("joined room called", rooms);
    if (rooms[roomId]) {
      // If the given roomId exists in the memory db
      console.log(
        "New user has joined room ",
        roomId,
        " with peer id as",
        peerId
      );
      // the moment new user joins, add the peerId to the key of roomId
      rooms[roomId].push(peerId);
      console.log("added peer to room", rooms);
      socket.join(roomId); // make the user join the socket room

      // whenever anyone joins the room
      socket.on("ready",()=>{
        // from the frontend once someone joins the room we will emit a ready event
        // then from our server we will emit an event to all the cients connection 
        // that a new  peer has been added
        socket.to(roomId).emit("user-joined",{peerId});
      })

      // below event is for logging purpose
      socket.emit("get-users", {
        roomId,
        participants: rooms[roomId],
      });
    }
    console.log("New user has joined room", roomId, "with peer id as", peerId);
  };

  // When to call the above two functions?
  // We will call the above two function whem the client will emit events to create room and join room
  socket.on("create-room", createRoom);
  socket.on("joined-room", joinedRoom);
};

export default roomHandler;
