
import channelObj from "../models/channel.js";

// const channels = [
//     {
//         name: "Quantum Physics",
//         subject: "Advanced Theory",
//         // >>> MAKE SURE THIS PROPERTY EXISTS AND HAS A VALUE <<<
//         description: "A deep dive into quantum mechanics, field theory, and modern physics concepts.",
//         tags: ["physics", "science", "advanced"],
//         activeMembers: 152
//     },
//     // ... other channels
//         {
//         name: "Quantum Physics",
//         subject: "Advanced Theory",
//         // >>> MAKE SURE THIS PROPERTY EXISTS AND HAS A VALUE <<<
//         description: "A deep dive into quantum mechanics, field theory, and modern physics concepts.",
//         tags: ["physics", "science", "advanced"],
//         activeMembers: 152
//     },
//     // ... other channels
//         {
//         name: "Quantum Physics",
//         subject: "Advanced Theory",
//         // >>> MAKE SURE THIS PROPERTY EXISTS AND HAS A VALUE <<<
//         description: "A deep dive into quantum mechanics, field theory, and modern physics concepts.",
//         tags: ["physics", "science", "advanced"],
//         activeMembers: 152
//     },
//     // ... other channels
//         {
//         name: "Quantum Physics",
//         subject: "Advanced Theory",
//         // >>> MAKE SURE THIS PROPERTY EXISTS AND HAS A VALUE <<<
//         description: "A deep dive into quantum mechanics, field theory, and modern physics concepts.",
//         tags: ["physics", "science", "advanced"],
//         activeMembers: 152
//     }
//     // ... other channels
// ];


export const showForumDashboard = async (req, res) => {
  const userData = req.session?.userData;

  // If user is not logged in → redirect to login page
  if (!userData) {
    return res.redirect("/api/login");
  }
  const store= await channelObj.find({});
  const channels=[];
    for(let i=0;i<store.length;i++){
      const idString = store[i]._id.toString();
        const temp ={
            id: idString,
            name: store[i].channelName,
            active: store[i].ChannelActiveCount,
            tags: store[i].ChannelTags,
            description: store[i].channelDescription
        };
        channels.push(temp);
        console.log(temp)
    }
  // userData exists, so we can safely use username
  res.render("forumDash", { channels });
};

