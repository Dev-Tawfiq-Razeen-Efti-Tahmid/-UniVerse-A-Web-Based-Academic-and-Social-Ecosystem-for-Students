import channelObj from "../models/channel.js";



export const showForumCreate = (req, res) => {
  const userData = req.session?.userData;

  if (!userData) {
    return res.redirect("/api/login");
  }

  res.render("channelReg");
};


export const CreateChannel = async (req, res) => {
  const userData = req.session?.userData;
  if (!userData) {
    return res.redirect("/api/login");
  }
  try{
    const { channelName, channelDesc, channelTags } = req.body;
    const example ={
        channelName: req.body.name,
        channelDescription: req.body.description,
        ChannelTags: req.body.tags,
        ChannelOwner: userData.username,
        ChannelActiveCount: 0,
        ChannelUpvote: 0,
        ChannelDownvote: 0
    };
    console.log(example);
    await channelObj.create(example);
    console.log("Channel created:");
    return res.status(200).send("Server: Channel Created Successfully");
    }catch (error) {
    console.error("Error creating channel:", error);
    return res.status(500).send("Internal Server Error");
  }
};