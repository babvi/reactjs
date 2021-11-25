// import socketEmit from "../Barriers/socketEmit";

// const socketEmits = {
//     allOnlineNotifyGlobal(prop) {
//         prop.on(socketEmit.ALL_ONLINE_NOTIFY_GLOBAL, (data) => {
//             return data
//         });
//     },


//     notifyOnlineUser(prop) {
//         prop.on(socketEmit.NOTIFY_ONLINE_USER, (data) => {
//             if (data) {
//                 return data
//             }
//         });
//     },
    
//     notifyTypingGlobal(prop) {
//         prop.on(socketEmit.NOTIFY_TYPING_GLOBAL, (data) => {
//             if (data) {
//                 return data
//             }
//         });
//     },

//     notifyStopTypingGlobal(prop) {
//         prop.on(socketEmit.NOTIFY_STOP_TYPING_GLOBAL, (data) => {
//             if (data) {
//                 return data
//             }
//         });
//     },
//     notifyUnreadGlobal(prop) {
//         prop.on(socketEmit.NOTIFY_UNREAD_GLOBAL, (data) => {
//             if (data) {
//                 return data
//             }
//         });
//     }
// }

// export default socketEmits