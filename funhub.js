const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

// ================= CLOUDINARY =================
cloudinary.config({
  cloud_name: "dlttdzdr4",
  api_key: "265412444161116",
  api_secret: "YOUR_SECRET"
});

// ================= MONGODB =================
mongoose.connect("mongodb+srv://USER:PASSWORD@cluster0.oqekukf.mongodb.net/funhub")
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.log(err));

// ================= SCHEMAS =================
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const PostSchema = new mongoose.Schema({
  caption: String,
  mediaUrl: String,
  mediaType: String,
  reactions: {
    love:{type:Number,default:0},
    anger:{type:Number,default:0},
    kiss:{type:Number,default:0},
    hug:{type:Number,default:0},
    damn:{type:Number,default:0}
  },
  comments: { type:Number, default:0 },
  createdAt:{type:Date,default:Date.now}
});

const CommentSchema = new mongoose.Schema({
  postId:String,
  user:String,
  text:String,
  createdAt:{type:Date,default:Date.now}
});

const User = mongoose.model("User",UserSchema);
const Post = mongoose.model("Post",PostSchema);
const Comment = mongoose.model("Comment",CommentSchema);

// ================= AUTH =================
const SECRET="FUNHUB_SECRET";

app.post("/signup", async(req,res)=>{
  const hash = await bcrypt.hash(req.body.password,10);
  await User.create({name:req.body.name,email:req.body.email,password:hash});
  res.json({msg:"Signup Success"});
});

app.post("/login", async(req,res)=>{
  const user = await User.findOne({email:req.body.email});
  if(!user) return res.status(400).json({msg:"User not found"});
  const ok = await bcrypt.compare(req.body.password,user.password);
  if(!ok) return res.status(400).json({msg:"Wrong password"});
  const token = jwt.sign({id:user._id},SECRET);
  res.json({token});
});

// ================= UPLOAD =================
const upload = multer({dest:"uploads/"});

app.post("/upload", upload.single("file"), async(req,res)=>{
  const isVideo = req.file.mimetype.startsWith("video");
  const result = await cloudinary.uploader.upload(req.file.path,{
    resource_type:isVideo?"video":"image"
  });
  fs.unlinkSync(req.file.path);

  const post = await Post.create({
    caption:req.body.caption,
    mediaUrl:result.secure_url,
    mediaType:isVideo?"video":"image"
  });
  res.json(post);
});

// ================= REACTION =================
app.post("/react", async(req,res)=>{
  const {postId,type} = req.body;
  await Post.findByIdAndUpdate(postId,{
    $inc:{[`reactions.${type}`]:1}
  });
  res.json({success:true});
});

// ================= COMMENTS =================
app.post("/comment", async(req,res)=>{
  await Comment.create(req.body);
  await Post.findByIdAndUpdate(req.body.postId,{$inc:{comments:1}});
  res.json({success:true});
});

// ================= FEED =================
app.get("/feed", async(req,res)=>{
  const posts = await Post.aggregate([
    {$addFields:{
      score:{
        $add:[
          {$multiply:[
            {$add:[
              "$reactions.love",
              "$reactions.anger",
              "$reactions.kiss",
              "$reactions.hug",
              "$reactions.damn"
            ]},2]},
          "$comments"
        ]
      }
    }},
    {$sort:{score:-1,createdAt:-1}}
  ]);
  res.json(posts);
});

app.listen(5000,()=>console.log("🚀 Server started on port 5000"));
