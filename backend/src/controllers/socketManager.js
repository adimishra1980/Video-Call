import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {

    console.log("someone connected");


    socket.on("join-call", (path) => {
      try {

        if (connections[path] === undefined) {
          connections[path] = [];
        }
  
        connections[path].push(socket.id);
  
        timeOnline[socket.id] = new Date();
  
        // for (let a = 0; a < connections[path].length; a++) {
        //   io.to(connections[path][a]).emit(
        //     "user-joined",
        //     socket.id,
        //     connections[path]
        //   );
        // }

        connections[path].forEach(id => {
          io.to(id).emit("user-joined", socket.id, connections[path])
        });
  
        // console.log("messages: ", messages.path);


        //this code is doing when the new user joins the room, it gets the previous messages from that room
        if (messages[path] !== undefined) {
          for (let a = 0; a < messages[path].length; ++a) {
            io.to(socket.id).emit(
              "chat-message",
              messages[path][a]["data"],
              messages[path][a]["sender"],
              messages[path][a]["socketIdSender"]
            );
          }
        }

      } catch (error) {
        console.error("Error in join-call: ", error);
        // socket.emit("error", "An error occurred while joining the call.");  todo 
      }
    });


    //toId->which person i want to connect with(kisko bhej rhe h), message->offer or answer 
    //this listener is used to create direct p2p connection
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });
    // Handles peer-to-peer signaling by passing message (offer/answer) to a specific user (toId)



    socket.on("chat-message", (data, sender) => {


      // todo -- improve this code
      // let matchingRoom = null;
      // for(const [roomKey, roomValue] of Object.entries(connections)){

      //   if(roomValue.includes(socket.id)){
      //       matchingRoom = roomKey;
      //       break;
      //   }
      // }
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }

          return [room, isFound];
        },
        ["", false]
      );


      if (found) {

        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          "sender": sender,
          "data": data,
          "socketIdSender": socket.id,
        });

        // console.log("message from:", matchingRoom, ", ", `sender:`, sender, `, data:`, data );
        console.log(`Message from room: ${matchingRoom}, sender: ${sender}, data: ${data}`);


        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });


    try {
      socket.on("disconnect", () => {
  
        console.log("someone disconnected");
  
        if(timeOnline[socket.id]){
          let diffTime = Math.abs(timeOnline[socket.id] - new Date());

          const seconds = diffTime / 1000; 

          console.log(`User ${socket.id} was online for ${seconds} seconds`);
          delete timeOnline[socket.id]; 
        }
  



        let matchingRoom = Object.entries(connections).find(([room, users]) => users.includes(socket.id));
    
        if(!matchingRoom) return;

        let [roomKey, users] = matchingRoom;

        //here we are notifying only those user which are present on the room where the our user disconnects
        for(const userSocketId of users){
          try {
            io.to(userSocketId).emit("user-left", socket.id);
          } catch (error) {
            console.error(`Failed to notify ${userSocketId} about disconnection:`, error);
          }
        }

        //remove the user 
        users.splice(users.indexOf(socket.id), 1);

        if(users.length === 0){
          delete connections[roomKey];
        }
        
        
        
        
        // let key;
        // for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
        //   for (let a = 0; a < v.length; ++a) {

        //     //we are searching for the user who disconnected
        //     if (v[a] === socket.id) {
        //       key = k;
  
        //       for (let a = 0; a < connections[key].length; ++a) {
        //         io.to(connections[key][a]).emit("user-left", socket.id);
        //       }
  
        //       let index = connections[key].indexOf(socket.id);
        //       connections[key].splice(index, 1);
  
        //       if (connections[key].length === 0) {
        //         delete connections[key];
        //       }
        //     }
        //   }
        // }
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  });

  return io;
};
