const router = require("express").Router();
const Post = require("../models/Post");
const auth = require("../middleware/authMiddleware");

/* ===== CREATE POST ===== */
router.post("/", auth, async(req,res)=>{
  const post = new Post({
    userId:req.user.id,
    media:req.body.media,
    caption:req.body.caption
  });
  await post.save();
  res.json(post);
});

/* ===== REACTION ===== */
router.put("/react/:id", async(req,res)=>{
  const {type} = req.body;

  let inc = {};
  inc[type] = 1;

  await Post.findByIdAndUpdate(req.params.id,{
    $inc:inc
  });

  res.json({msg:"Reaction added"});
});

/* ===== FEED ALGORITHM ===== */
router.get("/feed", async(req,res)=>{
  const posts = await Post.find().sort({
    likes:-1,
    createdAt:-1
  });

  res.json(posts);
});

module.exports = router;
